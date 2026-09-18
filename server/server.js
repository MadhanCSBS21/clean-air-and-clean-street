import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';

const app = express();
app.use(cors());

// Increase payload limits for base64 image strings
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const sqlite = sqlite3.verbose();
const db = new sqlite.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Create table with all required fields (added userImage & upvotes)
db.serialize(() => {
db.run(`CREATE TABLE IF NOT EXISTS incidents (
  id INTEGER PRIMARY KEY,
  fullName TEXT,
  wasteCategory TEXT,
  department TEXT,
  priority TEXT,
  location TEXT,
  district TEXT,
  description TEXT,
  status TEXT,
  progressPct INTEGER,
  assignedTeam TEXT,
  lat TEXT,
  lng TEXT,
  createdAt TEXT,
  userImage TEXT,
  upvotes INTEGER DEFAULT 1,
  adminProofUrl TEXT,
  resolutionNotes TEXT
)`);

  ['userImage TEXT', 'upvotes INTEGER DEFAULT 1', 'adminProofUrl TEXT', 'resolutionNotes TEXT'].forEach((column) => {
    db.run(`ALTER TABLE incidents ADD COLUMN ${column}`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error(`Database migration failed for ${column}:`, err.message);
      }
    });
  });
});

// Endpoint: Fetch all incidents
app.get('/api/incidents', (req, res) => {
  db.all('SELECT * FROM incidents ORDER BY id DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Endpoint: Save a new incident
app.post('/api/incidents', (req, res) => {
  const {
    id, fullName, wasteCategory, department, priority,
    location, district, description, status, progressPct,
    assignedTeam, coords, createdAt, userImage, upvotes
  } = req.body;

  const query = `INSERT INTO incidents (
    id, fullName, wasteCategory, department, priority,
    location, district, description, status, progressPct,
    assignedTeam, lat, lng, createdAt, userImage, upvotes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const values = [
    id, fullName, wasteCategory, department, priority,
    location, district, description, status, progressPct,
    assignedTeam, coords ? coords.lat : '', coords ? coords.lng : '', 
    createdAt, userImage || null, upvotes || 1
  ];

  db.run(query, values, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Incident saved successfully', id: id });
  });
});

// Endpoint: Update incident status, assigned team, upvotes, or proof
app.put('/api/incidents/:id', (req, res) => {
  const { status, progressPct, assignedTeam, priority, upvotes, adminProofUrl, resolutionNotes } = req.body;
  
  const query = `UPDATE incidents SET 
    status = COALESCE(?, status), 
    progressPct = COALESCE(?, progressPct), 
    assignedTeam = COALESCE(?, assignedTeam), 
    priority = COALESCE(?, priority), 
    upvotes = COALESCE(?, upvotes), 
    adminProofUrl = COALESCE(?, adminProofUrl),
    resolutionNotes = COALESCE(?, resolutionNotes)
    WHERE id = ?`;

  db.run(query, [status, progressPct, assignedTeam, priority, upvotes, adminProofUrl, resolutionNotes, req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Incident updated successfully' });
  });
});

// Endpoint: Delete Incident
app.delete('/api/incidents/:id', (req, res) => {
  db.run('DELETE FROM incidents WHERE id = ?', [req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Incident deleted successfully' });
  });
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});