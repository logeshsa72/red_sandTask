// backend/src/controllers/inquiry.controller.js
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";

// POST /api/inquiries  (auth required)
// Protection strategy:
//  1. DB-level uniqueness: @@unique([buyerId, propertyId]) in schema.prisma
//     guarantees only one inquiry per buyer per property, even under race
//     conditions — this is enforced by Postgres, not just app logic.
//  2. Route-level rate limiting (see inquiry.routes.js) caps how many
//     inquiries any single user can fire in a time window, independent of
//     which property they target — stops mass-spam across many listings.
//  3. Self-inquiry block: an owner cannot "inquire" on their own listing.
export const createInquiry = async (req, res, next) => {
  try {
    const { propertyId, message } = req.body;

    const property = await prisma.property.findUnique({ where: { id: propertyId } });
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

    res.status(201).json({
      success: true,
      message: "Inquiry sent successfully",
      data: { inquiry },
    });
  } catch (err) {
    // Postgres unique constraint race — translate to a friendly 409
    if (err.code === "P2002") {
      return next(new AppError("You have already inquired about this property", 409));
    }
    next(err);
  }
};

// GET /api/inquiries/received  (auth required — inquiries on my properties)
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

// GET /api/inquiries/sent  (auth required — inquiries I've made)
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

// PATCH /api/inquiries/:id/status  (auth + owner required)
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
