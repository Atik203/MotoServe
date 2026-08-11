import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  addJobNote,
  addPartUsed,
  assignMechanic,
  bookAppointment,
  createEstimate,
  createJobCard,
  createService,
  createThread,
  createVehicle,
  decideEstimate,
  deleteService,
  payInvoice,
  rateService,
  sendMessage,
  updateJobStatus,
  updateService,
} from "../controllers/resource.controller.js";
import {
  addJobNoteSchema,
  addPartUsedSchema,
  bookAppointmentSchema,
  createEstimateSchema,
  createJobCardSchema,
  createServiceSchema,
  createThreadSchema,
  createVehicleSchema,
  decideEstimateSchema,
  sendMessageSchema,
  updateJobStatusSchema,
  updateServiceSchema,
} from "../validation/schemas.js";
import {
  getAppointments,
  getCustomers,
  getEmployees,
  getEstimates,
  getInvoices,
  getJob,
  getJobs,
  getParts,
  getRatings,
  getReports,
  getServices,
  getTestimonials,
  getThreads,
  getVehicles,
  verifyOwner,
} from "../controllers/read.controller.js";

export const router = Router();

router.get("/services", getServices);
router.post("/services", requireAuth, requireRole("admin"), validate(createServiceSchema), createService);
router.patch("/services/:id", requireAuth, requireRole("admin"), validate(updateServiceSchema), updateService);
router.delete("/services/:id", requireAuth, requireRole("admin"), deleteService);

router.get("/vehicles", requireAuth, getVehicles);
router.post("/vehicles", requireAuth, requireRole("owner"), validate(createVehicleSchema), createVehicle);

router.get("/appointments", requireAuth, getAppointments);
router.post("/appointments", requireAuth, requireRole("owner"), validate(bookAppointmentSchema), bookAppointment);

router.get("/jobs", requireAuth, getJobs);
router.get("/jobs/:id", requireAuth, getJob);
router.post("/jobs", requireAuth, requireRole("advisor", "admin"), validate(createJobCardSchema), createJobCard);
router.post("/jobs/:id/assign", requireAuth, requireRole("advisor", "admin"), assignMechanic);
router.patch("/jobs/:id/status", requireAuth, requireRole("mechanic", "advisor", "admin"), validate(updateJobStatusSchema), updateJobStatus);
router.post("/jobs/:id/notes", requireAuth, requireRole("mechanic", "advisor", "admin"), validate(addJobNoteSchema), addJobNote);
router.post("/jobs/:id/parts", requireAuth, requireRole("mechanic", "advisor", "admin"), validate(addPartUsedSchema), addPartUsed);
router.post("/jobs/:id/rate", requireAuth, requireRole("owner"), rateService);

router.get("/employees", requireAuth, getEmployees);
router.get("/customers", requireAuth, requireRole("admin", "advisor"), getCustomers);
router.patch("/customers/:id/verify", requireAuth, requireRole("admin"), verifyOwner);

router.get("/estimates", requireAuth, getEstimates);
router.post("/estimates", requireAuth, requireRole("advisor", "admin"), validate(createEstimateSchema), createEstimate);
router.patch("/estimates/:id/decide", requireAuth, requireRole("owner"), validate(decideEstimateSchema), decideEstimate);

router.get("/invoices", requireAuth, getInvoices);
router.post("/invoices/:id/pay", requireAuth, requireRole("owner"), payInvoice);

router.get("/chat/threads", requireAuth, getThreads);
router.post("/chat/threads", requireAuth, requireRole("owner"), validate(createThreadSchema), createThread);
router.post("/chat/messages", requireAuth, validate(sendMessageSchema), sendMessage);

router.get("/parts", requireAuth, getParts);
router.get("/ratings", requireAuth, getRatings);
router.get("/testimonials", getTestimonials);
router.get("/reports", requireAuth, requireRole("admin", "advisor"), getReports);
