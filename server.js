import express from 'express';
import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 80;

// Initialize SQLite database
const dbPath = process.env.DB_PATH || join(__dirname, 'data', 'tldraw.db');
const dbDir = dirname(dbPath);

// Ensure data directory exists
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

const SQL = await initSqlJs();
let db;

// Load existing database or create new one
if (existsSync(dbPath)) {
  const buffer = readFileSync(dbPath);
  db = new SQL.Database(buffer);
} else {
  db = new SQL.Database();
}

// Create tables if they don't exist
db.run(`
  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    snapshot TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Save database to file
function saveDatabase() {
  const data = db.export();
  writeFileSync(dbPath, data);
}

// Serve static files from dist directory
app.use(express.static(join(__dirname, 'dist')));
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Get document snapshot
app.get('/api/document/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('SELECT snapshot FROM documents WHERE id = ?');
    stmt.bind([id]);

    if (stmt.step()) {
      const row = stmt.getAsObject();
      res.json({ snapshot: JSON.parse(row.snapshot) });
    } else {
      res.status(404).json({ error: 'Document not found' });
    }
    stmt.free();
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// Save document snapshot
app.post('/api/document/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { snapshot } = req.body;

    if (!snapshot) {
      return res.status(400).json({ error: 'Snapshot is required' });
    }

    db.run(`
      INSERT OR REPLACE INTO documents (id, snapshot, updated_at)
      VALUES (?, ?, datetime('now'))
    `, [id, JSON.stringify(snapshot)]);

    saveDatabase();
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving document:', error);
    res.status(500).json({ error: 'Failed to save document' });
  }
});

// List all documents
app.get('/api/documents', (req, res) => {
  try {
    const stmt = db.prepare('SELECT id, updated_at FROM documents ORDER BY updated_at DESC');
    const documents = [];

    while (stmt.step()) {
      documents.push(stmt.getAsObject());
    }
    stmt.free();

    res.json({ documents });
  } catch (error) {
    console.error('Error listing documents:', error);
    res.status(500).json({ error: 'Failed to list documents' });
  }
});

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database location: ${dbPath}`);
});
