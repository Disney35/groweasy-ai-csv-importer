import type { Request, Response } from "express";
import { testGeminiConnection } from "../services/gemini.service.js";

export async function testGemini(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const result = await testGeminiConnection();

    res.status(200).json({
      success: true,
      message: "Gemini connection successful",
      result,
    });
  } catch (error) {
    console.error("Gemini connection error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unknown Gemini error";

    res.status(500).json({
      success: false,
      message: "Gemini connection failed",
      error: message,
    });
  }
}