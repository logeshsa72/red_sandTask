// backend/src/routes/inquiry.routes.js
import express from "express";
import rateLimit from "express-rate-limit";
import { body, param, validationResult } from "express-validator";
import {
  createInquiry,
  getReceivedInquiries,
  getSentInquiries,
  updateInquiryStatus,
} from "../controllers/inquiry.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { AppError } from "../utils/AppError.js";

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError(errors.array()[0].msg, 422));
  }
  next();
};

// Spam protection: cap inquiry creation to 5 per 10 minutes per user/IP,
// independent of the global DB-level unique(buyerId, propertyId) constraint
// in inquiry.controller.js which blocks duplicates on the same property.
const inquiryLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many inquiries sent. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
});

/**
 * @swagger
 * /api/inquiries:
 *   post:
 *     summary: Send an inquiry to a property owner
 *     tags: [Inquiries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [propertyId, message]
 *             properties:
 *               propertyId: { type: string }
 *               message: { type: string }
 *     responses:
 *       201:
 *         description: Inquiry sent
 *       409:
 *         description: Duplicate inquiry
 *       429:
 *         description: Rate limit exceeded
 */
router.post(
  "/",
  protect,
  inquiryLimiter,
  [
    body("propertyId").notEmpty().withMessage("propertyId is required"),
    body("message").trim().notEmpty().withMessage("Message is required")
      .isLength({ min: 10, max: 500 }).withMessage("Message must be 10–500 characters"),
  ],
  validate,
  createInquiry
);

/**
 * @swagger
 * /api/inquiries/received:
 *   get:
 *     summary: Get inquiries received on my listings
 *     tags: [Inquiries]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of received inquiries
 */
router.get("/received", protect, getReceivedInquiries);

/**
 * @swagger
 * /api/inquiries/sent:
 *   get:
 *     summary: Get inquiries I've sent
 *     tags: [Inquiries]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of sent inquiries
 */
router.get("/sent", protect, getSentInquiries);

/**
 * @swagger
 * /api/inquiries/{id}/status:
 *   patch:
 *     summary: Update inquiry status (owner only)
 *     tags: [Inquiries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [PENDING, RESPONDED, CLOSED] }
 *     responses:
 *       200:
 *         description: Inquiry updated
 */
router.patch(
  "/:id/status",
  protect,
  [
    param("id").notEmpty(),
    body("status").isIn(["PENDING", "RESPONDED", "CLOSED"]).withMessage("Invalid status"),
  ],
  validate,
  updateInquiryStatus
);

export default router;
