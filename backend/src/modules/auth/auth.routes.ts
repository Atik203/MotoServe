import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { login, logout, me, register } from "./auth.controller.js";
import { loginSchema, registerSchema } from "./auth.validation.js";

export const router = Router();

router.post("/login", validate(loginSchema), login);
router.post("/register", validate(registerSchema), register);
router.get("/me", requireAuth, me);
router.post("/logout", logout);
