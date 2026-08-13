import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import bcrypt from "bcryptjs";
import { putObject } from "../src/lib/s3.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEMO_DOC_KEY = "MotoServe/demo/demo-nid.png";

async function uploadDemoDocument(): Promise<string | null> {
  if (!process.env.AWS_ACCESS_KEY_ID) return null;
  try {
    const data = await readFile(path.join(path.dirname(fileURLToPath(import.meta.url)), "demo-nid.png"));
    await putObject(DEMO_DOC_KEY, data, "image/png");
    return DEMO_DOC_KEY;
  } catch (err) {
    console.warn("Could not upload demo document to S3:", err instanceof Error ? err.message : err);
    return null;
  }
}

async function loadJson<T>(path: string): Promise<T> {
  const raw = await readFile(path, "utf-8");
  return JSON.parse(raw) as T;
}

async function main() {
  const demo = (file: string) => loadJson<Record<string, unknown>>(`../frontend/public/demo/${file}`);
  const demoDocKey = await uploadDemoDocument();

  console.log("Seeding database...");

  const services = (await demo("services.json")).services as {
    id: string;
    name: string;
    category: string;
    basePrice: number;
    durationMins: number;
    description: string;
    active: boolean;
    marketing?: unknown;
  }[];

  for (const s of services) {
    await prisma.service.upsert({
      where: { id: s.id },
      update: {
        name: s.name,
        category: s.category.toUpperCase() as never,
        basePrice: s.basePrice,
        durationMins: s.durationMins,
        description: s.description,
        active: s.active,
        marketing: s.marketing ?? undefined,
      },
      create: {
        id: s.id,
        name: s.name,
        category: s.category.toUpperCase() as never,
        basePrice: s.basePrice,
        durationMins: s.durationMins,
        description: s.description,
        active: s.active,
        marketing: s.marketing ?? undefined,
      },
    });
  }

  const customers = (await demo("customers.json")).customers as {
    id: string;
    name: string;
    phone: string;
    email: string;
    nid: string;
    drivingLicense: string;
    status: string;
    verifiedAt: string | null;
  }[];

  for (const c of customers) {
    const status = c.status === "approved" ? "ACTIVE" : c.status === "rejected" ? "REJECTED" : "PENDING";
    await prisma.user.upsert({
      where: { id: c.id },
      update: {
        name: c.name,
        phone: c.phone,
        email: c.email,
        nid: c.nid,
        drivingLicense: c.drivingLicense,
        status: status as never,
        verifiedAt: c.verifiedAt ? new Date(c.verifiedAt) : null,
        documentUrl: status === "PENDING" ? demoDocKey : null,
      },
      create: {
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        nid: c.nid,
        drivingLicense: c.drivingLicense,
        status: status as never,
        verifiedAt: c.verifiedAt ? new Date(c.verifiedAt) : null,
        documentUrl: status === "PENDING" ? demoDocKey : null,
        role: "OWNER",
        passwordHash: await bcrypt.hash("password123", 10),
      },
    });
  }

  const employees = (await demo("employees.json")).employees as {
    id: string;
    name: string;
    role: string;
    email: string;
    phone: string;
    avatar: string;
    station?: string;
    specialization?: string;
    status: string;
    joinedAt: string;
    activeJobs?: number;
    completedJobs?: number;
  }[];

  for (const e of employees) {
    await prisma.user.upsert({
      where: { id: e.id },
      update: {
        name: e.name,
        phone: e.phone,
        email: e.email,
        avatar: e.avatar,
        station: e.station,
        specialization: e.specialization,
        status: e.status.toUpperCase() as never,
      },
      create: {
        id: e.id,
        name: e.name,
        phone: e.phone,
        email: e.email,
        avatar: e.avatar,
        station: e.station,
        specialization: e.specialization,
        status: e.status.toUpperCase() as never,
        role: e.role === "mechanic" ? "MECHANIC" : "ADVISOR",
        passwordHash: await bcrypt.hash("password123", 10),
      },
    });
  }

  const admin = await prisma.user.upsert({
    where: { email: "admin@motorserve.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@motorserve.com",
      passwordHash: await bcrypt.hash("admin123", 10),
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  const vehicles = (await demo("vehicles.json")).vehicles as {
    id: string;
    ownerId: string;
    make: string;
    model: string;
    year: number;
    regNo: string;
    fuelType: string;
    mileage: number;
    image: string;
  }[];

  for (const v of vehicles) {
    await prisma.vehicle.upsert({
      where: { id: v.id },
      update: {
        make: v.make,
        model: v.model,
        year: v.year,
        regNo: v.regNo,
        fuelType: v.fuelType.toUpperCase() as never,
        mileage: v.mileage,
        image: v.image,
      },
      create: {
        id: v.id,
        ownerId: v.ownerId,
        make: v.make,
        model: v.model,
        year: v.year,
        regNo: v.regNo,
        fuelType: v.fuelType.toUpperCase() as never,
        mileage: v.mileage,
        image: v.image,
      },
    });
  }

  const parts = (await demo("parts.json")).parts as {
    id: string;
    name: string;
    sku: string;
    unitPrice: number;
    supplier: string;
    stock: number;
  }[];

  for (const p of parts) {
    await prisma.part.upsert({
      where: { id: p.id },
      update: { name: p.name, unitPrice: p.unitPrice, supplier: p.supplier, stock: p.stock },
      create: { id: p.id, name: p.name, sku: p.sku, unitPrice: p.unitPrice, supplier: p.supplier, stock: p.stock },
    });
  }

  const appointments = (await demo("appointments.json")).appointments as {
    id: string;
    ownerId: string;
    vehicleId: string;
    serviceIds: string[];
    date: string;
    time: string;
    status: string;
    notes: string;
    createdAt: string;
  }[];

  for (const a of appointments) {
    await prisma.appointment.upsert({
      where: { id: a.id },
      update: {
        serviceIds: a.serviceIds,
        date: a.date,
        time: a.time,
        status: a.status.toUpperCase() as never,
        notes: a.notes,
      },
      create: {
        id: a.id,
        ownerId: a.ownerId,
        vehicleId: a.vehicleId,
        serviceIds: a.serviceIds,
        date: a.date,
        time: a.time,
        status: a.status.toUpperCase() as never,
        notes: a.notes,
        createdAt: new Date(a.createdAt),
      },
    });
  }

  const jobs = (await demo("jobs.json")).jobs as {
    id: string;
    vehicleId: string;
    customerId: string;
    advisorId: string;
    mechanicId: string | null;
    station: string | null;
    priority: string;
    status: string;
    services: { id: string; name: string; price: number }[];
    issues: string;
    progress: { step: string; label: string; timestamp: string | null; done: boolean }[];
    notes: { id: string; author: string; time: string; text: string }[];
    partsUsed: { id: string; name: string; qty: number; unitPrice: number; supplier: string; subtotal: number }[];
    photos: string[];
  }[];

  for (const j of jobs) {
    await prisma.jobCard.upsert({
      where: { id: j.id },
      update: {
        mechanicId: j.mechanicId,
        station: j.station,
        priority: j.priority.toUpperCase() as never,
        status: j.status.toUpperCase() as never,
        issues: j.issues,
        services: j.services,
        photos: j.photos,
      },
      create: {
        id: j.id,
        vehicleId: j.vehicleId,
        customerId: j.customerId,
        advisorId: j.advisorId,
        mechanicId: j.mechanicId,
        station: j.station,
        priority: j.priority.toUpperCase() as never,
        status: j.status.toUpperCase() as never,
        issues: j.issues,
        services: j.services,
        photos: j.photos,
      },
    });

    await prisma.jobProgress.deleteMany({ where: { jobCardId: j.id } });
    await prisma.jobProgress.createMany({
      data: j.progress.map((p) => ({
        jobCardId: j.id,
        step: p.step.toUpperCase() as never,
        label: p.label,
        timestamp: p.timestamp,
        done: p.done,
      })),
    });

    await prisma.jobNote.deleteMany({ where: { jobCardId: j.id } });
    await prisma.jobNote.createMany({
      data: j.notes.map((n) => ({ jobCardId: j.id, author: n.author, time: n.time, text: n.text })),
    });

    await prisma.partsUsed.deleteMany({ where: { jobCardId: j.id } });
    await prisma.partsUsed.createMany({
      data: j.partsUsed.map((p) => ({
        jobCardId: j.id,
        name: p.name,
        qty: p.qty,
        unitPrice: p.unitPrice,
        supplier: p.supplier,
        subtotal: p.subtotal,
      })),
    });
  }

  const estimates = (await demo("estimates.json")).estimates as {
    id: string;
    jobId: string;
    customerId: string;
    advisorId: string;
    createdAt: string;
    status: string;
    summary: string;
    items: { id: string; description: string; category: string; amount: number }[];
    total: number;
  }[];

  for (const e of estimates) {
    await prisma.estimate.upsert({
      where: { id: e.id },
      update: { status: e.status.toUpperCase() as never, summary: e.summary, total: e.total },
      create: {
        id: e.id,
        jobCardId: e.jobId,
        customerId: e.customerId,
        advisorId: e.advisorId,
        createdAt: new Date(e.createdAt),
        status: e.status.toUpperCase() as never,
        summary: e.summary,
        total: e.total,
      },
    });
    await prisma.estimateItem.deleteMany({ where: { estimateId: e.id } });
    await prisma.estimateItem.createMany({
      data: e.items.map((i) => ({
        estimateId: e.id,
        description: i.description,
        category: i.category.toUpperCase() as never,
        amount: i.amount,
      })),
    });
  }

  const invoices = (await demo("invoices.json")).invoices as {
    id: string;
    jobId: string;
    customerId: string;
    vehicleId: string;
    issuedAt: string;
    status: string;
    items: unknown;
    laborTotal: number;
    partsTotal: number;
    subtotal: number;
    tax: number;
    total: number;
    payment: { method: string; paidAt: string; last4: string | null } | null;
  }[];

  for (const inv of invoices) {
    await prisma.invoice.upsert({
      where: { id: inv.id },
      update: {
        status: inv.status.toUpperCase() as never,
        items: inv.items,
        laborTotal: inv.laborTotal,
        partsTotal: inv.partsTotal,
        subtotal: inv.subtotal,
        tax: inv.tax,
        total: inv.total,
        paymentMethod: (inv.payment?.method.toUpperCase() ?? null) as never,
        last4: inv.payment?.last4 ?? null,
        paidAt: inv.payment ? new Date(inv.payment.paidAt) : null,
      },
      create: {
        id: inv.id,
        jobId: inv.jobId,
        customerId: inv.customerId,
        vehicleId: inv.vehicleId,
        issuedAt: new Date(inv.issuedAt),
        status: inv.status.toUpperCase() as never,
        items: inv.items,
        laborTotal: inv.laborTotal,
        partsTotal: inv.partsTotal,
        subtotal: inv.subtotal,
        tax: inv.tax,
        total: inv.total,
        paymentMethod: (inv.payment?.method.toUpperCase() ?? null) as never,
        last4: inv.payment?.last4 ?? null,
        paidAt: inv.payment ? new Date(inv.payment.paidAt) : null,
      },
    });
  }

  const threads = (await demo("messages.json")).threads as {
    id: string;
    ownerId: string;
    advisorId: string;
    subject: string;
    unread: number;
    lastMessageAt: string;
    messages: { id: string; sender: string; text: string; time: string }[];
  }[];

  for (const t of threads) {
    await prisma.chatThread.upsert({
      where: { id: t.id },
      update: { ownerUnread: t.unread, advisorUnread: t.unread, lastMessageAt: new Date(t.lastMessageAt) },
      create: {
        id: t.id,
        ownerId: t.ownerId,
        advisorId: t.advisorId,
        subject: t.subject,
        ownerUnread: t.unread,
        advisorUnread: t.unread,
        lastMessageAt: new Date(t.lastMessageAt),
      },
    });
    await prisma.message.deleteMany({ where: { threadId: t.id } });
    await prisma.message.createMany({
      data: t.messages.map((m) => ({
        threadId: t.id,
        sender: m.sender === "advisor" ? "ADVISOR" : "OWNER",
        text: m.text,
        time: new Date(m.time),
      })),
    });
  }

  const testimonialsData = await demo("testimonials.json");
  const testimonials = (testimonialsData.reviews ?? testimonialsData.testimonials) as {
    id: string;
    name: string;
    role?: string;
    rating: number;
    review: string;
    date?: string;
  }[];

  for (const t of testimonials) {
    const vehicle = t.name.split(" ")[0] + " vehicle";
    await prisma.testimonial.upsert({
      where: { id: t.id },
      update: { name: t.name, vehicle, rating: Math.round(t.rating), review: t.review },
      create: { id: t.id, name: t.name, vehicle, rating: Math.round(t.rating), review: t.review, date: new Date() },
    });
  }

  await prisma.auditLog.create({
    data: { user: "Seed", action: `Database seeded with demo data (admin: ${admin.email})` },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
