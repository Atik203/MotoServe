import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEMO_ACCOUNTS = [
  {
    email: "admin@motorserve.com",
    password: "admin123",
    name: "Admin User",
    role: "ADMIN",
    status: "ACTIVE",
  },
  {
    email: "john.doe@example.com",
    password: "password123",
    name: "John Doe",
    role: "OWNER",
    status: "ACTIVE",
  },
  {
    email: "sarah.jenkins@motorserve.com",
    password: "password123",
    name: "Sarah Jenkins",
    role: "ADVISOR",
    status: "ACTIVE",
    avatar: "/images/avatars/sarah-jenkins.png",
  },
  {
    email: "alex.turner@motorserve.com",
    password: "password123",
    name: "Alex Turner",
    role: "MECHANIC",
    status: "ACTIVE",
    avatar: "/images/avatars/alex-turner.png",
    station: "Main Bay / Station 04",
    specialization: "Brakes & Suspension",
  },
];

const SERVICES = [
  { name: "Oil Change", category: "MAINTENANCE", basePrice: 49.99, durationMins: 30, description: "Engine oil replacement with standard filter." },
  { name: "Full Synthetic Oil Change", category: "MAINTENANCE", basePrice: 69.99, durationMins: 30, description: "High-performance synthetic oil with premium filter." },
  { name: "Diesel Fuel Filter Service", category: "MAINTENANCE", basePrice: 89.99, durationMins: 45, description: "Diesel fuel filter replacement and fuel system check." },
  { name: "Coolant Flush & Refill", category: "MAINTENANCE", basePrice: 79.99, durationMins: 60, description: "Radiator coolant flush and refill to prevent overheating." },
  { name: "Brake Fluid Replacement", category: "MAINTENANCE", basePrice: 59.99, durationMins: 45, description: "Brake fluid flush with high-temp DOT fluid." },
  { name: "Air Filter Replacement", category: "MAINTENANCE", basePrice: 39.99, durationMins: 20, description: "Engine air filter replacement for better airflow." },
  { name: "Cabin Filter Replacement", category: "MAINTENANCE", basePrice: 29.99, durationMins: 20, description: "Cabin air filter replacement for clean interior air." },
  { name: "Spark Plug Replacement", category: "MAINTENANCE", basePrice: 99.99, durationMins: 60, description: "Spark plug replacement for smooth ignition." },
  { name: "Battery Replacement", category: "MAINTENANCE", basePrice: 149.99, durationMins: 45, description: "New battery installation with terminal cleaning." },
  { name: "Timing Belt Replacement", category: "MAINTENANCE", basePrice: 329.99, durationMins: 240, description: "Timing belt, tensioner and idler replacement." },
  { name: "Wheel Alignment", category: "MAINTENANCE", basePrice: 79.99, durationMins: 60, description: "Computerized wheel alignment for all four wheels." },
  { name: "Tire Rotation", category: "MAINTENANCE", basePrice: 29.99, durationMins: 45, description: "Tire rotation and pressure balancing." },
  { name: "Tire Replacement", category: "MAINTENANCE", basePrice: 119.99, durationMins: 60, description: "New tire fitting, balancing and valve stem replacement." },
  { name: "Car Detailing & Wash", category: "MAINTENANCE", basePrice: 99.99, durationMins: 90, description: "Full interior vacuum, exterior wash and polish." },
  { name: "Denting & Painting", category: "MAINTENANCE", basePrice: 199.99, durationMins: 240, description: "Panel dent repair, filling and color-matched painting." },
  { name: "AC Gas Refill", category: "MAINTENANCE", basePrice: 89.99, durationMins: 60, description: "Air conditioner refrigerant recharge and leak check." },
  { name: "Windshield Wiper Replacement", category: "MAINTENANCE", basePrice: 19.99, durationMins: 15, description: "Front wiper blade replacement (set of two)." },
  { name: "Headlight Restoration", category: "MAINTENANCE", basePrice: 59.99, durationMins: 45, description: "Headlight lens polishing and UV coating." },
  { name: "Brake Pad Replacement", category: "REPAIRS", basePrice: 149.99, durationMins: 120, description: "Front/rear brake pad replacement with hardware kit." },
  { name: "Brake Disc Replacement", category: "REPAIRS", basePrice: 189.99, durationMins: 150, description: "Brake disc (rotor) replacement for smooth braking." },
  { name: "Clutch Replacement", category: "REPAIRS", basePrice: 399.99, durationMins: 300, description: "Clutch kit replacement including pressure plate and bearing." },
  { name: "Transmission Service & Fluid", category: "REPAIRS", basePrice: 249.99, durationMins: 180, description: "Gearbox oil change and transmission inspection." },
  { name: "Suspension Service", category: "REPAIRS", basePrice: 179.99, durationMins: 150, description: "Suspension components inspection and replacement." },
  { name: "Shocks & Struts Replacement", category: "REPAIRS", basePrice: 259.99, durationMins: 180, description: "Shock absorber and strut replacement." },
  { name: "Exhaust System Repair", category: "REPAIRS", basePrice: 129.99, durationMins: 120, description: "Exhaust pipe, muffler or catalytic converter repair." },
  { name: "Engine Diagnostics", category: "REPAIRS", basePrice: 89.99, durationMins: 60, description: "OBD error code scan and diagnostic report." },
  { name: "Fuel System Cleaning", category: "REPAIRS", basePrice: 99.99, durationMins: 90, description: "Injector and fuel system chemical cleaning." },
  { name: "Alternator Repair", category: "REPAIRS", basePrice: 179.99, durationMins: 150, description: "Alternator test, repair or replacement." },
  { name: "Starter Motor Repair", category: "REPAIRS", basePrice: 149.99, durationMins: 120, description: "Starter motor inspection and repair." },
  { name: "Radiator Repair", category: "REPAIRS", basePrice: 159.99, durationMins: 150, description: "Radiator leak repair or core replacement." },
  { name: "Motorcycle Engine Service", category: "REPAIRS", basePrice: 79.99, durationMins: 90, description: "Two-wheeler engine tune-up and oil change." },
  { name: "EV Battery Health Check", category: "REPAIRS", basePrice: 69.99, durationMins: 45, description: "Electric vehicle battery cell diagnostics and health report." },
  { name: "Hybrid Battery System Service", category: "REPAIRS", basePrice: 179.99, durationMins: 150, description: "Hybrid battery cooling fan cleaning and system check." },
  { name: "Multi-Point Inspection", category: "INSPECTIONS", basePrice: 89.99, durationMins: 60, description: "40-point inspection covering brakes, fluids, tires and lights." },
  { name: "Pre-Purchase Vehicle Inspection", category: "INSPECTIONS", basePrice: 129.99, durationMins: 120, description: "Detailed used-car inspection with full condition report." },
  { name: "Safety & Roadworthiness Check", category: "INSPECTIONS", basePrice: 59.99, durationMins: 45, description: "Brakes, steering, suspension and lights safety check." },
  { name: "Brake Inspection", category: "INSPECTIONS", basePrice: 29.99, durationMins: 30, description: "Quick brake pad and disc wear assessment." },
  { name: "AC Performance Test", category: "INSPECTIONS", basePrice: 49.99, durationMins: 45, description: "Air conditioning cooling performance and pressure test." },
  { name: "Electrical System Inspection", category: "INSPECTIONS", basePrice: 49.99, durationMins: 45, description: "Battery, alternator and wiring condition check." },
  { name: "Undercarriage Inspection", category: "INSPECTIONS", basePrice: 39.99, durationMins: 45, description: "Frame, axle and under-body component inspection." },
];

