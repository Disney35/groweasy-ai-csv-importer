import type { CsvRecord } from "./csv.service.js";
import { extractCrmRecords } from "./gemini.service.js";
import type { CrmRecord } from "../schemas/crm.schema.js";

const BATCH_SIZE = 20;
const MAX_RETRIES = 2;

export interface SkippedRecord {
  sourceIndex: number;
  reason: string;
  originalRecord: CsvRecord;
}

export interface ImportResult {
  imported: CrmRecord[];
  skipped: SkippedRecord[];
  totalRows: number;
  totalImported: number;
  totalSkipped: number;
}

function splitIntoBatches<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }

  return batches;
}

async function processBatchWithRetry(
  batch: CsvRecord[],
  batchStartIndex: number
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    try {
      console.log(
        `🤖 Processing batch starting at row ${batchStartIndex + 1}, attempt ${attempt}`
      );

      return await extractCrmRecords(batch);
    } catch (error) {
      lastError = error;

      console.error(
        `❌ Batch attempt ${attempt} failed:`,
        error instanceof Error ? error.message : error
      );

      if (attempt <= MAX_RETRIES) {
        const waitTime = 1000 * attempt;

        console.log(`⏳ Retrying in ${waitTime}ms...`);

        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError;
}

export async function processCsvImport(
  records: CsvRecord[]
): Promise<ImportResult> {
  const imported: CrmRecord[] = [];
  const skipped: SkippedRecord[] = [];

  const batches = splitIntoBatches(records, BATCH_SIZE);

  console.log(
    `📦 Processing ${records.length} rows in ${batches.length} batch(es)`
  );

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];

    if (!batch) {
      continue;
    }

    const batchStartIndex = batchIndex * BATCH_SIZE;

    const aiResult = await processBatchWithRetry(
      batch,
      batchStartIndex
    );

    for (const result of aiResult.records) {
      const globalSourceIndex =
        batchStartIndex + result.source_index;

      const originalRecord =
        records[globalSourceIndex] ?? {};

      const hasEmail =
        result.crm_record.email.trim().length > 0;

      const hasMobile =
        result.crm_record.mobile_without_country_code.trim().length > 0;

      if (result.skipped || (!hasEmail && !hasMobile)) {
        skipped.push({
          sourceIndex: globalSourceIndex,
          reason:
            result.skip_reason ||
            "Record contains neither email nor mobile number.",
          originalRecord,
        });

        continue;
      }

      imported.push(result.crm_record);
    }
  }

  return {
    imported,
    skipped,
    totalRows: records.length,
    totalImported: imported.length,
    totalSkipped: skipped.length,
  };
}