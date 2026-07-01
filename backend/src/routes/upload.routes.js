// backend/src/routes/upload.routes.js
import express from "express";
import { upload } from "../lib/cloudinary.js";
import { protect } from "../middleware/auth.middleware.js";
import { AppError } from "../utils/AppError.js";

const router = express.Router();

// POST /api/upload/images — max 10 images
router.post("/images", protect, upload.array("images", 10), (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw new AppError("No images uploaded", 400);
    }
    const urls = req.files.map((f) => f.path); // Cloudinary secure URL
    res.json({ success: true, data: { urls } });
  } catch (err) {
    next(err);
  }
});

export default router;