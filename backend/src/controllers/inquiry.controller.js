import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";
import { transporter } from "../lib/mailer.js";

export const createInquiry = async (req, res, next) => {
  try {
    const { propertyId, message } = req.body;

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { owner: { select: { id: true, name: true, email: true } } },
    });
    if (!property) throw new AppError("Property not found", 404);

    if (property.ownerId === req.user.id) {
      throw new AppError("You cannot inquire about your own listing", 400);
    }

    const existing = await prisma.inquiry.findUnique({
      where: { buyerId_propertyId: { buyerId: req.user.id, propertyId } },
    });
    if (existing) throw new AppError("You have already inquired about this property", 409);

    const inquiry = await prisma.inquiry.create({
      data: {
        message,
        buyerId: req.user.id,
        ownerId: property.ownerId,
        propertyId,
      },
    });

   
    try {
      const dashboardUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard`;
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || `"NestFind" <${process.env.SMTP_USER}>`,
        to: property.owner.email,
        subject: `New inquiry on "${property.title}"`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color:#1e293b;">New inquiry on your listing</h2>
            <p style="color:#475569;">Hi ${property.owner.name}, <strong>${req.user.name}</strong> (${req.user.email}) is interested in <strong>${property.title}</strong>.</p>
            <p style="color:#334155; background:#f8fafc; border-radius:8px; padding:12px 16px; margin:16px 0;">"${message}"</p>
            <p style="margin: 24px 0;">
              <a href="${dashboardUrl}" style="background:#4f46e5; color:#fff; padding:10px 20px; border-radius:8px; text-decoration:none; font-weight:600;">
                View in Dashboard
              </a>
            </p>
          </div>
        `,
      });
    } catch (mailErr) {
      console.error(`Failed to send inquiry email to ${property.owner.email}:`, mailErr);
    }

    res.status(201).json({
      success: true,
      message: "Inquiry sent successfully",
      data: { inquiry },
    });
  } catch (err) {
    if (err.code === "P2002") {
      return next(new AppError("You have already inquired about this property", 409));
    }
    next(err);
  }
};

export const getReceivedInquiries = async (req, res, next) => {
  try {
    const inquiries = await prisma.inquiry.findMany({
      where: { ownerId: req.user.id },
      include: {
        buyer: { select: { id: true, name: true, email: true, phone: true } },
        property: { select: { id: true, title: true, city: true, images: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: { inquiries } });
  } catch (err) {
    next(err);
  }
};

export const getSentInquiries = async (req, res, next) => {
  try {
    const inquiries = await prisma.inquiry.findMany({
      where: { buyerId: req.user.id },
      include: {
        property: { select: { id: true, title: true, city: true, images: true, price: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({
      success: true,
      data: {
        inquiries: inquiries.map((i) => ({
          ...i,
          property: { ...i.property, price: Number(i.property.price) },
        })),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const updateInquiryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const inquiry = await prisma.inquiry.findUnique({ where: { id } });
    if (!inquiry) throw new AppError("Inquiry not found", 404);
    if (inquiry.ownerId !== req.user.id) {
      throw new AppError("You do not have permission to update this inquiry", 403);
    }

    const updated = await prisma.inquiry.update({
      where: { id },
      data: { status },
    });

    res.json({ success: true, data: { inquiry: updated } });
  } catch (err) {
    next(err);
  }
};
