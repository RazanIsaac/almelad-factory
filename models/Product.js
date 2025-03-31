const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  category: String, // "masabeh" or "asawer"
  image: {
    data: Buffer,
    contentType: String,
  },
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
