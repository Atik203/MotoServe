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

function money(n: number) {
  return Math.round(n * 100) / 100;
}

async function main() {
  const owner = await prisma.user.findUnique({ where: { email: "john.doe@example.com" } });
  const sarah = await prisma.user.findUnique({ where: { email: "sarah.jenkins@motorserve.com" } });
  const alex = await prisma.user.findUnique({ where: { email: "alex.turner@motorserve.com" } });
  if (!owner || !sarah || !alex) throw new Error("Base seed accounts missing — run db:seed first");

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
  const priya = await prisma.user.findUniqueOrThrow({ where: { email: "priya.nair@motorserve.com" } });
  const david = await prisma.user.findUniqueOrThrow({ where: { email: "david.chen@motorserve.com" } });

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
  const davidT = await prisma.user.findUniqueOrThrow({ where: { email: "david.thompson@example.com" } });

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

  console.log("Clearing previous demo transactional data...");
  await prisma.taskCard.deleteMany({ where: { customerId: { in: [owner.id, davidT.id] } } });
  await prisma.appointment.deleteMany({ where: { ownerId: { in: [owner.id, davidT.id] } } });
  await prisma.chatThread.deleteMany({ where: { ownerId: { in: [owner.id, davidT.id] } } });
  await prisma.auditLog.deleteMany({ where: { id: { startsWith: "demo-audit-" } } });

  console.log("Seeding demo vehicles...");
  const f150 = await prisma.vehicle.upsert({
    where: { regNo: "A9C-1234" },
    update: { image: "/images/cars/ford-f150.png", mileage: 24500 },
    create: {
      ownerId: owner.id,
      make: "Ford",
      model: "F-150",
      year: 2023,
      regNo: "A9C-1234",
      fuelType: "GASOLINE",
      mileage: 24500,
      color: "Oxford White",
      transmission: "Automatic",
      image: "/images/cars/ford-f150.png",
    },
  });
  const camry = await prisma.vehicle.upsert({
    where: { regNo: "XYZ-9876" },
    update: { image: "/images/cars/toyota-camry.png", mileage: 42100 },
    create: {
      ownerId: owner.id,
      make: "Toyota",
      model: "Camry",
      year: 2022,
      regNo: "XYZ-9876",
      fuelType: "HYBRID",
      mileage: 42100,
      color: "Silver",
      transmission: "Automatic",
      image: "/images/cars/toyota-camry.png",
    },
  });
  const civic = await prisma.vehicle.upsert({
    where: { regNo: "HND-2211" },
    update: { image: "/images/cars/honda-civic.png", mileage: 58200 },
    create: {
      ownerId: davidT.id,
      make: "Honda",
      model: "Civic",
      year: 2020,
      regNo: "HND-2211",
      fuelType: "GASOLINE",
      mileage: 58200,
      color: "Rally Red",
      transmission: "Automatic",
      image: "/images/cars/honda-civic.png",
    },
  });

  const oilChange = await prisma.service.findFirst({ where: { name: "Oil Change" } });
  const brakeService = await prisma.service.findFirst({ where: { name: "Brake Pad Replacement" } });
  const inspection = await prisma.service.findFirst({ where: { name: "Multi-Point Inspection" } });
  const tireRotation = await prisma.service.findFirst({ where: { name: "Tire Rotation" } });

  console.log("Seeding demo appointments...");
  await prisma.appointment.create({
    data: {
      ownerId: owner.id,
      vehicleId: f150.id,
      serviceIds: [brakeService?.id ?? "svc-brake", inspection?.id ?? "svc-inspection"].filter(Boolean),
      date: "2026-09-10",
      time: "10:00 AM",
      status: "CONFIRMED",
      notes: "Brake squeal check",
    },
  });
  await prisma.appointment.create({
    data: {
      ownerId: owner.id,
      vehicleId: camry.id,
      serviceIds: [oilChange?.id ?? "svc-oil", tireRotation?.id ?? "svc-tire"].filter(Boolean),
      date: "2026-09-12",
      time: "02:00 PM",
      status: "PENDING",
      notes: "Routine maintenance",
    },
  });

  console.log("Seeding demo tasks...");
  const progressSteps = (doneThrough: string) => {
    const order = ["RECEIVED", "INSPECTING", "REPAIRING", "TESTING", "READY"];
    const labels = ["Vehicle Received", "Initial Inspection", "Repairing", "Testing", "Ready for Pickup"];
    const idx = order.indexOf(doneThrough);
    return order.map((step, i) => ({
      step: step as never,
      label: labels[i],
      timestamp: `2026-09-0${6 + Math.min(i, 3)}T0${8 + i}:30:00.000Z`,
      done: i <= idx,
    }));
  };

  await prisma.taskCard.create({
    data: {
      id: "TC-1045",
      vehicleId: f150.id,
      customerId: owner.id,
      advisorId: sarah.id,
      mechanicId: alex.id,
      station: "Main Bay / Station 04",
      priority: "HIGH",
      status: "REPAIRING",
      issues: "Brake squeal and longer stopping distance on the 2023 Ford F-150",
      services: [{ name: "Brake Pad Replacement" }, { name: "Brake Inspection" }],
      photos: ["/images/repair-photos/brake-1.png", "/images/repair-photos/brake-2.png"],
      totalEstimate: 319.97,
      progress: { create: progressSteps("INSPECTING") },
      notes: {
        create: [
          { author: "Alex Turner", time: "2026-09-08T09:15:00.000Z", text: "Front pads worn to 3mm. Discs look reusable — measuring runout next." },
          { author: "Alex Turner", time: "2026-09-08T11:40:00.000Z", text: "Runout within spec. Fitting new pad set now, road test after lunch." },
        ],
      },
      partsUsed: {
        create: [
          { name: "Brake Pads (Front Set)", qty: 1, unitPrice: 89.99, supplier: "AutoParts Co", subtotal: 89.99 },
          { name: "Brake Cleaner", qty: 2, unitPrice: 9.99, supplier: "AutoParts Co", subtotal: 19.98 },
        ],
      },
    },
  });

  await prisma.taskCard.create({
    data: {
      id: "TC-1044",
      vehicleId: camry.id,
      customerId: owner.id,
      advisorId: sarah.id,
      station: "Main Bay / Station 02",
      priority: "MEDIUM",
      status: "INSPECTING",
      issues: "Annual multi-point inspection plus tire rotation for the Camry",
      services: [{ name: "Multi-Point Inspection" }, { name: "Tire Rotation" }],
      totalEstimate: 119.98,
      progress: { create: progressSteps("RECEIVED") },
      notes: {
        create: [{ author: "Sarah Jenkins", time: "2026-09-08T08:30:00.000Z", text: "Vehicle received with keys. Inspection started — advisor to review findings." }],
      },
    },
  });

  await prisma.taskCard.create({
    data: {
      id: "TC-1043",
      vehicleId: f150.id,
      customerId: owner.id,
      advisorId: sarah.id,
      mechanicId: priya.id,
      station: "Main Bay / Station 01",
      priority: "LOW",
      status: "COMPLETED",
      issues: "Full synthetic oil change and filters",
      services: [{ name: "Full Synthetic Oil Change" }, { name: "Air Filter Replacement" }],
      totalEstimate: 109.98,
      progress: { create: progressSteps("READY") },
    },
  });

  await prisma.taskCard.create({
    data: {
      id: "TC-1042",
      vehicleId: camry.id,
      customerId: owner.id,
      advisorId: sarah.id,
      mechanicId: david.id,
      station: "Main Bay / Station 02",
      priority: "MEDIUM",
      status: "COMPLETED",
      issues: "Battery drains overnight — replacement fitted and charging system tested",
      services: [{ name: "Battery Replacement" }],
      totalEstimate: 194.99,
      progress: { create: progressSteps("READY") },
    },
  });

  await prisma.taskCard.create({
    data: {
      id: "TC-1041",
      vehicleId: f150.id,
      customerId: owner.id,
      advisorId: sarah.id,
      mechanicId: alex.id,
      station: "Main Bay / Station 04",
      priority: "MEDIUM",
      status: "READY",
      issues: "AC blowing warm — gas refill and performance test done, ready for pickup",
      services: [{ name: "AC Gas Refill" }],
      totalEstimate: 89.99,
      progress: { create: progressSteps("TESTING") },
    },
  });
  const confirmedApt = await prisma.appointment.findFirst({
    where: { ownerId: owner.id, vehicleId: f150.id, status: "CONFIRMED" },
  });
  if (confirmedApt) {
    await prisma.taskCard.update({ where: { id: "TC-1045" }, data: { appointmentId: confirmedApt.id } });
  }

  await prisma.taskCard.create({
    data: {
      id: "TC-1046",
      vehicleId: camry.id,
      customerId: owner.id,
      advisorId: sarah.id,
      mechanicId: priya.id,
      station: "Main Bay / Station 01",
      priority: "MEDIUM",
      status: "REPAIRING",
      issues: "Check-engine light on — full engine diagnostics and sensor testing",
      services: [{ name: "Engine Diagnostics" }, { name: "Electrical System Inspection" }],
      photos: ["/images/services/engine-diagnostics.png"],
      totalEstimate: 194.98,
      progress: { create: progressSteps("INSPECTING") },
      notes: {
        create: [
          { author: "Priya Nair", time: "2026-09-08T10:05:00.000Z", text: "OBD scan shows P0135 — bank 1 oxygen sensor heater fault. Verifying wiring next." },
          { author: "Priya Nair", time: "2026-09-08T12:20:00.000Z", text: "Wiring intact, sensor itself failed. Replacement quoted in ES-2012." },
        ],
      },
      partsUsed: {
        create: [
          { name: "Oxygen Sensor", qty: 1, unitPrice: 59.99, supplier: "VoltSource", subtotal: 59.99 },
          { name: "Engine Air Filter", qty: 1, unitPrice: 39.99, supplier: "FilterHub", subtotal: 39.99 },
        ],
      },
    },
  });

  await prisma.taskCard.create({
    data: {
      id: "TC-1047",
      vehicleId: f150.id,
      customerId: owner.id,
      advisorId: sarah.id,
      mechanicId: david.id,
      station: "Main Bay / Station 02",
      priority: "HIGH",
      status: "TESTING",
      issues: "Intermittent electrical cutout — harness repair done, final systems test running",
      services: [{ name: "Electrical System Inspection" }, { name: "AC Performance Test" }],
      photos: ["/images/repair-photos/brake-3.png", "/images/repair-photos/brake-4.png"],
      totalEstimate: 149.98,
      progress: { create: progressSteps("REPAIRING") },
      notes: {
        create: [
          { author: "David Chen", time: "2026-09-07T16:45:00.000Z", text: "Found chafed loom near firewall. Repaired and re-wrapped, load test passed." },
          { author: "David Chen", time: "2026-09-08T09:00:00.000Z", text: "Overnight soak test clean. Running final AC performance sweep now." },
        ],
      },
      partsUsed: {
        create: [{ name: "Wiring Harness Tape Kit", qty: 1, unitPrice: 24.99, supplier: "VoltSource", subtotal: 24.99 }],
      },
    },
  });

  await prisma.taskCard.create({
    data: {
      id: "TC-1040",
      vehicleId: camry.id,
      customerId: owner.id,
      advisorId: sarah.id,
      mechanicId: david.id,
      station: "Main Bay / Station 02",
      priority: "LOW",
      status: "COMPLETED",
      issues: "Scheduled transmission service and fluid change",
      services: [{ name: "Transmission Service & Fluid" }],
      totalEstimate: 249.99,
      progress: { create: progressSteps("READY") },
    },
  });

  await prisma.taskCard.create({
    data: {
      id: "TC-1039",
      vehicleId: civic.id,
      customerId: davidT.id,
      advisorId: sarah.id,
      mechanicId: priya.id,
      station: "Main Bay / Station 01",
      priority: "LOW",
      status: "COMPLETED",
      issues: "Scheduled oil change and safety check for the Civic",
      services: [{ name: "Oil Change" }, { name: "Safety & Roadworthiness Check" }],
      totalEstimate: 109.98,
      progress: { create: progressSteps("READY") },
    },
  });

  console.log("Seeding demo estimates...");
  await prisma.estimate.create({
    data: {
      id: "ES-2011",
      taskCardId: "TC-1044",
      customerId: owner.id,
      advisorId: sarah.id,
      status: "PENDING",
      summary: "Front brake pads worn — replacement recommended during inspection",
      items: {
        create: [
          { description: "Brake Pad Replacement (labor included)", category: "SERVICE", amount: 149.99 },
          { description: "Brake Pads (Front Set)", category: "PARTS", amount: 89.99 },
          { description: "Brake system labor", category: "LABOR", amount: 60.0 },
        ],
      },
      total: 299.98,
    },
  });
  await prisma.estimate.create({
    data: {
      id: "ES-2010",
      taskCardId: "TC-1045",
      customerId: owner.id,
      advisorId: sarah.id,
      status: "APPROVED",
      summary: "Front brake overhaul approved by owner",
      internalNotes: "Customer approved over chat on Sep 7",
      items: {
        create: [
          { description: "Brake Pad Replacement (labor included)", category: "SERVICE", amount: 149.99 },
          { description: "Brake Pads (Front Set)", category: "PARTS", amount: 89.99 },
          { description: "Brake system labor", category: "LABOR", amount: 80.0 },
        ],
      },
      total: 319.98,
    },
  });
  await prisma.estimate.create({
    data: {
      id: "ES-2012",
      taskCardId: "TC-1046",
      customerId: owner.id,
      advisorId: sarah.id,
      status: "PENDING",
      summary: "Faulty oxygen sensor — replacement recommended after diagnostics",
      items: {
        create: [
          { description: "Engine Diagnostics (labor included)", category: "SERVICE", amount: 89.99 },
          { description: "Oxygen Sensor", category: "PARTS", amount: 59.99 },
          { description: "Sensor replacement labor", category: "LABOR", amount: 45.0 },
        ],
      },
      total: 194.98,
    },
  });

  console.log("Seeding demo invoices + payment...");
  const invoiceItems = (desc: string, amount: number) => [{ id: "li-1", description: desc, category: "service", amount }];
  const withTax = (subtotal: number) => ({ subtotal: money(subtotal), tax: money(subtotal * 0.085), total: money(subtotal * 1.085) });

  const inv3 = withTax(109.98);
  await prisma.invoice.create({
    data: {
      id: "INV-3003",
      taskId: "TC-1043",
      customerId: owner.id,
      vehicleId: f150.id,
      status: "PAID",
      items: invoiceItems("Full Synthetic Oil Change + Air Filter", 109.98),
      laborTotal: 30.0,
      partsTotal: 79.98,
      ...inv3,
      paymentMethod: "CARD",
      last4: "4242",
      paidAt: new Date("2026-09-05T14:20:00.000Z"),
    },
  });
  await prisma.payment.create({
    data: { invoiceId: "INV-3003", taskCardId: "TC-1043", amount: inv3.total, method: "CARD", status: "PAID" },
  });

  const inv2 = withTax(194.99);
  await prisma.invoice.create({
    data: {
      id: "INV-3002",
      taskId: "TC-1042",
      customerId: owner.id,
      vehicleId: camry.id,
      status: "UNPAID",
      items: invoiceItems("12V Battery Replacement", 194.99),
      laborTotal: 45.0,
      partsTotal: 149.99,
      ...inv2,
    },
  });

  const inv1 = withTax(89.99);
  await prisma.invoice.create({
    data: {
      id: "INV-3001",
      taskId: "TC-1041",
      customerId: owner.id,
      vehicleId: f150.id,
      status: "UNPAID",
      items: invoiceItems("AC Gas Refill + Performance Test", 89.99),
      laborTotal: 40.0,
      partsTotal: 49.99,
      ...inv1,
    },
  });

  const inv0 = withTax(249.99);
  await prisma.invoice.create({
    data: {
      id: "INV-3000",
      taskId: "TC-1040",
      customerId: owner.id,
      vehicleId: camry.id,
      status: "PAID",
      issuedAt: new Date("2026-08-14T10:00:00.000Z"),
      items: invoiceItems("Transmission Service & Fluid", 249.99),
      laborTotal: 90.0,
      partsTotal: 159.99,
      ...inv0,
      paymentMethod: "CARD",
      last4: "4242",
      paidAt: new Date("2026-08-14T11:05:00.000Z"),
    },
  });
  await prisma.payment.create({
    data: { invoiceId: "INV-3000", taskCardId: "TC-1040", amount: inv0.total, method: "CARD", status: "PAID" },
  });

  const inv99 = withTax(109.98);
  await prisma.invoice.create({
    data: {
      id: "INV-2099",
      taskId: "TC-1039",
      customerId: davidT.id,
      vehicleId: civic.id,
      status: "PAID",
      issuedAt: new Date("2026-07-09T11:30:00.000Z"),
      items: invoiceItems("Oil Change + Safety Check", 109.98),
      laborTotal: 40.0,
      partsTotal: 69.98,
      ...inv99,
      paymentMethod: "CASH",
      paidAt: new Date("2026-07-09T12:00:00.000Z"),
    },
  });
  await prisma.payment.create({
    data: { invoiceId: "INV-2099", taskCardId: "TC-1039", amount: inv99.total, method: "CASH", status: "PAID" },
  });

  console.log("Seeding demo rating + chat...");
  await prisma.rating.create({
    data: {
      taskId: "TC-1043",
      customerId: owner.id,
      serviceName: "Full Synthetic Oil Change",
      score: 5,
      review: "Quick turnaround and the truck runs noticeably smoother. Transparent pricing, highly recommended.",
    },
  });
  await prisma.rating.create({
    data: {
      taskId: "TC-1039",
      customerId: davidT.id,
      serviceName: "Oil Change",
      score: 4,
      review: "Solid routine service and the car came back clean. Pickup ran a little past the quoted time.",
    },
  });

  const thread = await prisma.chatThread.create({
    data: {
      ownerId: owner.id,
      advisorId: sarah.id,
      subject: "Brake service for Ford F-150 (TC-1045)",
      ownerUnread: 1,
      advisorUnread: 0,
      messages: {
        create: [
          { sender: "OWNER", text: "Hi Sarah! Any update on my F-150 brakes?" },
          { sender: "ADVISOR", text: "Hi John! Alex measured the discs — they are reusable, so we only need the pad set. Estimate sent for your approval." },
          { sender: "OWNER", text: "Approved just now. How long will the fitting take?" },
          { sender: "ADVISOR", text: "About 2 hours including the road test. I will message you the moment testing starts." },
          { sender: "ADVISOR", text: "Quick heads-up: road test moved to after lunch due to a parts delivery. Still on track for today." },
        ],
      },
    },
  });
  await prisma.chatThread.update({ where: { id: thread.id }, data: { lastMessageAt: new Date() } });

  const alexReed = await prisma.user.findUniqueOrThrow({ where: { email: "alex.reed@motorserve.com" } });
  const thread2 = await prisma.chatThread.create({
    data: {
      ownerId: davidT.id,
      advisorId: alexReed.id,
      subject: "Civic oil change follow-up (TC-1039)",
      ownerUnread: 0,
      advisorUnread: 1,
      messages: {
        create: [
          { sender: "OWNER", text: "Thanks for the fast oil change last week — the Civic feels great!" },
          { sender: "ADVISOR", text: "Glad to hear it, David! We'll send a reminder when your next service window opens." },
          { sender: "OWNER", text: "Perfect. Also booking a brake check next month — I'll use the app." },
        ],
      },
    },
  });
  await prisma.chatThread.update({ where: { id: thread2.id }, data: { lastMessageAt: new Date() } });

  console.log("Seeding demo activity log...");
  await prisma.auditLog.createMany({
    data: [
      { id: "demo-audit-1", user: "Sarah Jenkins", action: "Created task card TC-1045 for 2023 Ford F-150", time: new Date("2026-09-08T08:05:00.000Z") },
      { id: "demo-audit-2", user: "John Doe", action: "Approved estimate ES-2010 (front brake overhaul)", time: new Date("2026-09-07T18:40:00.000Z") },
      { id: "demo-audit-3", user: "John Doe", action: "Paid invoice INV-3003 ($119.33) by card", time: new Date("2026-09-05T14:20:00.000Z") },
      { id: "demo-audit-4", user: "Admin User", action: "Approved owner account david.thompson@example.com", time: new Date("2026-08-29T10:00:00.000Z") },
      { id: "demo-audit-5", user: "Alex Turner", action: "Marked task TC-1041 as ready for pickup", time: new Date("2026-09-08T07:50:00.000Z") },
    ],
  });

  console.log("Demo seed complete.");
  console.log("Logins: priya.nair@motorserve.com / david.chen@motorserve.com / alex.reed@motorserve.com (password123)");
  console.log("Owners: markus.rivera@example.com (pending) / michael.benson@example.com (rejected) / david.thompson@example.com (password123)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
