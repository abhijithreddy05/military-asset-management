const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.resolve(__dirname, 'military_assets.db');
const db = new sqlite3.Database(dbPath);

const initDb = () => {
  db.serialize(async () => {
    // Bases Table
    db.run(`CREATE TABLE IF NOT EXISTS bases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT NOT NULL
    )`);

    // Users Table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      base_id INTEGER,
      FOREIGN KEY(base_id) REFERENCES bases(id)
    )`);

    // Assets Table
    db.run(`CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL
    )`);

    // Inventory Table
    db.run(`CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER NOT NULL,
      base_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      UNIQUE(asset_id, base_id),
      FOREIGN KEY(asset_id) REFERENCES assets(id),
      FOREIGN KEY(base_id) REFERENCES bases(id)
    )`);

    // Transactions Table
    db.run(`CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_type TEXT NOT NULL,
      asset_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      from_base_id INTEGER,
      to_base_id INTEGER,
      assigned_to TEXT,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER NOT NULL,
      FOREIGN KEY(asset_id) REFERENCES assets(id),
      FOREIGN KEY(from_base_id) REFERENCES bases(id),
      FOREIGN KEY(to_base_id) REFERENCES bases(id),
      FOREIGN KEY(created_by) REFERENCES users(id)
    )`);

    // Seed Data
    db.get("SELECT COUNT(*) AS count FROM bases", async (err, row) => {
      if (row.count === 0) {
        // Bases
        const bases = [
          ['Central Command HQ', 'Washington D.C.'],
          ['Alpha Base', 'Nevada'],
          ['Bravo Base', 'Texas']
        ];
        const stmtBase = db.prepare('INSERT INTO bases (name, location) VALUES (?, ?)');
        bases.forEach(b => stmtBase.run(b));
        stmtBase.finalize();

        // Assets
        const assets = [
          ['Humvee', 'Vehicle'],
          ['M1 Abrams', 'Vehicle'],
          ['M4 Carbine', 'Weapon'],
          ['M240 Machine Gun', 'Weapon'],
          ['5.56mm Ammo Box', 'Ammunition'],
          ['120mm Tank Shell', 'Ammunition']
        ];
        const stmtAsset = db.prepare('INSERT INTO assets (name, category) VALUES (?, ?)');
        assets.forEach(a => stmtAsset.run(a));
        stmtAsset.finalize();

        // Users
        const hashedPassword = await bcrypt.hash('password123', 10);
        const users = [
          ['admin', hashedPassword, 'Admin', null],
          ['commander_alpha', hashedPassword, 'Base Commander', 2],
          ['logistics_alpha', hashedPassword, 'Logistics Officer', 2],
          ['commander_bravo', hashedPassword, 'Base Commander', 3],
          ['logistics_bravo', hashedPassword, 'Logistics Officer', 3]
        ];
        const stmtUser = db.prepare('INSERT INTO users (username, password, role, base_id) VALUES (?, ?, ?, ?)');
        users.forEach(u => stmtUser.run(u));
        stmtUser.finalize();

        // Initial Inventory for Alpha Base
        const inventory = [
          [1, 2, 5],    // 5 Humvees at Alpha
          [3, 2, 100],  // 100 M4s at Alpha
          [5, 2, 500]   // 500 Ammo boxes at Alpha
        ];
        const stmtInv = db.prepare('INSERT INTO inventory (asset_id, base_id, quantity) VALUES (?, ?, ?)');
        inventory.forEach(i => stmtInv.run(i));
        stmtInv.finalize();

        console.log("Database seeded successfully.");
      }
    });
  });
};

module.exports = { db, initDb };
