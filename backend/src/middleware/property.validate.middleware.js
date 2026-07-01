// backend/src/middleware/property.validate.middleware.js
import { body, query, validationResult } from "express-validator";
import { AppError } from "../utils/AppError.js";

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    return next(new AppError(messages[0], 422));
  }
  next();
};

const PROPERTY_TYPES = ["APARTMENT", "VILLA", "HOUSE", "PLOT", "COMMERCIAL", "PG"];
const LISTING_TYPES = ["SALE", "RENT"];
const AREA_UNITS = ["SQFT", "SQMT", "ACRES"];
const FURNISHED_TYPES = ["FURNISHED", "SEMI_FURNISHED", "UNFURNISHED"];

export const createPropertyRules = [
  body("title").trim().notEmpty().withMessage("Title is required")
    .isLength({ min: 10, max: 120 }).withMessage("Title must be 10–120 characters"),
  body("description").trim().notEmpty().withMessage("Description is required")
    .isLength({ min: 20, max: 1000 }).withMessage("Description must be 20–1000 characters"),
  body("price").notEmpty().withMessage("Price is required")
    .isFloat({ min: 1 }).withMessage("Price must be a positive number"),
  body("city").trim().notEmpty().withMessage("City is required"),
  body("locality").trim().notEmpty().withMessage("Locality is required"),
  body("address").trim().notEmpty().withMessage("Address is required"),
  body("propertyType").isIn(PROPERTY_TYPES).withMessage("Invalid property type"),
  body("listingType").isIn(LISTING_TYPES).withMessage("Invalid listing type"),
  body("bedrooms").optional().isInt({ min: 0, max: 20 }).withMessage("Invalid bedroom count"),
  body("bathrooms").optional().isInt({ min: 0, max: 20 }).withMessage("Invalid bathroom count"),
  body("area").notEmpty().withMessage("Area is required").isFloat({ min: 1 }).withMessage("Invalid area"),
  body("areaUnit").optional().isIn(AREA_UNITS).withMessage("Invalid area unit"),
  body("furnished").optional().isIn(FURNISHED_TYPES).withMessage("Invalid furnishing type"),
  body("amenities").optional().isArray().withMessage("Amenities must be an array"),
  body("images").optional().isArray().withMessage("Images must be an array"),
  body("images.*").optional().isString().withMessage("Each image must be a URL string"),
];

export const updatePropertyRules = [
  body("title").optional().trim().isLength({ min: 10, max: 120 }).withMessage("Title must be 10–120 characters"),
  body("description").optional().trim().isLength({ min: 20, max: 1000 }).withMessage("Description must be 20–1000 characters"),
  body("price").optional().isFloat({ min: 1 }).withMessage("Price must be a positive number"),
  body("propertyType").optional().isIn(PROPERTY_TYPES).withMessage("Invalid property type"),
  body("listingType").optional().isIn(LISTING_TYPES).withMessage("Invalid listing type"),
  body("bedrooms").optional().isInt({ min: 0, max: 20 }).withMessage("Invalid bedroom count"),
  body("bathrooms").optional().isInt({ min: 0, max: 20 }).withMessage("Invalid bathroom count"),
  body("area").optional().isFloat({ min: 1 }).withMessage("Invalid area"),
];

export const listQueryRules = [
  query("page").optional().isInt({ min: 1 }).withMessage("Invalid page"),
  query("limit").optional().isInt({ min: 1, max: 50 }).withMessage("Invalid limit"),
  query("bedrooms").optional().isInt({ min: 0, max: 20 }).withMessage("Invalid bedrooms filter"),
  query("minPrice").optional().isFloat({ min: 0 }).withMessage("Invalid minPrice"),
  query("maxPrice").optional().isFloat({ min: 0 }).withMessage("Invalid maxPrice"),
  query("propertyType").optional().isIn(PROPERTY_TYPES).withMessage("Invalid property type"),
  query("listingType").optional().isIn(LISTING_TYPES).withMessage("Invalid listing type"),
];
