const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./nexus_master.db');
db.get("SELECT * FROM users WHERE username = 'admin'", (err, row) => {
    if (err) {
        console.error(err);
    } else {
        console.log(JSON.stringify(row, null, 2));
    }
    db.close();
});
