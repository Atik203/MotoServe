import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../middleware/error.js";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import type { Estimate, TaskCard, Prisma } from "../../generated/prisma/client.js";
import { createWithSequentialId } from "../../lib/ids.js";
import type { AssignMechanicBody, CreateCustomerBody, CreateEstimateBody, CreateTaskCardBody } from "./advisor.types.js";

export async function createTaskCard(advisorId: string, body: CreateTaskCardBody) {
  if (body.appointmentId) {
    const appointment = await prisma.appointment.findUnique({ where: { id: body.appointmentId } });
    if (!appointment) throw new ApiError(404, "Appointment not found");
    if (appointment.vehicleId !== body.vehicleId) {
      throw new ApiError(400, "Appointment belongs to a different vehicle");
    }
  }
  const serviceLines = body.serviceIds?.length
    ? await prisma.service.findMany({ where: { id: { in: body.serviceIds } } })
    : [];
  const task = await createWithSequentialId<TaskCard>(prisma.taskCard, "TC-", 1040, (id) => ({
    data: {
      id,
      vehicleId: body.vehicleId,
      customerId: body.customerId,
      advisorId,
      issues: body.issues,
      priority: (body.priority ?? "medium").toUpperCase() as never,
      station: body.station,
      mileage: body.mileage,
      fuelLevel: body.fuelLevel,
      keysReceived: body.keysReceived,
      accessories: body.accessories,
      appointmentId: body.appointmentId,
      expectedDate: body.expectedDate,
      services: serviceLines.length
        ? (serviceLines.map((s) => ({ id: s.id, name: s.name, price: s.basePrice })) as unknown as Prisma.InputJsonValue)
        : undefined,
      status: "RECEIVED",
    },
  }));
  await prisma.taskProgress.createMany({
    data: [
      { taskCardId: task.id, step: "RECEIVED", label: "Vehicle Received", done: true },
      { taskCardId: task.id, step: "INSPECTING", label: "Initial Inspection", done: false },
      { taskCardId: task.id, step: "REPAIRING", label: "Repairing", done: false },
      { taskCardId: task.id, step: "TESTING", label: "Testing", done: false },
      { taskCardId: task.id, step: "READY", label: "Ready for Pickup", done: false },
      { taskCardId: task.id, step: "COMPLETED", label: "Completed", done: false },
    ],
  });
  return task;
}

export async function createCustomer(body: CreateCustomerBody) {
  const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 10);
  return prisma.user.create({
    data: {
      name: body.name,
      phone: body.phone,
      email: body.email || `${body.phone.replace(/[^0-9]/g, "")}.walkin@motorserve.com`,
      passwordHash,
      role: "OWNER",
      status: "PENDING",
      nid: body.nid,
      occupation: body.occupation,
      street: body.street,
      city: body.city,
      district: body.district,
      zip: body.zip,
      country: body.country,
    },
  });
}

export async function assignMechanic(id: string, body: AssignMechanicBody) {
  const mechanic = await prisma.user.findUnique({ where: { id: body.mechanicId } });
  if (!mechanic) throw new ApiError(404, "Mechanic not found");
  if (mechanic.role !== "MECHANIC") throw new ApiError(400, "Selected user is not a mechanic");
  const data: Prisma.TaskCardUncheckedUpdateInput = { mechanicId: body.mechanicId };
  if (body.station) data.station = body.station;
  if (body.notes) data.assignmentNotes = body.notes;
  return prisma.taskCard.update({ where: { id }, data });
}

export async function createEstimate(advisorId: string, role: string, body: CreateEstimateBody) {
  const targetId = body.taskId;
  const task = await prisma.taskCard.findUnique({ where: { id: targetId }, select: { customerId: true, status: true, advisorId: true } });
  if (!task) throw new ApiError(404, "Task not found");
  if (task.status === "COMPLETED") throw new ApiError(400, "Cannot estimate a completed task");
  if (role === "ADVISOR" && task.advisorId !== advisorId) {
    throw new ApiError(403, "You can only create estimates for tasks assigned to you");
  }
  const total = body.items.reduce((sum, i) => sum + i.amount, 0);
  return createWithSequentialId<Estimate>(prisma.estimate, "ES-", 3300, (id) => ({
    data: {
      id,
      taskCardId: targetId,
      customerId: task.customerId,
      advisorId,
      summary: body.summary ?? "",
      internalNotes: body.internalNotes,
      total,
      items: {
        create: body.items.map((i) => ({
          description: i.description,
          category: i.category.toUpperCase() as never,
          amount: i.amount,
        })),
      },
    },
    include: { items: true },
  }));
}

