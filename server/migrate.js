import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve('server', 'reports.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  const columns = [
    "ALTER TABLE reports ADD COLUMN department TEXT DEFAULT 'General Maintenance'",
    "ALTER TABLE reports ADD COLUMN incident_image TEXT",
    "ALTER TABLE reports ADD COLUMN resolution_image TEXT",
    "ALTER TABLE reports ADD COLUMN resolution_notes TEXT",
    "ALTER TABLE reports ADD COLUMN resolved_at DATETIME"
  ];

  columns.forEach((sql) => {
    db.run(sql, (err) => {
      if (err) {
        // Ignore error if column already exists
        if (!err.message.includes('duplicate column name')) {
          console.log(`Migration note: ${err.message}`);
        }
      } else {
        console.log(`Successfully executed: ${sql}`);
      }
    });
  });
});

console.log('Database schema check completed.');