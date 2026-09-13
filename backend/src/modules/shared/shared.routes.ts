import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import {
  getAppointment,
  getAppointments,
  getArchivedTasks,
  getCustomers,
  getEmployees,
  getEstimates,
  getEstimate,
  getHealth,
  getInvoices,
  getParts,
  getRatings,
  getServices,
  getStations,
  createStationController,
  updateStationController,
  deleteStationController,
  getTask,
  getTasks,
  getTestimonials,
  getContent,
  getThreads,
  getVehicles,
  markThreadReadController,
  sendMessage,
  createThreadController,
  updateAppointmentController,
  deleteAppointmentController,
} from "./shared.controller.js";

import { createThreadSchema, sendMessageSchema, updateAppointmentSchema } from "./shared.validation.js";

export const router = Router();

router.get("/health", getHealth);

router.get("/services", getServices);

router.get("/vehicles", requireAuth, getVehicles);

router.get("/appointments", requireAuth, getAppointments);
router.get("/appointments/:id", requireAuth, getAppointment);
router.patch("/appointments/:id", requireAuth, requireRole("owner", "advisor", "admin"), validate(updateAppointmentSchema), updateAppointmentController);
router.delete("/appointments/:id", requireAuth, requireRole("advisor", "admin"), deleteAppointmentController);

router.get("/tasks", requireAuth, getTasks);

router.get("/tasks/archived", requireAuth, requireRole("owner"), getArchivedTasks);

router.get("/tasks/:id", requireAuth, getTask);


router.get("/employees", requireAuth, getEmployees);
router.get("/customers", requireAuth, requireRole("admin", "advisor"), getCustomers);

router.get("/estimates", requireAuth, getEstimates);
router.get("/estimates/:id", requireAuth, getEstimate);
router.get("/invoices", requireAuth, getInvoices);

router.get("/chat/threads", requireAuth, getThreads);
router.post("/chat/threads", requireAuth, requireRole("owner", "advisor"), validate(createThreadSchema), createThreadController);
router.post("/chat/messages", requireAuth, validate(sendMessageSchema), sendMessage);
router.post("/chat/threads/:id/read", requireAuth, requireRole("owner", "advisor"), markThreadReadController);

router.get("/parts", requireAuth, getParts);
router.get("/ratings", requireAuth, getRatings);
router.get("/testimonials", getTestimonials);
router.get("/content/:key", getContent);

router.get("/stations", requireAuth, getStations);
router.post("/stations", requireAuth, requireRole("admin"), createStationController);
router.patch("/stations/:id", requireAuth, requireRole("admin"), updateStationController);
router.delete("/stations/:id", requireAuth, requireRole("admin"), deleteStationController);
