const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./petty_cash.db');

const suppliers = [
  'airtel', 'Seoul Store', 'Amul', 'Mother Dairy', 'Delhi Metro', 'Big Bazaar', 'Reliance', 'Swiggy', 'Zomato', 'Uber', 'Ola', 'Amazon', 'Flipkart', 'Myntra', 'Snapdeal', 'Jabong', 'Ajio', 'Tata Cliq', 'Nykaa', 'FirstCry', 'Lenskart', 'UrbanClap', 'Netmeds', '1mg', 'Pharmeasy', 'Medlife', 'Apollo', 'BookMyShow', 'PVR', 'INOX', 'Carnival', 'Cinepolis', 'Zoomcar', 'Revv', 'Drivezy', 'Bounce'
];

const personnel = ['義昌', 'Godson', 'Joseph', 'Kabir', 'shanka'];

db.serialize(() => {
  const stmtSup = db.prepare("INSERT OR IGNORE INTO suppliers (name) VALUES (?)");
  suppliers.forEach(s => stmtSup.run(s));
  stmtSup.finalize();

  const stmtPer = db.prepare("INSERT OR IGNORE INTO personnel (name) VALUES (?)");
  personnel.forEach(p => stmtPer.run(p));
  stmtPer.finalize();
  
  console.log('Original Suppliers and Personnel seeded successfully.');
});

db.close();