async function main() {
  console.log("Seeding demo accounts...");

  for (const account of DEMO_ACCOUNTS) {
    const { password, ...profile } = account;
    await prisma.user.upsert({
      where: { email: account.email },
      update: {},
      create: {
        ...profile,
        role: profile.role as never,
        status: profile.status as never,
        passwordHash: await bcrypt.hash(password, 10),
      },
    });
  }

  console.log(`Seeding ${SERVICES.length} services...`);
  await prisma.service.deleteMany();
  await prisma.service.createMany({
    data: SERVICES.map((s) => ({ ...s, category: s.category as never })),
  });

  await seedSiteContent();

  console.log("Seed complete.");
}

const CONTENT_KEYS = ["home", "services", "faqs", "pricing", "testimonials"] as const;

async function seedSiteContent() {
  const demoDir = path.resolve(process.cwd(), "../frontend/public/demo");
  for (const key of CONTENT_KEYS) {
    const file = path.join(demoDir, `${key}.json`);
    if (!fs.existsSync(file)) {
      console.warn(`Skipping content seed for "${key}" (missing ${file})`);
      continue;
    }
    const raw = JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, unknown>;
    const data = (raw[key] ?? raw) as object;
    await prisma.siteContent.upsert({
      where: { key },
      update: { data },
      create: { key, data },
    });
    console.log(`Seeded site content: ${key}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
