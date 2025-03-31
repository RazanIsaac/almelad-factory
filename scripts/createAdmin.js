// scripts/createAdmin.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("../models/admin");
require("dotenv").config();

const createAdmin = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const email = "admin@almelad.com";
  const password = "factory2741940";

  const hashedPassword = await bcrypt.hash(password, 10);

  const existing = await Admin.findOne({ email });
  if (existing) {
    console.log("Admin already exists");
  } else {
    await Admin.create({ email, password: hashedPassword });
    console.log("Admin user created ✅");
  }

  mongoose.disconnect();
};

createAdmin();
