import { describe, expect, it } from "vitest";
import { aiExtractionResponseSchema } from "../schemas/crm.schema.js";

const createValidCrmRecord = () => ({
  created_at: "2026-06-01T10:30:00Z",
  name: "Arjun Reddy",
  email: "arjun@example.com",
  country_code: "+91",
  mobile_without_country_code: "9876543210",
  company: "Sunrise Estates",
  city: "Hyderabad",
  state: "Telangana",
  country: "India",
  lead_owner: "",
  crm_status: "GOOD_LEAD_FOLLOW_UP",
  crm_note: "Please arrange a site visit.",
  data_source: "meridian_tower",
  possession_time: "",
  description: "",
});

describe("AI Extraction Response Schema", () => {
  it("accepts a valid imported CRM record", () => {
    const result = aiExtractionResponseSchema.parse({
      records: [
        {
          source_index: 0,
          skipped: false,
          skip_reason: "",
          crm_record: createValidCrmRecord(),
        },
      ],
    });

    expect(result.records).toHaveLength(1);
    expect(result.records[0].skipped).toBe(false);
    expect(result.records[0].crm_record.name).toBe("Arjun Reddy");
  });

  it("accepts a skipped record with no customer contact details", () => {
    const result = aiExtractionResponseSchema.parse({
      records: [
        {
          source_index: 5,
          skipped: true,
          skip_reason: "No customer email or mobile number found.",
          crm_record: {
            ...createValidCrmRecord(),
            email: "",
            country_code: "",
            mobile_without_country_code: "",
          },
        },
      ],
    });

    expect(result.records[0].skipped).toBe(true);
    expect(result.records[0].skip_reason).toBe(
      "No customer email or mobile number found."
    );
  });

  it("accepts all four allowed CRM status values", () => {
    const allowedStatuses = [
      "GOOD_LEAD_FOLLOW_UP",
      "DID_NOT_CONNECT",
      "BAD_LEAD",
      "SALE_DONE",
    ];

    for (const crmStatus of allowedStatuses) {
      const result = aiExtractionResponseSchema.parse({
        records: [
          {
            source_index: 0,
            skipped: false,
            skip_reason: "",
            crm_record: {
              ...createValidCrmRecord(),
              crm_status: crmStatus,
            },
          },
        ],
      });

      expect(result.records[0].crm_record.crm_status).toBe(crmStatus);
    }
  });

  it("rejects an invalid CRM status", () => {
    const invalidResponse = {
      records: [
        {
          source_index: 0,
          skipped: false,
          skip_reason: "",
          crm_record: {
            ...createValidCrmRecord(),
            crm_status: "INTERESTED",
          },
        },
      ],
    };

    expect(() =>
      aiExtractionResponseSchema.parse(invalidResponse)
    ).toThrow();
  });

  it("accepts a valid GrowEasy data source", () => {
    const result = aiExtractionResponseSchema.parse({
      records: [
        {
          source_index: 0,
          skipped: false,
          skip_reason: "",
          crm_record: {
            ...createValidCrmRecord(),
            data_source: "eden_park",
          },
        },
      ],
    });

    expect(result.records[0].crm_record.data_source).toBe("eden_park");
  });

  it("rejects an invalid data source", () => {
    const invalidResponse = {
      records: [
        {
          source_index: 0,
          skipped: false,
          skip_reason: "",
          crm_record: {
            ...createValidCrmRecord(),
            data_source: "random_campaign",
          },
        },
      ],
    };

    expect(() =>
      aiExtractionResponseSchema.parse(invalidResponse)
    ).toThrow();
  });

  it("rejects a response without the records array", () => {
    expect(() =>
      aiExtractionResponseSchema.parse({})
    ).toThrow();
  });
});