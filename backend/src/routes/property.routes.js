// backend/src/routes/property.routes.js
import express from "express";
import {
  createProperty,
  getProperties,
  getPropertyById,
  getSimilarProperties,
  updateProperty,
  deleteProperty,
  getMyListings,
} from "../controllers/property.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import {
  createPropertyRules,
  updatePropertyRules,
  listQueryRules,
  validate,
} from "../middleware/property.validate.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/properties:
 *   get:
 *     summary: Get all properties (search, filter, sort, paginate)
 *     tags: [Properties]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *       - in: query
 *         name: listingType
 *         schema: { type: string, enum: [SALE, RENT] }
 *       - in: query
 *         name: propertyType
 *         schema: { type: string, enum: [APARTMENT, VILLA, HOUSE, PLOT, COMMERCIAL, PG] }
 *       - in: query
 *         name: bedrooms
 *         schema: { type: integer }
 *       - in: query
 *         name: minPrice
 *         schema: { type: number }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [createdAt, price, views, area] }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc] }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Paginated list of properties
 */
router.get("/", listQueryRules, validate, getProperties);

/**
 * @swagger
 * /api/properties/my-listings:
 *   get:
 *     summary: Get properties owned by the logged-in user
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of the user's own properties
 */
router.get("/my-listings", protect, getMyListings);

/**
 * @swagger
 * /api/properties/{id}:
 *   get:
 *     summary: Get a single property by ID (increments view count)
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Property details
 *       404:
 *         description: Property not found
 */
router.get("/:id", getPropertyById);

/**
 * @swagger
 * /api/properties/{id}/similar:
 *   get:
 *     summary: Get similar properties (same city + type, falls back to price range)
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of similar properties
 */
router.get("/:id/similar", getSimilarProperties);

/**
 * @swagger
 * /api/properties:
 *   post:
 *     summary: Create a new property listing
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Property created
 *       401:
 *         description: Not authenticated
 */
router.post("/", protect, createPropertyRules, validate, createProperty);

/**
 * @swagger
 * /api/properties/{id}:
 *   put:
 *     summary: Update a property (owner only)
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Property updated
 *       403:
 *         description: Not the owner
 *       404:
 *         description: Property not found
 */
router.put("/:id", protect, updatePropertyRules, validate, updateProperty);

/**
 * @swagger
 * /api/properties/{id}:
 *   delete:
 *     summary: Delete a property (owner only)
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Property deleted
 *       403:
 *         description: Not the owner
 *       404:
 *         description: Property not found
 */
router.delete("/:id", protect, deleteProperty);

export default router;
