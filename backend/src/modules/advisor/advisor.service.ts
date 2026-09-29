import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../middleware/error.js";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import type { TaskCard, Prisma } from "../../generated/prisma/client.js";
import { createWithSequentialId } from "../../lib/ids.js";
import { round2, summarizeItems } from "../../lib/pricing.js";
import type { AssignMechanicBody, CreateCustomerBody, CreateEstimateBody, CreateTaskCardBody } from "./advisor.types.js";

export async function createTaskCard(advisorId: string, body: CreateTaskCardBody) {
  if (body.appointmentId) {
    const appointment = await prisma.appointment.findUnique({ where: { id: body.appointmentId } });
    if (!appointment) throw new ApiError(404, "Appointment not found");
    if (appointment.vehicleId !== body.vehicleId) {
      throw new ApiError(400, "Appointment belongs to a different vehicle");
    }
    const existingTask = await prisma.taskCard.findUnique({
      where: { appointmentId: body.appointmentId },
      select: { id: true },
    });
    if (existingTask) {
      throw new ApiError(409, `Appointment already has task card #${existingTask.id}`);
    }
  }

  const resolvedMechanicIds: string[] = Array.isArray(body.mechanicIds) && body.mechanicIds.length > 0
    ? body.mechanicIds.filter(Boolean)
    : body.mechanicId
      ? [body.mechanicId]
      : [];

  if (resolvedMechanicIds.length > 0) {
    const mechanics = await prisma.user.findMany({
      where: { id: { in: resolvedMechanicIds } },
    });
    if (mechanics.length !== resolvedMechanicIds.length) {
      throw new ApiError(404, "One or more selected mechanics not found");
    }
    const nonMechanic = mechanics.find((m) => m.role !== "MECHANIC");
    if (nonMechanic) {
      throw new ApiError(400, `User ${nonMechanic.name} is not a mechanic`);
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
      assignmentNotes: body.assignmentNotes ?? body.notes,
      mileage: body.mileage,
      fuelLevel: body.fuelLevel,
      keysReceived: body.keysReceived,
      accessories: body.accessories,
      appointmentId: body.appointmentId,
      expectedDate: body.expectedDate,
      mechanicId: resolvedMechanicIds[0] ?? null,
      mechanicIds: resolvedMechanicIds,
      mechanics: resolvedMechanicIds.length
        ? { connect: resolvedMechanicIds.map((mId) => ({ id: mId })) }
        : undefined,
      services: serviceLines.length
        ? (serviceLines.map((s) => ({
            id: s.id,
            name: s.name,
            price: s.basePrice,
            durationMins: s.durationMins,
            laborRate: s.laborRate,
            category: s.category,
          })) as unknown as Prisma.InputJsonValue)
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

export const createTask = createTaskCard;

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
  const existing = await prisma.taskCard.findUnique({
    where: { id },
    include: {
      mechanics: { select: { id: true, name: true } },
      mechanic: { select: { id: true, name: true } },
    },
  });
  if (!existing) throw new ApiError(404, "Task not found");

  if (existing.status === "COMPLETED") {
    throw new ApiError(400, "Completed tasks cannot be reassigned");
  }
  if (existing.status === "READY" && !body.force) {
    throw new ApiError(400, "Task is ready for pickup — reassignment requires force");
  }

  const resolvedMechanicIds: string[] = Array.isArray(body.mechanicIds)
    ? body.mechanicIds.filter(Boolean)
    : body.mechanicId
      ? [body.mechanicId]
      : [];

  if (resolvedMechanicIds.length === 0 && !body.unassign) {
    throw new ApiError(400, "Select at least one mechanic, or pass unassign to clear the assignment");
  }

  if (resolvedMechanicIds.length > 0) {
    const mechanics = await prisma.user.findMany({
      where: { id: { in: resolvedMechanicIds } },
    });
    if (mechanics.length !== resolvedMechanicIds.length) {
      throw new ApiError(404, "One or more selected mechanics not found");
    }
    const nonMechanic = mechanics.find((m) => m.role !== "MECHANIC");
    if (nonMechanic) {
      throw new ApiError(400, `User ${nonMechanic.name} is not a mechanic`);
    }
  }

  const previousNames = existing.mechanics.length > 0
    ? existing.mechanics.map((m) => m.name)
    : existing.mechanic
      ? [existing.mechanic.name]
      : [];

  const data: Prisma.TaskCardUncheckedUpdateInput = {
    mechanicId: resolvedMechanicIds[0] ?? null,
    mechanicIds: resolvedMechanicIds,
    mechanics: {
      set: resolvedMechanicIds.map((mId) => ({ id: mId })),
    },
  };
  if (body.station !== undefined) data.station = body.station.trim() ? body.station.trim() : null;
  if (body.notes !== undefined) data.assignmentNotes = body.notes.trim() ? body.notes.trim() : null;

  const task = await prisma.taskCard.update({
    where: { id },
    data,
    include: {
      mechanics: { select: { id: true, name: true, avatar: true, specialization: true, station: true } },
      mechanic: { select: { id: true, name: true, avatar: true } },
    },
  });

  return {
    task,
    previous: previousNames,
    assigned: task.mechanics.map((m) => m.name),
    reassigned: previousNames.length > 0,
  };
}

export type EstimateWithItems = Prisma.EstimateGetPayload<{ include: { items: true } }>;

export async function createEstimate(
  advisorId: string,
  role: string,
  body: CreateEstimateBody,
): Promise<EstimateWithItems> {
  const targetId = body.taskId;
  const task = await prisma.taskCard.findUnique({ where: { id: targetId }, select: { customerId: true, status: true, advisorId: true } });
  if (!task) throw new ApiError(404, "Task not found");
  if (task.status === "COMPLETED") throw new ApiError(400, "Cannot estimate a completed task");
  if (role === "ADVISOR" && task.advisorId && task.advisorId !== advisorId) {
    throw new ApiError(403, "You can only create estimates for tasks assigned to you");
  }
  if (!task.advisorId) {
    await prisma.taskCard.update({
      where: { id: targetId },
      data: { advisorId },
    });
  }
  const totals = summarizeItems(body.items);
  const items = body.items.map((i) => ({
    description: i.description,
    category: i.category.toUpperCase() as never,
    serviceId: i.serviceId ?? null,
    qty: i.qty ?? 1,
    rate: i.rate ?? null,
    amount: round2(i.amount),
  }));
  const pricing = {
    servicesTotal: totals.servicesTotal,
    laborTotal: totals.laborTotal,
    partsTotal: totals.partsTotal,
    subtotal: totals.subtotal,
    tax: totals.tax,
    total: totals.total,
  };

  const existing = await prisma.estimate.findFirst({
    where: { taskCardId: targetId },
    select: { id: true },
  });

  if (existing) {
    return prisma.estimate.update({
      where: { id: existing.id },
      data: {
        advisorId,
        summary: body.summary ?? "",
        internalNotes: body.internalNotes,
        ...pricing,
        status: "PENDING" as never,
        items: { deleteMany: {}, create: items },
      },
      include: { items: true },
    }) as unknown as Promise<EstimateWithItems>;
  }

  return createWithSequentialId<EstimateWithItems>(prisma.estimate, "ES-", 3300, (id) => ({
    data: {
      id,
      taskCardId: targetId,
      customerId: task.customerId,
      advisorId,
      summary: body.summary ?? "",
      internalNotes: body.internalNotes,
      ...pricing,
      items: {
        create: items,
      },
    },
    include: { items: true },
  }));
}

