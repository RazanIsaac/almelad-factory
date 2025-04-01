require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const { storage, cloudinary } = require("./config/cloudinary");

const multer = require("multer");
const upload = multer({ storage });
const Product = require("./models/Product");
const Admin = require("./models/admin");
const jwt = require("jsonwebtoken");
const verifyAdmin = require("./middleware/auth");
// Test Cloudinary connection
cloudinary.api.ping((error, result) => {
  if (error) {
    console.error("Cloudinary connection failed:", error.message);
  } else {
    console.log(" Cloudinary ping successful:", result);
  }
});
const app = express();
const PORT = process.env.PORT || 3000;

app.use(require("cors")());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log(" MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// Health Check
app.get("/", (req, res) => {
  res.json({ test: " If you see this nicely formatted, you're good!" });
});

// Get all products (optionally filter by category)
app.get("/api/products", async (req, res) => {
  try {
    const filter = req.query.category ? { category: req.query.category } : {};
    const products = await Product.find(filter);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Add product (admin only)
app.post(
  "/api/products",
  verifyAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      console.log(" Reached POST /api/products route");
      console.log(" req.body:", JSON.stringify(req.body, null, 2));
      console.log(
        "req.file:",
        JSON.stringify(req.file, Object.getOwnPropertyNames(req.file), 2)
      );

      const { name, description, price, category } = req.body;

      if (!req.file) throw new Error("No image uploaded");

      const newProduct = new Product({
        name,
        description,
        price: Number(price),
        category,
        imageUrl: req.file?.path || req.file?.secure_url || req.file?.url,
      });

      await newProduct.save();
      res.status(201).json({ message: "Product added!" });
    } catch (err) {
      console.error(" Add product error:", err);
      res.status(500).json({
        error: "Failed to add product",
        details: {
          message: err.message,
          stack: err.stack,
          body: req.body,
          file: req.file,
        },
      });
    }
  }
);

// Get single product
app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    res.json(product);
  } catch {
    res.status(500).json({ error: "Failed to load product" });
  }
});

// Admin login
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
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete product (admin only)
app.delete("/api/products/:id", verifyAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch {
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// Update product (admin only)
app.put(
  "/api/products/:id",
  verifyAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      const update = {
        name: req.body.name,
        description: req.body.description,
        price: Number(req.body.price),
        category: req.body.category,
      };
      if (req.file) {
        update.imageUrl = req.file.path || req.file.url;
      }

      await Product.findByIdAndUpdate(req.params.id, update);
      res.json({ message: "Product updated" });
    } catch (err) {
      res.status(500).json({ error: "Failed to update product" });
    }
  }
);

app.listen(PORT, () => {
  console.log(` Server is running on http://localhost:${PORT}`);
});
