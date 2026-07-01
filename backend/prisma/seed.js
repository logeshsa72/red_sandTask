// prisma/seed.js
// Generates realistic test data, including 50,000+ property records,
// to validate indexing/pagination/query performance per assignment spec.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const CITIES = ["Mumbai", "Delhi", "Bangalore", "Pune", "Hyderabad", "Chennai", "Kolkata", "Ahmedabad", "Jaipur", "Chandigarh"];
const LOCALITIES = ["Sector 12", "Park Street", "MG Road", "Civil Lines", "Lake View", "Hilltop", "Riverside", "Green Valley", "City Center", "Old Town"];
const PROPERTY_TYPES = ["APARTMENT", "VILLA", "HOUSE", "PLOT", "COMMERCIAL", "PG"];
const LISTING_TYPES = ["SALE", "RENT"];
const FURNISHED = ["FURNISHED", "SEMI_FURNISHED", "UNFURNISHED"];
const AMENITIES_POOL = ["Parking", "Gym", "Swimming Pool", "Security", "Power Backup", "Lift", "Garden", "Clubhouse"];

const TOTAL_PROPERTIES = 50000;
const BATCH_SIZE = 1000;
const NUM_SEED_USERS = 200;

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomAmenities = () => {
  const count = randInt(2, 5);
  return [...AMENITIES_POOL].sort(() => 0.5 - Math.random()).slice(0, count);
};

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Create seed users (owners) — bcrypt hash reused for speed since this is test data only
  const hashedPassword = await bcrypt.hash("Password123", 10);
  const userIds = [];

  console.log(`Creating ${NUM_SEED_USERS} users...`);
  for (let i = 0; i < NUM_SEED_USERS; i++) {
    const user = await prisma.user.create({
      data: {
        name: `Owner ${i + 1}`,
        email: `owner${i + 1}@example.com`,
        password: hashedPassword,
        phone: `9${randInt(100000000, 999999999)}`,
        isVerified: true,
      },
      select: { id: true },
    });
    userIds.push(user.id);
  }

  // Demo user for manual login during review
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@nestfind.com" },
    update: {},
    create: {
      name: "Demo User",
      email: "demo@nestfind.com",
      password: await bcrypt.hash("Demo@1234", 10),
      isVerified: true,
    },
  });
  userIds.push(demoUser.id);

  // 2. Bulk-insert properties in batches via createMany (much faster than
  // individual create() calls — required to comfortably reach 50,000+ rows)
  console.log(`Creating ${TOTAL_PROPERTIES} properties in batches of ${BATCH_SIZE}...`);

  for (let batchStart = 0; batchStart < TOTAL_PROPERTIES; batchStart += BATCH_SIZE) {
    const batch = [];
    const batchEnd = Math.min(batchStart + BATCH_SIZE, TOTAL_PROPERTIES);

    for (let i = batchStart; i < batchEnd; i++) {
      const propertyType = rand(PROPERTY_TYPES);
      const listingType = rand(LISTING_TYPES);
      const city = rand(CITIES);
      const bedrooms = propertyType === "PLOT" ? 0 : randInt(1, 5);

      batch.push({
        title: `${bedrooms > 0 ? bedrooms + " BHK " : ""}${propertyType.charAt(0) + propertyType.slice(1).toLowerCase()} in ${rand(LOCALITIES)}, ${city}`,
        description: `A well-maintained ${propertyType.toLowerCase()} located in a prime area of ${city}, close to schools, hospitals, and markets. Ideal for ${listingType === "RENT" ? "renting" : "buying"}.`,
        price: BigInt(listingType === "RENT" ? randInt(8000, 150000) : randInt(1500000, 50000000)),
        city,
        locality: rand(LOCALITIES),
        address: `${randInt(1, 200)}, ${rand(LOCALITIES)}, ${city}`,
        propertyType,
        listingType,
        bedrooms,
        bathrooms: bedrooms > 0 ? randInt(1, bedrooms) : 0,
        area: randInt(400, 4000),
        areaUnit: "SQFT",
        furnished: rand(FURNISHED),
        amenities: randomAmenities(),
        images: [],
        views: randInt(0, 500),
        ownerId: rand(userIds),
      });
    }

    await prisma.property.createMany({ data: batch });
    console.log(`  → Inserted ${batchEnd}/${TOTAL_PROPERTIES}`);
  }

  console.log("✅ Seed complete.");
  console.log("   Demo login: demo@nestfind.com / Demo@1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
