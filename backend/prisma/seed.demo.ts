import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { putObject } from "../src/lib/s3.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const STAFF = [
  {
    email: "priya.nair@motorserve.com",
    password: "password123",
    name: "Priya Nair",
    role: "MECHANIC",
    status: "ACTIVE",
    phone: "+1 (555) 221-4473",
    avatar: "/images/avatars/priya-nair.png",
    station: "Main Bay / Station 01",
    specialization: "Engine & Diagnostics",
  },
  {
    email: "david.chen@motorserve.com",
    password: "password123",
    name: "David Chen",
    role: "MECHANIC",
    status: "ACTIVE",
    phone: "+1 (555) 908-1157",
    avatar: "/images/avatars/david-chen.png",
    station: "Main Bay / Station 02",
    specialization: "Electrical & AC",
  },
  {
    email: "alex.reed@motorserve.com",
    password: "password123",
    name: "Alex Reed",
    role: "ADVISOR",
    status: "ACTIVE",
    phone: "+1 (555) 442-7810",
    avatar: "/images/avatars/alex-reed.png",
  },
];

const OWNERS = [
  {
    email: "markus.rivera@example.com",
    password: "password123",
    name: "Markus Rivera",
    role: "OWNER",
    status: "PENDING",
    phone: "+1 (555) 318-7742",
    avatar: "/images/avatars/marcus-r.png",
    nid: "1990-4455-1188",
    drivingLicense: "DL-DHK-447120",
    dateOfBirth: new Date("1990-04-17"),
    gender: "Male",
    occupation: "Fleet Manager",
    street: "42 Lakeview Road",
    city: "Dhaka",
    district: "Dhaka",
    zip: "1212",
    country: "Bangladesh",
    joinedAt: new Date("2026-09-07T10:00:00.000Z"),
  },
  {
    email: "michael.benson@example.com",
    password: "password123",
    name: "Michael Benson",
    role: "OWNER",
    status: "REJECTED",
    phone: "+1 (555) 902-3318",
    avatar: "/images/avatars/mike-miller.png",
    nid: "1985-7731-9902",
    drivingLicense: "DL-DHK-310985",
    dateOfBirth: new Date("1985-11-02"),
    gender: "Male",
    occupation: "Shop Owner",
    street: "18 Green Avenue",
    city: "Chattogram",
    district: "Chattogram",
    zip: "4000",
    country: "Bangladesh",
    joinedAt: new Date("2026-09-04T15:30:00.000Z"),
  },
  {
    email: "david.thompson@example.com",
    password: "password123",
    name: "David Thompson",
    role: "OWNER",
    status: "ACTIVE",
    phone: "+1 (555) 667-1204",
    avatar: "/images/avatars/david-t.png",
    nid: "1992-2088-4451",
    drivingLicense: "DL-DHK-882341",
    dateOfBirth: new Date("1992-06-25"),
    gender: "Male",
    occupation: "Rideshare Driver",
    street: "7 Palm Street",
    city: "Dhaka",
    district: "Dhaka",
    zip: "1205",
    country: "Bangladesh",
    joinedAt: new Date("2026-08-28T09:00:00.000Z"),
    verifiedAt: new Date("2026-08-29T10:00:00.000Z"),
  },
];

const PARTS = [
  { name: "Brake Pads (Front Set)", sku: "BRK-PAD-001", unitPrice: 89.99, supplier: "AutoParts Co", stock: 24 },
  { name: "Brake Disc (Rotor)", sku: "BRK-DSC-002", unitPrice: 129.99, supplier: "AutoParts Co", stock: 12 },
  { name: "Engine Oil Filter", sku: "OIL-FLT-003", unitPrice: 14.99, supplier: "FilterHub", stock: 3 },
  { name: "12V Car Battery", sku: "BAT-12V-004", unitPrice: 149.99, supplier: "VoltSource", stock: 0 },
  { name: "Engine Air Filter", sku: "AIR-FLT-005", unitPrice: 39.99, supplier: "FilterHub", stock: 30 },
  { name: "Wiper Blades (Pair)", sku: "WPR-BLD-006", unitPrice: 19.99, supplier: "ClearView", stock: 8 },
  { name: "Oxygen Sensor", sku: "OXY-SNS-007", unitPrice: 59.99, supplier: "VoltSource", stock: 4 },
  { name: "Brake Cleaner", sku: "BRK-CLN-008", unitPrice: 9.99, supplier: "AutoParts Co", stock: 15 },
  { name: "Wiring Harness Tape Kit", sku: "WIR-TAP-009", unitPrice: 24.99, supplier: "VoltSource", stock: 6 },
];

