import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import {
  getAppointments,
  getCustomers,
  getEmployees,
  getEstimates,
  getHealth,
  getInvoices,
  getJob,
  getJobs,
  getParts,
  getRatings,
  getServices,
  getTestimonials,
  getThreads,
  getVehicles,
  sendMessage,
  updateAppointmentController,
} from "./shared.controller.js";
import { sendMessageSchema, updateAppointmentSchema } from "./shared.validation.js";

export const router = Router();

router.get("/health", getHealth);

router.get("/services", getServices);

router.get("/vehicles", requireAuth, getVehicles);

router.get("/appointments", requireAuth, getAppointments);
router.patch("/appointments/:id", requireAuth, requireRole("owner", "advisor", "admin"), validate(updateAppointmentSchema), updateAppointmentController);

router.get("/jobs", requireAuth, getJobs);
router.get("/jobs/:id", requireAuth, getJob);

router.get("/employees", requireAuth, getEmployees);
router.get("/customers", requireAuth, requireRole("admin", "advisor"), getCustomers);

router.get("/estimates", requireAuth, getEstimates);
router.get("/invoices", requireAuth, getInvoices);

router.get("/chat/threads", requireAuth, getThreads);
router.post("/chat/messages", requireAuth, validate(sendMessageSchema), sendMessage);

router.get("/parts", requireAuth, getParts);
router.get("/ratings", requireAuth, getRatings);
router.get("/testimonials", getTestimonials);
