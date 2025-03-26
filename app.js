const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const bodyParser = require("body-parser");
require("dotenv").config(); // Load environment variables

const db = require("./db"); // Import SQLite connection

const app = express();
const port = process.env.PORT || 5000;

app.use(express.static("public"));
app.use(expressLayouts);
app.use(bodyParser.urlencoded({ extended: true })); // Parse form data
app.use(express.json());
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Home route
app.get("/", (req, res) => {
  res.render("home");
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/products", (req, res) => {
  res.render("products");
});


app.get("/find-your-fragrance", (req, res) => {
  res.render("find-your-fragrance");
});


app.get("/cart", (req, res) => {
  res.render("cart");
});




// Display all products
app.get("/products-list", (req, res) => {
  db.all("SELECT * FROM products", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.render("products-list", { products: rows });
  });
});

app.get("/admin", (req, res) => {
  res.render("admin");
});

// Admin form page
app.get("/create-products", (req, res) => {
  res.render("admin-create-products");
});

app.get("/manage-products", (req, res) => {
  db.all("SELECT * FROM products", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.render("admin-manage-products", { products: rows });
  });
});

app.get('/admin-manage-products', (req, res) => {
  // Fetch products from your database
  db.query('SELECT * FROM products', (err, products) => {
      if (err) {
          console.error(err);
          return res.status(500).send('Database error');
      }
      res.render('manage-products', { products }); // Ensure 'manage-products.ejs' exists
  });
});

// Handle form submission from /admin-products
app.post("/add-product", (req, res) => {
  const { stock_id, price, quantity, description, category, ingredients, gender } = req.body;

  if (!stock_id || !price || !quantity || !description || !category || !ingredients || !gender) {
    return res.status(400).send("All fields are required.");
  }

  const query = `
    INSERT INTO products (stock_id, price, quantity, description, category, ingredients, gender)
    VALUES (?, ?, ?, ?, ?, ?, ?)`;

  db.run(query, [stock_id, price, quantity, description, category, ingredients, gender], function (err) {
    if (err) {
      return res.status(500).send("Error inserting data: " + err.message);
    }
    res.redirect("/products-list"); // Redirect to products page after submission
  });
});

app.post("/update-product", (req, res) => {
  const { stock_id, price, quantity, description, category, ingredients, gender } = req.body;

  if (!stock_id) {
    return res.status(400).send("Product ID is required.");
  }

  const query = `
    UPDATE products 
    SET price = ?, quantity = ?, description = ?, category = ?, ingredients = ?, gender = ? 
    WHERE stock_id = ?`;

  db.run(query, [price, quantity, description, category, ingredients, gender, stock_id], function (err) {
    if (err) {
      return res.status(500).send("Error updating product: " + err.message);
    }
    res.redirect("/manage-products");
  });
});

app.post("/delete-product", (req, res) => {
  const { product_id } = req.body;

  if (!product_id) {
    return res.status(400).send("Product ID is required.");
  }

  db.run("DELETE FROM products WHERE stock_id = ?", [product_id], function (err) {
    if (err) {
      return res.status(500).send("Error deleting product: " + err.message);
    }
    res.redirect("/manage-products");
  });
});

app.listen(port, () => console.info(`🚀 Server running on port ${port}`));
