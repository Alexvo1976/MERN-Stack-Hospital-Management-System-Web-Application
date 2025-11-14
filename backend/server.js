import dotenv from "dotenv";
dotenv.config(); // Load .env first

import app from "./app.js";
import cloudinary from "cloudinary";

// ✅ Cloudinary configuration
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Define port AFTER dotenv is loaded
const PORT = process.env.PORT || 4000;

// ✅ Listen on 0.0.0.0 for Docker
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
