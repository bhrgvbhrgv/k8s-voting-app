const express = require('express');
const { Pool } = require('pg');
const cookieParser = require('cookie-parser');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

const port = process.env.PORT || 80;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@db/postgres',
});

io.on('connection', (socket) => {
  console.log('Client connected to socket');
  socket.emit('message', { text: 'Welcome!' });

  socket.on('subscribe', (data) => {
    socket.join(data.channel);
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

// Serve compiled React build
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

server.listen(port, () => {
  console.log(`Result app running on port ${port}`);
});
