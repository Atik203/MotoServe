import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import bcrypt from "bcryptjs";

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

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
