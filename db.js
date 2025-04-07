const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("data.db", (err) => {
    if (err) {
        console.error("Error opening database", err.message);
    } else {
        console.log("Connected to SQLite database.");
        db.run(`
            CREATE TABLE IF NOT EXISTS products (
                stock_id INTEGER PRIMARY KEY,
                scents TEXT NOT NULL,
                price INTEGER NOT NULL,
                quantity INTEGER NOT NULL,
                description TEXT NOT NULL,
                category TEXT NOT NULL,
                ingredients TEXT NOT NULL,
                gender TEXT CHECK(gender IN ('Male', 'Female', 'Unisex')) NOT NULL
            )
        `, (err) => {
            if (err) {
                console.error("Error creating table", err.message);
            } else {
                console.log("Table 'products' is ready.");
            }
        });
    }
});

module.exports = db;