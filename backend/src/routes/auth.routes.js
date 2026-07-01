// backend/src/routes/auth.routes.js
import express from "express";
import {
  register,
  login,
  logout,
  refreshAccessToken,
  getMe,
} from "../controllers/auth.controller.js";
import { forgotPassword, resetPassword } from "../controllers/password.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import {
  registerRules,
  loginRules,
  validate,
} from "../middleware/validate.middleware.js";
import { body } from "express-validator";

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Registration successful
 *       409:
 *         description: Email already registered
 */
router.post("/register", registerRules, validate, register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful with accessToken
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", loginRules, validate, login);

router.post("/refresh", refreshAccessToken);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request a password reset link
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Generic success message (does not reveal if email exists)
 */
router.post(
  "/forgot-password",
  [body("email").trim().isEmail().withMessage("Valid email is required").normalizeEmail()],
  validate,
  forgotPassword
);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using the emailed token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, token, password]
 *             properties:
 *               email:
 *                 type: string
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 */
router.post(
  "/reset-password",
  [
    body("email").trim().isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("token").notEmpty().withMessage("Reset token is required"),
    body("password")
      .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage("Password must have uppercase, lowercase, and a number"),
  ],
  validate,
  resetPassword
);

export default router;
