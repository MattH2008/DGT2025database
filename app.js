const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const session = require("express-session"); 
require("dotenv").config();

const app = express();

app.use(session({
  secret: "secretStatzoneKey",
  resave: false,
  saveUninitialized: false
}));

// Set up database connection
const db = new sqlite3.Database("./db/football.db", (err) => {
  if (err) return console.error("DB Connection Error:", err.message);
  console.log("📂 Connected to football.db");

  db.run(`CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    team TEXT,
    goals INTEGER,
    assists INTEGER,
    touches INTEGER,
    dribbles INTEGER,
    passes INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team1 TEXT,
    team2 TEXT,
    date TEXT,
    score1 INTEGER,
    score2 INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
  )`);
});

// Middleware
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ✅ Login middleware
function requireLogin(req, res, next) {
  if (req.session.loggedIn) return next();
  else res.redirect("/login");
}

// ✅ Login routes
app.get("/login", (req, res) => {
  res.render("login", { title: "Login", error: null });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!req.session.loginAttempts) {
    req.session.loginAttempts = 0;
  }

  if (username === "admin" && password === "statszone123") {
    req.session.loggedIn = true;
    req.session.loginAttempts = 0;
    return res.redirect("/crud");
  } else {
    req.session.loginAttempts += 1;

    if (req.session.loginAttempts >= 3) {
      req.session.loginAttempts = 0;
      return res.redirect("/");
    }

    return res.render("login", {
      title: "Login",
      error: `Invalid username or password. Attempts left: ${3 - req.session.loginAttempts}`
    });
  }
});

// Pages
app.get("/", (req, res) => {
  res.render("home", { title: "Home" });
});

app.get("/players", (req, res) => {
  const stats = ["goals", "assists", "touches", "dribbles", "passes"];
  const queries = stats.map(stat => {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM players ORDER BY ${stat} DESC LIMIT 10`, (err, rows) => {
        if (err) reject(err);
        else resolve({ stat, rows });
      });
    });
  });

  Promise.all(queries)
    .then(results => {
      const leaderboards = {};
      results.forEach(({ stat, rows }) => {
        leaderboards[stat] = rows;
      });
      res.render("players", { title: "Players Leaderboards", leaderboards });
    })
    .catch(err => {
      console.error("Leaderboard query error:", err);
      res.sendStatus(500);
    });
});

app.get("/matches", (req, res) => {
  db.all("SELECT * FROM matches", (err, rows) => {
    if (err) throw err;
    res.render("matches", { title: "Matches", matches: rows });
  });
});

app.get("/crud", requireLogin, (req, res) => {
  res.render("crud", { title: "Manage Data" });
});

app.get("/players_crud", requireLogin, (req, res) => {
  db.all("SELECT * FROM players", (err, players) => {
    if (err) throw err;
    db.all("SELECT * FROM teams", (err2, teams) => {
      if (err2) throw err2;
      res.render("players_crud", {
        title: "Manage Players",
        players,
        teams
      });
    });
  });
});

app.post("/crud/add", requireLogin, (req, res) => {
  const { name, team, goals, assists, touches, dribbles, passes } = req.body;
  db.run(
    `INSERT INTO players 
     (name, team, goals, assists, touches, dribbles, passes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, team, goals, assists, touches, dribbles, passes],
    (err) => {
      if (err) throw err;
      res.redirect("/players_crud");
    }
  );
});

app.post("/crud/edit", requireLogin, (req, res) => {
  const { id, name, team, goals, assists, touches, dribbles, passes } = req.body;
  db.run(`UPDATE players SET 
    name = ?, team = ?, goals = ?, assists = ?, touches = ?, 
    dribbles = ?, passes = ? WHERE id = ?`,
    [name, team, goals, assists, touches, dribbles, passes, id],
    (err) => {
      if (err) throw err;
      res.redirect("/players_crud");
    }
  );
});

app.post("/crud/delete/:id", requireLogin, (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM players WHERE id = ?", [id], (err) => {
    if (err) throw err;
    res.redirect("/players_crud");
  });
});

app.get("/teams_crud", requireLogin, (req, res) => {
  db.all("SELECT * FROM teams", (err, teams) => {
    if (err) throw err;
    res.render("teams_crud", { title: "Manage Teams", teams });
  });
});

app.post("/teams_crud/add", requireLogin, (req, res) => {
  const { name } = req.body;
  db.run("INSERT INTO teams (name) VALUES (?)", [name], (err) => {
    if (err) throw err;
    res.redirect("/teams_crud");
  });
});

app.post("/teams_crud/delete/:id", requireLogin, (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM teams WHERE id = ?", [id], (err) => {
    if (err) throw err;
    res.redirect("/teams_crud");
  });
});

app.get("/matches_crud", requireLogin, (req, res) => {
  db.all("SELECT * FROM teams", (err, teams) => {
    if (err) throw err;
    db.all("SELECT * FROM matches", (err2, matches) => {
      if (err2) throw err2;
      res.render("matches_crud", { title: "Manage Matches", teams, matches });
    });
  });
});

app.post("/matches_crud/add", requireLogin, (req, res) => {
  const { team1, team2, date, score1, score2 } = req.body;

  // ✅ Server-side date format validation (YYYY-MM-DD with 4-digit year)
  const validDateFormat = /^\d{4}-\d{2}-\d{2}$/;
  if (!validDateFormat.test(date)) {
    return res.status(400).send("Invalid date format. Use YYYY-MM-DD with a 4-digit year.");
  }

  db.run(`INSERT INTO matches (team1, team2, date, score1, score2)
          VALUES (?, ?, ?, ?, ?)`,
    [team1, team2, date, score1, score2], (err) => {
      if (err) throw err;
      res.redirect("/matches_crud");
    });
});

app.post("/matches_crud/delete/:id", requireLogin, (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM matches WHERE id = ?", [id], (err) => {
    if (err) throw err;
    res.redirect("/matches_crud");
  });
});

app.post("/matches_crud/edit", requireLogin, (req, res) => {
  const { id, team1, team2, date, score1, score2 } = req.body;

  const validDateFormat = /^\d{4}-\d{2}-\d{2}$/;
  if (!validDateFormat.test(date)) {
    return res.status(400).send("Invalid date format. Use YYYY-MM-DD with a 4-digit year.");
  }

  db.run(`UPDATE matches SET team1 = ?, team2 = ?, date = ?, score1 = ?, score2 = ?
          WHERE id = ?`,
    [team1, team2, date, score1, score2, id], (err) => {
      if (err) throw err;
      res.redirect("/matches_crud");
    });
});

app.listen(3000, () => console.log("✅ http://localhost:3000"));
