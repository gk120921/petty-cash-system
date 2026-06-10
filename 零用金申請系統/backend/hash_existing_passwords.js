const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'petty_cash.db');
const db = new sqlite3.Database(dbPath);

console.log('--- Database Security Migration (Password Hashing) ---');

db.serialize(() => {
  db.all("SELECT id, name, password FROM personnel", [], async (err, rows) => {
    if (err) {
      console.error('Failed to fetch personnel:', err.message);
      return;
    }

    console.log(`Found ${rows.length} users to check...`);

    for (const row of rows) {
      const { id, name, password } = row;
      
      // Check if already hashed (bcrypt hashes start with $2a$ or $2b$)
      if (password && (password.startsWith('$2a$') || password.startsWith('$2b$'))) {
        console.log(`[SKIP] User "${name}" is already hashed.`);
        continue;
      }

      console.log(`[HASHING] Securing password for user: ${name}...`);
      
      try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password || '123456', salt);
        
        await new Promise((resolve, reject) => {
          db.run("UPDATE personnel SET password = ? WHERE id = ?", [hashedPassword, id], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        console.log(`[OK] User "${name}" secured.`);
      } catch (err) {
        console.error(`[ERROR] Failed to hash user "${name}":`, err.message);
      }
    }

    console.log('\n--- Migration Finished! All passwords are now secured. ---');
    db.close();
  });
});
