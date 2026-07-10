import { z } from "zod";

export const CRM_STATUS_VALUES = [
  "GOOD_LEAD_FOLLOW_UP",
  "DID_NOT_CONNECT",
  "BAD_LEAD",
  "SALE_DONE",
] as const;

export const DATA_SOURCE_VALUES = [
  "leads_on_demand",
  "meridian_tower",
  "eden_park",
  "varah_swamy",
  "sarjapur_plots",
  "facebook_ads",
  "google_ads",
  "instagram",
  "website",
  "manual_entry",
] as const;

export const crmRecordSchema = z.object({
  created_at: z.string().default(""),
  name: z.string().default(""),
  email: z.string().default(""),
  country_code: z.string().default(""),
  mobile_without_country_code: z.string().default(""),
  company: z.string().default(""),
  city: z.string().default(""),
  state: z.string().default(""),
  country: z.string().default(""),
  lead_owner: z.string().default(""),

  crm_status: z
    .enum(CRM_STATUS_VALUES)
    .or(z.literal(""))
    .default(""),

  crm_note: z.string().default(""),

  data_source: z
    .enum(DATA_SOURCE_VALUES)
    .or(z.literal(""))
    .default(""),

  possession_time: z.string().default(""),
  description: z.string().default(""),
});

export type CrmRecord = z.infer<typeof crmRecordSchema>;

export const aiExtractionResponseSchema = z.object({
  records: z.array(
    z.object({
      source_index: z.number().int().nonnegative(),
      skipped: z.boolean(),
      skip_reason: z.string().default(""),
      crm_record: crmRecordSchema,
    })
  ),
});

export type AiExtractionResponse = z.infer<
  typeof aiExtractionResponseSchema
>;