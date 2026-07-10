import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import csvRoutes from "./routes/csv.routes.js";
import geminiRoutes from "./routes/gemini.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

app.use(express.json());

app.use("/api/csv", csvRoutes);
app.use("/api/gemini", geminiRoutes);

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "GrowEasy AI CSV Importer Backend is running 🚀",
  });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log("");
  console.log("==========================================");
  console.log("🚀 GrowEasy AI CSV Importer Backend");
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log(`❤️ Health: http://localhost:${PORT}/api/health`);
  console.log("==========================================");
  console.log("");
});