const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();
const multer = require("multer");
const Product = require("./models/Product");

const { storage } = require("./config/cloudinary");
const upload = multer({ storage });

const app = express();
const PORT = process.env.PORT || 3000;
const Admin = require("./models/admin");
const jwt = require("jsonwebtoken");
const verifyAdmin = require("./middleware/auth");

// Enable CORS and JSON parsing
const cors = require("cors");
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB error:", err));

// Serve static files from "public" folder
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/products", async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) {
      filter.category = req.query.category;
    }
    const products = await Product.find(filter);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});
app.post(
  "/api/products",
  verifyAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      console.log("🚀 Reached POST /api/products route");

      const { name, description, price, category } = req.body;

      if (!req.file) throw new Error("No image uploaded");

      const newProduct = new Product({
        name,
        description,
        price,
        category,
        imageUrl: req.file.path,
      });

      await newProduct.save();
      res.status(201).json({ message: "Product added!" });
    } catch (err) {
      console.error("❌ Add product error message:", err.message);
      console.error(
        "❌ Add product error object:",
        JSON.stringify(err, null, 2)
      );
      console.error("❌ Add product stack trace:\n", err.stack);
      res.status(500).json({ error: "Failed to add product" });
    }
  }
);

app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Failed to load product" });
  }
});
app.post("/api/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ adminId: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });

    res.json({ token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
app.delete("/api/products/:id", verifyAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete" });
  }
});
app.put(
  "/api/products/:id",
  verifyAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      const update = {
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        category: req.body.category,
      };

      if (req.file) {
        update.imageUrl = req.file.path;
      }

      await Product.findByIdAndUpdate(req.params.id, update);
      res.json({ message: "Product updated" });
    } catch (err) {
      res.status(500).json({ error: "Failed to update product" });
    }
  }
);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
