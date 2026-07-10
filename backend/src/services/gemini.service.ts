import { GoogleGenAI, Type } from "@google/genai";
import type { CsvRecord } from "./csv.service.js";
import { buildCrmExtractionPrompt } from "../prompts/crm-extraction.prompt.js";
import {
  aiExtractionResponseSchema,
  type AiExtractionResponse,
} from "../schemas/crm.schema.js";

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is missing. Please check backend/.env"
    );
  }

  return new GoogleGenAI({ apiKey });
}

export async function testGeminiConnection(): Promise<string> {
  const ai = getGeminiClient();

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Reply with exactly: GEMINI_CONNECTED",
  });

  return response.text?.trim() || "No response received";
}

export async function extractCrmRecords(
  records: CsvRecord[]
): Promise<AiExtractionResponse> {
  const ai = getGeminiClient();

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: buildCrmExtractionPrompt(records),

    config: {
      temperature: 0.1,
      responseMimeType: "application/json",

      responseSchema: {
        type: Type.OBJECT,

        properties: {
          records: {
            type: Type.ARRAY,

            items: {
              type: Type.OBJECT,

              properties: {
                source_index: {
                  type: Type.INTEGER,
                },

                skipped: {
                  type: Type.BOOLEAN,
                },

                skip_reason: {
                  type: Type.STRING,
                },

                crm_record: {
                  type: Type.OBJECT,

                  properties: {
                    created_at: {
                      type: Type.STRING,
                    },

                    name: {
                      type: Type.STRING,
                    },

                    email: {
                      type: Type.STRING,
                    },

                    country_code: {
                      type: Type.STRING,
                    },

                    mobile_without_country_code: {
                      type: Type.STRING,
                    },

                    company: {
                      type: Type.STRING,
                    },

                    city: {
                      type: Type.STRING,
                    },

                    state: {
                      type: Type.STRING,
                    },

                    country: {
                      type: Type.STRING,
                    },

                    lead_owner: {
                      type: Type.STRING,
                    },

                    crm_status: {
                      type: Type.STRING,
                      enum: [
                        "GOOD_LEAD_FOLLOW_UP",
                        "DID_NOT_CONNECT",
                        "BAD_LEAD",
                        "SALE_DONE",
                      ],
                    },

                    crm_note: {
                      type: Type.STRING,
                    },

                    data_source: {
                      type: Type.STRING,
                    },

                    possession_time: {
                      type: Type.STRING,
                    },

                    description: {
                      type: Type.STRING,
                    },
                  },

                  required: [
                    "created_at",
                    "name",
                    "email",
                    "country_code",
                    "mobile_without_country_code",
                    "company",
                    "city",
                    "state",
                    "country",
                    "lead_owner",
                    "crm_status",
                    "crm_note",
                    "data_source",
                    "possession_time",
                    "description",
                  ],
                },
              },

              required: [
                "source_index",
                "skipped",
                "skip_reason",
                "crm_record",
              ],
            },
          },
        },

        required: ["records"],
      },
    },
  });

  if (!response.text) {
    throw new Error("Gemini returned an empty response.");
  }

const parsedJson = JSON.parse(response.text) as AiExtractionResponse;

const allowedDataSources = new Set([
  "leads_on_demand",
  "meridian_tower",
  "eden_park",
  "varah_swamy",
  "sarjapur_plots",
]);

for (const item of parsedJson.records) {
  if (!allowedDataSources.has(item.crm_record.data_source)) {
    item.crm_record.data_source = "";
  }
}

return aiExtractionResponseSchema.parse(parsedJson);
}