// backend/src/controllers/property.controller.js
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";

// Helper: serialize BigInt price for JSON
const serialize = (property) => ({
  ...property,
  price: property.price?.toString ? Number(property.price) : property.price,
});

// POST /api/properties  (auth required)
export const createProperty = async (req, res, next) => {
  try {
    const {
      title, description, price, city, locality, address,
      latitude, longitude, propertyType, listingType,
      bedrooms, bathrooms, area, areaUnit, furnished,
      amenities, images,
    } = req.body;

    const property = await prisma.property.create({
      data: {
        title, description,
        price: BigInt(Math.round(Number(price))),
        city, locality, address,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        propertyType, listingType,
        bedrooms: Number(bedrooms) || 0,
        bathrooms: Number(bathrooms) || 0,
        area: Number(area),
        areaUnit: areaUnit || "SQFT",
        furnished: furnished || "UNFURNISHED",
        amenities: Array.isArray(amenities) ? amenities : [],
        images: Array.isArray(images) ? images : [],
        ownerId: req.user.id,
      },
    });

    res.status(201).json({
      success: true,
      message: "Property listed successfully",
      data: { property: serialize(property) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/properties  (public, supports search/filter/sort/pagination)
export const getProperties = async (req, res, next) => {
  try {
    const {
      search, city, listingType, propertyType, bedrooms,
      minPrice, maxPrice,
      sortBy = "createdAt", sortOrder = "desc",
      page = 1, limit = 12,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    // Build WHERE clause — every filterable field is indexed in schema.prisma
    const where = { isActive: true };

    if (city) where.city = { contains: city, mode: "insensitive" };
    if (search) {
      where.OR = [
        { city: { contains: search, mode: "insensitive" } },
        { locality: { contains: search, mode: "insensitive" } },
        { title: { contains: search, mode: "insensitive" } },
      ];
    }
    if (listingType) where.listingType = listingType;
    if (propertyType) where.propertyType = propertyType;
    if (bedrooms) where.bedrooms = parseInt(bedrooms, 10);
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = BigInt(Math.round(Number(minPrice)));
      if (maxPrice) where.price.lte = BigInt(Math.round(Number(maxPrice)));
    }

    // Whitelist sort fields to prevent injection via query param
    const allowedSort = ["createdAt", "price", "views", "area"];
    const orderField = allowedSort.includes(sortBy) ? sortBy : "createdAt";
    const orderDir = sortOrder === "asc" ? "asc" : "desc";

    // Run count + page query in parallel — keeps response fast even with 50k+ rows
    // since both queries hit indexed columns (city, propertyType, bedrooms, price, isActive)
    const [total, properties] = await Promise.all([
      prisma.property.count({ where }),
      prisma.property.findMany({
        where,
        orderBy: { [orderField]: orderDir },
        skip,
        take: limitNum,
        select: {
          id: true, title: true, price: true, city: true, locality: true,
          propertyType: true, listingType: true, bedrooms: true, bathrooms: true,
          area: true, areaUnit: true, images: true, views: true, createdAt: true,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        properties: properties.map(serialize),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/properties/:id  (public — increments view count)
export const getPropertyById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const property = await prisma.property.update({
      where: { id },
      data: { views: { increment: 1 } },
      include: {
        owner: { select: { id: true, name: true, email: true, phone: true } },
      },
    }).catch(() => null);

    if (!property) throw new AppError("Property not found", 404);

    res.json({ success: true, data: { property: serialize(property) } });
  } catch (err) {
    next(err);
  }
};

// GET /api/properties/:id/similar  (public)
export const getSimilarProperties = async (req, res, next) => {
  try {
    const { id } = req.params;

    const base = await prisma.property.findUnique({ where: { id } });
    if (!base) throw new AppError("Property not found", 404);

    // Similarity strategy: same city + same propertyType first (uses the
    // composite index [city, propertyType, bedrooms]), then relax to a
    // price-range fallback within +/-20% if not enough matches are found.
    // This avoids a full-table scan and keeps the query index-backed.
    let similar = await prisma.property.findMany({
      where: {
        id: { not: id },
        isActive: true,
        city: base.city,
        propertyType: base.propertyType,
      },
      take: 4,
      orderBy: { views: "desc" },
      select: {
        id: true, title: true, price: true, city: true, locality: true,
        propertyType: true, listingType: true, bedrooms: true, bathrooms: true,
        area: true, areaUnit: true, images: true,
      },
    });

    if (similar.length < 4) {
      const priceLow = BigInt(Math.round(Number(base.price) * 0.8));
      const priceHigh = BigInt(Math.round(Number(base.price) * 1.2));
      const fallback = await prisma.property.findMany({
        where: {
          id: { not: id, notIn: similar.map((s) => s.id) },
          isActive: true,
          price: { gte: priceLow, lte: priceHigh },
        },
        take: 4 - similar.length,
        select: {
          id: true, title: true, price: true, city: true, locality: true,
          propertyType: true, listingType: true, bedrooms: true, bathrooms: true,
          area: true, areaUnit: true, images: true,
        },
      });
      similar = [...similar, ...fallback];
    }

    res.json({ success: true, data: { properties: similar.map(serialize) } });
  } catch (err) {
    next(err);
  }
};

// PUT /api/properties/:id  (auth + ownership required)
export const updateProperty = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.property.findUnique({ where: { id } });
    if (!existing) throw new AppError("Property not found", 404);
    if (existing.ownerId !== req.user.id && req.user.role !== "ADMIN") {
      throw new AppError("You do not have permission to edit this listing", 403);
    }

    const allowedFields = [
      "title", "description", "city", "locality", "address",
      "latitude", "longitude", "propertyType", "listingType",
      "bedrooms", "bathrooms", "area", "areaUnit", "furnished",
      "amenities", "images", "isActive",
    ];

    const data = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) data[field] = req.body[field];
    }
    if (req.body.price !== undefined) {
      data.price = BigInt(Math.round(Number(req.body.price)));
    }

    const property = await prisma.property.update({ where: { id }, data });

    res.json({ success: true, message: "Property updated", data: { property: serialize(property) } });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/properties/:id  (auth + ownership required)
export const deleteProperty = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.property.findUnique({ where: { id } });
    if (!existing) throw new AppError("Property not found", 404);
    if (existing.ownerId !== req.user.id && req.user.role !== "ADMIN") {
      throw new AppError("You do not have permission to delete this listing", 403);
    }

    await prisma.property.delete({ where: { id } });

    res.json({ success: true, message: "Property deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// GET /api/properties/my-listings  (auth required)
export const getMyListings = async (req, res, next) => {
  try {
    const properties = await prisma.property.findMany({
      where: { ownerId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: { properties: properties.map(serialize) } });
  } catch (err) {
    next(err);
  }
};
