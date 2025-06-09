const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const db = new sqlite3.Database("./db/football.db");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// Create table if not exists
db.run(`CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  team TEXT,
  goals INTEGER
)`);

// Home page
app.get("/", (req, res) => {
  res.render("home");
});

// Show all players
app.get("/players", (req, res) => {
  db.all("SELECT * FROM players", (err, rows) => {
    if (err) return res.send("DB error");
    res.render("players", { players: rows });
  });
});

// Show form + players list
app.get("/crud", (req, res) => {
  db.all("SELECT * FROM players", (err, rows) => {
    if (err) return res.send("DB error");
    res.render("crud", { players: rows });
  });
});

// Add player
app.post("/crud/add", (req, res) => {
  const { name, team, goals } = req.body;
  db.run("INSERT INTO players (name, team, goals) VALUES (?, ?, ?)", [name, team, goals], () => {
    res.redirect("/crud");
  });
});

// Delete player
app.post("/crud/delete/:id", (req, res) => {
  db.run("DELETE FROM players WHERE id = ?", [req.params.id], () => {
    res.redirect("/crud");
  });
});

app.listen(3000, () => console.log("✅ http://localhost:3000"));
