import { Router } from "express";
import {
  previewCsv,
  importCsv,
} from "../controllers/csv.controller.js";
import { uploadCsv } from "../middleware/upload.middleware.js";

const router = Router();

router.post("/preview", uploadCsv.single("file"), previewCsv);

router.post("/import", uploadCsv.single("file"), importCsv);

export default router;