const BAYS = [
  "Main Bay / Station 01",
  "Main Bay / Station 02",
  "Main Bay / Station 03",
  "Main Bay / Station 04",
];

async function clearTransactionalData() {
  console.log("Clearing transactional data...");
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.estimateItem.deleteMany();
  await prisma.estimate.deleteMany();
  await prisma.partsUsed.deleteMany();
  await prisma.taskNote.deleteMany();
  await prisma.taskProgress.deleteMany();
  await prisma.partRequest.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.message.deleteMany();
  await prisma.chatThread.deleteMany();
  await prisma.taskCard.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.auditLog.deleteMany();
  console.log("Transactional data cleared.");
}

async function main() {
  const owner = await prisma.user.findUnique({ where: { email: "john.doe@example.com" } });
  const sarah = await prisma.user.findUnique({ where: { email: "sarah.jenkins@motorserve.com" } });
  const alex = await prisma.user.findUnique({ where: { email: "alex.turner@motorserve.com" } });
  if (!owner || !sarah || !alex) throw new Error("Base seed accounts missing — run db:seed first");

  await clearTransactionalData();

  console.log("Seeding demo staff...");
  for (const account of STAFF) {
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

  console.log("Seeding demo owners (verification queue)...");
  for (const account of OWNERS) {
    const { password, ...profile } = account;
    await prisma.user.upsert({
      where: { email: account.email },
      update: {
        status: profile.status as never,
        avatar: profile.avatar,
      },
      create: {
        ...profile,
        role: profile.role as never,
        status: profile.status as never,
        passwordHash: await bcrypt.hash(password, 10),
      },
    });
  }

  console.log("Uploading demo verification documents...");
  const demoDocPath = path.resolve(process.cwd(), "prisma/demo-nid.png");
  if (fs.existsSync(demoDocPath)) {
    const docBuffer = fs.readFileSync(demoDocPath);
    for (const email of ["markus.rivera@example.com", "michael.benson@example.com", "david.thompson@example.com"]) {
      try {
        const u = await prisma.user.findUniqueOrThrow({ where: { email } });
        const docs = [];
        for (const kind of ["nid", "license"] as const) {
          const key = `MotoServe/docs/${u.id}/${kind}.png`;
          await putObject(key, docBuffer, "image/png");
          docs.push({ name: `${kind}.png`, key, kind });
        }
        await prisma.user.update({ where: { id: u.id }, data: { documents: docs } });
        console.log(`Uploaded docs for ${email}`);
      } catch (err) {
        console.warn(`Skipping docs for ${email}: ${err instanceof Error ? err.message : err}`);
      }
    }
  } else {
    console.warn("Demo NID file missing — skipping document uploads");
  }

  console.log("Seeding demo parts...");
  for (const part of PARTS) {
    await prisma.part.upsert({
      where: { sku: part.sku },
      update: { stock: part.stock, unitPrice: part.unitPrice },
      create: part,
    });
  }

  console.log("Seeding workshop bays...");
  for (const name of BAYS) {
    await prisma.station.upsert({ where: { name }, update: {}, create: { name } });
  }

  console.log("Demo seed complete (static data only).");
  console.log("Logins: priya.nair@motorserve.com / david.chen@motorserve.com / alex.reed@motorserve.com (password123)");
  console.log("Owners: markus.rivera@example.com (pending) / michael.benson@example.com (rejected) / david.thompson@example.com (password123)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
