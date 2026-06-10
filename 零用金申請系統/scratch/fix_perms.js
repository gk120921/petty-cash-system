const db = require('../backend/database');

console.log('--- Updating Role Permissions to include Archive ---');

db.serialize(() => {
  db.all("SELECT * FROM settings WHERE key LIKE 'perms_%'", [], (err, rows) => {
    if (err) {
      console.error('Error fetching permissions:', err.message);
      return;
    }

    if (rows.length === 0) {
      console.log('No roles found in settings table. Creating default perms_admin...');
      const defaultAdmin = JSON.stringify({
        modules: { dashboard: true, ledger: true, suppliers: true, archive: true, permissions: true, settings: true },
        actions: { add: true, edit: true, delete: true, payment: true, archive: true, restore: true, export: true }
      });
      db.run("INSERT INTO settings (key, value) VALUES ('perms_admin', ?)", [defaultAdmin], (err) => {
        if (err) console.error('Failed to insert perms_admin:', err.message);
        else console.log('Successfully created perms_admin');
      });
    } else {
      rows.forEach(row => {
        try {
          const perms = JSON.parse(row.value);
          // Add archive module and restore action
          if (perms.modules) perms.modules.archive = true;
          if (perms.actions) perms.actions.restore = true;
          
          const updatedValue = JSON.stringify(perms);
          db.run("UPDATE settings SET value = ? WHERE key = ?", [updatedValue, row.key], (err) => {
            if (err) console.error(`Failed to update ${row.key}:`, err.message);
            else console.log(`Updated ${row.key} successfully.`);
          });
        } catch (e) {
          console.error(`Error processing ${row.key}:`, e.message);
        }
      });
    }
    
    // Also update current user role if needed, but since we update all perms_*, it should work
    setTimeout(() => {
      db.close();
      console.log('--- Permissions Update Finished ---');
    }, 1000);
  });
});
