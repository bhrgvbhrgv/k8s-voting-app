const express = require('express');
const { Pool } = require('pg');
const cookieParser = require('cookie-parser');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const client = require('prom-client');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

// Prometheus metrics setup
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

const connectedClientsGauge = new client.Gauge({
  name: 'votingapp_result_connected_clients',
  help: 'Number of active WebSocket clients on result service',
});

const voteCountGauge = new client.Gauge({
  name: 'votingapp_current_votes',
  help: 'Current votes count per option',
  labelNames: ['option'],
});

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

const port = process.env.PORT || 80;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@db/postgres',
});

io.on('connection', (socket) => {
  console.log('Client connected to socket');
  connectedClientsGauge.inc();
  socket.emit('message', { text: 'Welcome!' });

  socket.on('subscribe', (data) => {
    socket.join(data.channel);
  });

  socket.on('disconnect', () => {
    connectedClientsGauge.dec();
  });
});

async function connectWithRetry() {
  while (true) {
    try {
      const client = await pool.connect();
      console.log('Connected to PostgreSQL successfully');
      client.release();
      startPolling();
      break;
    } catch (err) {
      console.error('Waiting for database connection...', err.message);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

function startPolling() {
  setInterval(async () => {
    try {
      const result = await pool.query('SELECT vote, COUNT(id) AS count FROM votes GROUP BY vote');
      const votes = { a: 0, b: 0 };
      result.rows.forEach((row) => {
        votes[row.vote] = parseInt(row.count, 10);
      });
      voteCountGauge.set({ option: 'a' }, votes.a || 0);
      voteCountGauge.set({ option: 'b' }, votes.b || 0);
      io.emit('scores', votes);
    } catch (err) {
      // Table may not exist yet if no vote has been cast
    }
  }, 1000);
}

connectWithRetry();

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Track HTTP requests
app.use((req, res, next) => {
  res.on('finish', () => {
    const route = req.route ? req.route.path : req.path;
    httpRequestsTotal.inc({ method: req.method, route, status: res.statusCode });
  });
  next();
});

// API endpoint to get current counts directly
app.get('/api/scores', async (req, res) => {
  try {
    const result = await pool.query('SELECT vote, COUNT(id) AS count FROM votes GROUP BY vote');
    const votes = { a: 0, b: 0 };
    result.rows.forEach((row) => {
      votes[row.vote] = parseInt(row.count, 10);
    });
    res.json(votes);
  } catch (err) {
    res.json({ a: 0, b: 0 });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
});

// Serve compiled React build
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

server.listen(port, () => {
  console.log(`Result app running on port ${port}`);
});
