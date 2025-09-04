const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname)));


app.get("/", (req, res) => res.sendFile(path.join(__dirname, "CA.html")));
app.get("/authority", (req, res) => res.sendFile(path.join(__dirname, "authority.html")));

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "#17624@",
  database: "sust_cafeteria_db",
});

db.connect(err => {
  if (err) {
    console.error("MySQL connect error:", err);
    process.exit(1);
  }
  console.log("Connected to MySQL database!");
});


app.get("/menu", (req, res) => {
  db.query("SELECT * FROM menu_items", (err, results) => {
    if (err) {
      console.error("SELECT error:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});


app.post("/menu", (req, res) => {
  const { name, price } = req.body;
  db.query(
    "INSERT INTO menu_items (name, price) VALUES (?, ?)",
    [name, price],
    (err, result) => {
      if (err) {
        console.error("INSERT error:", err);
        return res.status(500).json({ error: err.message });
      }
      io.emit("menuUpdated");
      res.json({ success: true, id: result.insertId });
    }
  );
});


app.delete("/menu/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM menu_items WHERE id = ?", [id], (err) => {
    if (err) {
      console.error("DELETE error:", err);
      return res.status(500).json({ error: err.message });
    }
    io.emit("menuUpdated");
    res.json({ success: true });
  });
});


app.put("/menu/:id", (req, res) => {
  const { id } = req.params;
  const { name, price } = req.body;
  db.query(
    "UPDATE menu_items SET name=?, price=? WHERE id=?",
    [name, price, id],
    (err) => {
      if (err) {
        console.error("UPDATE error:", err);
        return res.status(500).json({ error: err.message });
      }
      io.emit("menuUpdated");
      res.json({ success: true });
    }
  );
});

io.on("connection", () => console.log("Socket connected"));

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

//node server.js