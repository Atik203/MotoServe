import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import bcrypt from "bcryptjs";

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

const PARTS = [
  { name: "Brake Pads (Front Set)", sku: "BRK-PAD-001", unitPrice: 89.99, supplier: "AutoParts Co", stock: 24 },
  { name: "Brake Disc (Rotor)", sku: "BRK-DSC-002", unitPrice: 129.99, supplier: "AutoParts Co", stock: 12 },
  { name: "Engine Oil Filter", sku: "OIL-FLT-003", unitPrice: 14.99, supplier: "FilterHub", stock: 3 },
  { name: "12V Car Battery", sku: "BAT-12V-004", unitPrice: 149.99, supplier: "VoltSource", stock: 0 },
  { name: "Engine Air Filter", sku: "AIR-FLT-005", unitPrice: 39.99, supplier: "FilterHub", stock: 30 },
  { name: "Wiper Blades (Pair)", sku: "WPR-BLD-006", unitPrice: 19.99, supplier: "ClearView", stock: 8 },
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

  console.log("Seeding demo parts...");
  for (const part of PARTS) {
    await prisma.part.upsert({
      where: { sku: part.sku },
      update: { stock: part.stock, unitPrice: part.unitPrice },
      create: part,
    });
  }

  console.log("Clearing previous demo transactional data...");
  await prisma.jobCard.deleteMany({ where: { customerId: owner.id } });
  await prisma.appointment.deleteMany({ where: { ownerId: owner.id } });
  await prisma.chatThread.deleteMany({ where: { ownerId: owner.id } });

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

  console.log("Seeding demo jobs...");
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

  await prisma.jobCard.create({
    data: {
      id: "JC-1045",
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

  await prisma.jobCard.create({
    data: {
      id: "JC-1044",
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

  await prisma.jobCard.create({
    data: {
      id: "JC-1043",
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

  await prisma.jobCard.create({
    data: {
      id: "JC-1042",
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

  await prisma.jobCard.create({
    data: {
      id: "JC-1041",
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

  console.log("Seeding demo estimates...");
  await prisma.estimate.create({
    data: {
      id: "ES-2011",
      jobCardId: "JC-1044",
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
      jobCardId: "JC-1045",
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

  console.log("Seeding demo invoices + payment...");
  const invoiceItems = (desc: string, amount: number) => [{ id: "li-1", description: desc, category: "service", amount }];
  const withTax = (subtotal: number) => ({ subtotal: money(subtotal), tax: money(subtotal * 0.085), total: money(subtotal * 1.085) });

  const inv3 = withTax(109.98);
  await prisma.invoice.create({
    data: {
      id: "INV-3003",
      jobId: "JC-1043",
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
    data: { invoiceId: "INV-3003", jobCardId: "JC-1043", amount: inv3.total, method: "CARD", status: "PAID" },
  });

  const inv2 = withTax(194.99);
  await prisma.invoice.create({
    data: {
      id: "INV-3002",
      jobId: "JC-1042",
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
      jobId: "JC-1041",
      customerId: owner.id,
      vehicleId: f150.id,
      status: "UNPAID",
      items: invoiceItems("AC Gas Refill + Performance Test", 89.99),
      laborTotal: 40.0,
      partsTotal: 49.99,
      ...inv1,
    },
  });

  console.log("Seeding demo rating + chat...");
  await prisma.rating.create({
    data: {
      jobId: "JC-1043",
      customerId: owner.id,
      serviceName: "Full Synthetic Oil Change",
      score: 5,
      review: "Quick turnaround and the truck runs noticeably smoother. Transparent pricing, highly recommended.",
    },
  });

  const thread = await prisma.chatThread.create({
    data: {
      ownerId: owner.id,
      advisorId: sarah.id,
      subject: "Brake service for Ford F-150 (JC-1045)",
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

  console.log("Demo seed complete.");
  console.log("Logins: priya.nair@motorserve.com / david.chen@motorserve.com / alex.reed@motorserve.com (password123)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
