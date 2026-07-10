import type { Request, Response } from "express";
import { parseCsvBuffer } from "../services/csv.service.js";
import { processCsvImport } from "../services/import.service.js";

export function previewCsv(req: Request, res: Response): void {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "Please upload a CSV file.",
      });
      return;
    }

    const records = parseCsvBuffer(req.file.buffer);

    if (records.length === 0) {
      res.status(400).json({
        success: false,
        message: "The CSV file contains no data rows.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      fileName: req.file.originalname,
      totalRows: records.length,
      columns: Object.keys(records[0] ?? {}),
      preview: records.slice(0, 10),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to parse CSV.";

    res.status(400).json({
      success: false,
      message,
    });
  }
}
export async function importCsv(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "Please upload a CSV file.",
      });
      return;
    }

    const records = parseCsvBuffer(req.file.buffer);

    if (records.length === 0) {
      res.status(400).json({
        success: false,
        message: "The CSV file contains no data rows.",
      });
      return;
    }

    console.log("");
    console.log(`🚀 Starting AI import for ${records.length} rows`);

    const result = await processCsvImport(records);

    console.log(
      `✅ Import complete: ${result.totalImported} imported, ${result.totalSkipped} skipped`
    );

    res.status(200).json({
      success: true,
      message: "CSV processed successfully.",
      ...result,
    });
  } catch (error) {
    console.error("CSV import error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to process CSV import.";

    res.status(500).json({
      success: false,
      message: "AI import failed.",
      error: message,
    });
  }
}