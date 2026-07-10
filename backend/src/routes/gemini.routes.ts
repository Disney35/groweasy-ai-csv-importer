import { Router } from "express";
import { testGemini } from "../controllers/gemini.controller.js";

const router = Router();

router.get("/test", testGemini);

export default router;