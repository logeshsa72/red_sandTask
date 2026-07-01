// backend/src/controllers/password.controller.js
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";

// POST /api/auth/forgot-password
// Always responds with a generic success message — never reveals whether
// an email exists in the system (prevents user enumeration).
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

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

    // NOTE: wire this up to a real email provider (SendGrid, SES, etc.)
    // in production. Logged here so the flow is testable end-to-end
    // without external dependencies.
    console.log(`📧 Password reset link for ${email}: ${resetUrl}`);

    res.json(genericResponse);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/reset-password
export const resetPassword = async (req, res, next) => {
  try {
    const { email, token, password } = req.body;

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
