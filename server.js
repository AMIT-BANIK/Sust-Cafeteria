const express = require("express");
const mysql = require("mysql");
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
  console.log("✅ Connected to MySQL database!");
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


app.get("/orders", (req, res) => {
  db.query("SELECT * FROM orders ORDER BY created_at DESC", (err, results) => {
    if (err) {
      console.error("SELECT orders error:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

app.post("/orders", (req, res) => {
  const { items, total, order_code } = req.body;

  if (!order_code) {
    return res.status(400).json({ error: "order_code is required" });
  }

  const itemsParsed = Array.isArray(items) ? items : JSON.parse(items);

  db.query(
    "INSERT INTO orders (order_code, items, total, status, created_at) VALUES (?, ?, ?, 'Pending', NOW())",
    [order_code, JSON.stringify(itemsParsed), total],
    (err, result) => {
      if (err) {
        console.error("INSERT order error:", err);
        return res.status(500).json({ error: err.message });
      }

      const newOrder = {
        id: result.insertId,
        order_code,
        items: itemsParsed,
        total,
        status: "Pending",
        created_at: new Date()
      };

      io.emit("newOrder", newOrder); 
      console.log("✅ New order saved and emitted:", newOrder);
      res.json({ success: true, order: newOrder });
    }
  );
});

app.put("/orders/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  db.query(
    "UPDATE orders SET status=? WHERE id=?",
    [status, id],
    (err) => {
      if (err) {
        console.error("UPDATE order error:", err);
        return res.status(500).json({ error: err.message });
      }
      io.emit("orderStatusChanged", { id, status });
      res.json({ success: true });
    }
  );
});

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);
});

server.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});
