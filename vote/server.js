const express = require('express');
const cookieParser = require('cookie-parser');
const { Pool } = require('pg');
const crypto = require('crypto');
const os = require('os');
const path = require('path');

const app = express();
const port = process.env.PORT || 80;

const option_a = process.env.OPTION_A || 'Cats';
const option_b = process.env.OPTION_B || 'Dogs';
const hostname = os.hostname();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@db/postgres',
});

// Auto-create votes table if not exists
async function initDb() {
  let connected = false;
  while (!connected) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS votes (
          id VARCHAR(255) NOT NULL PRIMARY KEY,
          vote VARCHAR(255) NOT NULL
        )
      `);
      console.log('Connected to PostgreSQL and verified votes table');
      connected = true;
    } catch (err) {
      console.error('Waiting for database connection...', err.message);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}
initDb();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper to ensure voter_id cookie
function getOrCreateVoterId(req, res) {
  let voterId = req.cookies.voter_id;
  if (!voterId) {
    voterId = crypto.randomBytes(8).toString('hex');
    res.cookie('voter_id', voterId, { maxAge: 365 * 24 * 60 * 60 * 1000 });
  }
  return voterId;
}

// Config endpoint for React frontend
app.get('/api/config', async (req, res) => {
  const voterId = getOrCreateVoterId(req, res);
  let existingVote = null;
  try {
    const dbRes = await pool.query('SELECT vote FROM votes WHERE id = $1', [voterId]);
    if (dbRes.rows.length > 0) {
      existingVote = dbRes.rows[0].vote;
    }
  } catch (err) {
    console.error('Error fetching existing vote:', err.message);
  }

  res.json({
    option_a,
    option_b,
    hostname,
    voter_id: voterId,
    vote: existingVote,
  });
});

// JSON API endpoint for voting (React app)
app.post('/api/vote', async (req, res) => {
  const voterId = getOrCreateVoterId(req, res);
  const vote = req.body.vote;

  if (!vote || (vote !== 'a' && vote !== 'b')) {
    return res.status(400).json({ success: false, error: 'Invalid vote option' });
  }

  try {
    await pool.query(
      `INSERT INTO votes (id, vote)
       VALUES ($1, $2)
       ON CONFLICT (id) DO UPDATE SET vote = EXCLUDED.vote`,
      [voterId, vote]
    );
    console.log(`Vote registered: voter_id=${voterId}, vote=${vote}`);
    res.json({ success: true, voter_id: voterId, vote });
  } catch (err) {
    console.error('Database error while saving vote:', err.message);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// Legacy HTML form POST support (compatibility with curl or seed-data scripts)
app.post('/', async (req, res) => {
  const voterId = getOrCreateVoterId(req, res);
  const vote = req.body.vote;

  if (vote && (vote === 'a' || vote === 'b')) {
    try {
      await pool.query(
        `INSERT INTO votes (id, vote)
         VALUES ($1, $2)
         ON CONFLICT (id) DO UPDATE SET vote = EXCLUDED.vote`,
        [voterId, vote]
      );
      console.log(`Form vote registered: voter_id=${voterId}, vote=${vote}`);
    } catch (err) {
      console.error('Database error on form vote:', err.message);
    }
  }

  res.redirect('/');
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

app.listen(port, () => {
  console.log(`Vote service running on port ${port}`);
});
