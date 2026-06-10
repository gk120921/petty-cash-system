const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function check() {
    const db = await open({
        filename: path.join(__dirname, 'procurement.db'),
        driver: sqlite3.Database
    });

    console.log("--- Purchase Requests ---");
    const prs = await db.all("SELECT * FROM purchase_requests");
    console.log(JSON.stringify(prs, null, 2));

    console.log("\n--- PR Items ---");
    const items = await db.all("SELECT * FROM pr_items");
    console.log(JSON.stringify(items, null, 2));

    await db.close();
}

check();
