// backend/src/controllers/password.controller.js
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";
import { transporter } from "../lib/mailer.js";

// POST /api/auth/forgot-password
// Always responds with a generic success message — never reveals whether
// an email exists in the system (prevents user enumeration).
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError("Email is required", 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });

    const genericResponse = {
      success: true,
      message: "If an account with that email exists, a reset link has been sent.",
    };

    if (!user) return res.json(genericResponse);

    // Raw token is emailed to the user; only its SHA-256 hash is stored,
    // mirroring how the refresh token is stored hashed — so a DB leak
    // alone can't be used to reset accounts.
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: hashedToken, resetTokenExpiry: expiry },
    });

    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

    // Send the actual reset email. Errors here are logged but not thrown,
    // so the response stays generic either way (anti-enumeration).
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || `"NestFind" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Reset your password",
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color:#1e293b;">Reset your password</h2>
            <p style="color:#475569;">We received a request to reset your NestFind password. This link expires in 15 minutes.</p>
            <p style="margin: 24px 0;">
              <a href="${resetUrl}" style="background:#4f46e5; color:#fff; padding:10px 20px; border-radius:8px; text-decoration:none; font-weight:600;">
                Reset Password
              </a>
            </p>
            <p style="color:#94a3b8; font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      });
    } catch (mailErr) {
      console.error(`Failed to send reset email to ${email}:`, mailErr);
    }

    res.json(genericResponse);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/reset-password
export const resetPassword = async (req, res, next) => {
  try {
    const { email, token, password } = req.body;

    if (!email || !token || !password) {
      throw new AppError("Email, token, and password are all required", 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.resetToken || !user.resetTokenExpiry) {
      throw new AppError("Invalid or expired reset token", 400);
    }

    if (user.resetTokenExpiry < new Date()) {
      throw new AppError("Reset token has expired. Please request a new one.", 400);
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    if (hashedToken !== user.resetToken) {
      throw new AppError("Invalid or expired reset token", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        refreshToken: null, // force re-login on all devices after reset
      },
    });

    res.json({ success: true, message: "Password reset successful. Please log in with your new password." });
  } catch (err) {
    next(err);
  }
};