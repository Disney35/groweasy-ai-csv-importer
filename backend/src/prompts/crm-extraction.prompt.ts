import type { CsvRecord } from "../services/csv.service.js";

export function buildCrmExtractionPrompt(
  records: CsvRecord[]
): string {
  return `
You are an expert CRM data normalization engine.

Your task is to intelligently convert messy CSV records into GrowEasy CRM records.

IMPORTANT:

The CSV column names are NOT fixed.

Understand fields using:
- column names
- synonyms
- abbreviations
- values
- context

INPUT RECORDS:

${JSON.stringify(records, null, 2)}

TARGET CRM FIELDS:

created_at
name
email
country_code
mobile_without_country_code
company
city
state
country
lead_owner
crm_status
crm_note
data_source
possession_time
description

RULES:

1. CONTACT VALIDATION

A record is valid only if it contains at least one CUSTOMER contact method:

- at least one customer/lead email
OR
- at least one customer/lead mobile number

IMPORTANT:

Emails belonging to:
- lead owners
- assigned agents
- salespeople
- employees
- account managers
- internal staff
- team members

do NOT count as customer contact information.

If the customer has neither a customer email nor a customer mobile number:

- set "skipped" to true
- provide a clear "skip_reason"

If the customer has at least one valid customer email or customer mobile number:

- set "skipped" to false
- set "skip_reason" to an empty string

Never mark a record valid only because an Assigned Agent or Lead Owner has an email address.

2. EMAILS

Identify customer/lead emails separately from internal staff emails.

CUSTOMER EMAIL RULES:

Use only an email belonging to:
- lead
- customer
- prospect
- contact person

Possible customer email columns include:
- email
- email address
- contact email
- customer email
- lead email
- mail id
- primary email

Never use an email from these types of columns as the customer's "email":

- assigned agent
- assigned to
- lead owner
- owner
- salesperson
- sales person
- account manager
- employee
- staff
- team member

Emails from those columns belong in "lead_owner".

Example:

Input:

Customer Email: ""
Assigned Agent: "sales@groweasy.ai"
Phone: "+91 9123456789"

Correct output:

email: ""
lead_owner: "sales@groweasy.ai"
country_code: "+91"
mobile_without_country_code: "9123456789"

The record is valid because it has a customer mobile number.

Never copy "lead_owner" into "email".

If multiple CUSTOMER emails exist:

- use the first customer email in "email"
- put additional customer emails in "crm_note"

Example:

Main Email: "arjun@example.com"
Second Email: "arjun.work@example.com"

Output:

email: "arjun@example.com"

Add to crm_note:

"Additional Email: arjun.work@example.com"

If the customer has no email:

email: ""

3. MOBILE NUMBERS

Identify customer/lead mobile numbers separately from staff or owner phone numbers.

Use only a mobile number belonging to the:
- lead
- customer
- prospect
- contact person

If multiple customer mobile numbers exist:

- use the first customer mobile number as the primary mobile
- separate the country code from the mobile number
- put additional customer mobile numbers in "crm_note"

Example:

Primary Contact: "+91 98765 43210"
Alternate Phone: "+91 91234 56789"

Output:

country_code: "+91"
mobile_without_country_code: "9876543210"

Add to crm_note:

"Additional Mobile: +91 9123456789"

COUNTRY CODE EXAMPLES:

"+91 98765 43210"

becomes:

country_code: "+91"
mobile_without_country_code: "9876543210"

"+91-9123456789"

becomes:

country_code: "+91"
mobile_without_country_code: "9123456789"

"9876543210"

becomes:

country_code: ""
mobile_without_country_code: "9876543210"

Remove formatting characters such as:
- spaces
- hyphens
- parentheses

from the primary mobile number.

Do not invent:
- a mobile number
- a country code

Do not infer "+91" only because a city is in India.

4. LEAD OWNER

Use "lead_owner" for information belonging to:

- assigned agent
- lead owner
- assigned to
- salesperson
- sales representative
- account manager
- relationship manager
- internal owner

If an Assigned Agent field contains:

sales@groweasy.ai

then:

lead_owner: "sales@groweasy.ai"

Do not copy the lead owner into:
- email
- crm_note

unless the source data explicitly requires it as useful additional information.

5. CRM STATUS

Only these values are allowed:

GOOD_LEAD_FOLLOW_UP
DID_NOT_CONNECT
BAD_LEAD
SALE_DONE

Map status meaning intelligently.

GOOD_LEAD_FOLLOW_UP examples:

- interested
- follow up
- call later
- demo requested
- hot lead
- positive lead
- site visit requested
- send brochure

→ GOOD_LEAD_FOLLOW_UP

DID_NOT_CONNECT examples:

- not connected
- no answer
- did not answer
- phone not answered
- unreachable
- busy
- could not connect

→ DID_NOT_CONNECT

BAD_LEAD examples:

- not interested
- wrong lead
- invalid lead
- rejected
- customer rejected

→ BAD_LEAD

SALE_DONE examples:

- converted
- sale completed
- deal closed
- closed
- purchased
- booking completed

→ SALE_DONE

STATUS PRIORITY RULE:

Determine crm_status primarily from an explicit status-like field.

Examples of status-like columns:

- status
- lead status
- current status
- customer status
- lead situation
- lead stage
- stage

Use notes and remarks only as supporting context.

IMPORTANT EXAMPLES:

If explicit status is:

"No Answer"

and note says:

"Call again next Monday"

the correct status is:

DID_NOT_CONNECT

NOT:

GOOD_LEAD_FOLLOW_UP

If explicit status is:

"Not Connected"

and note says:

"Try again tomorrow"

the correct status is:

DID_NOT_CONNECT

Do not allow a follow-up instruction inside notes or remarks to override an explicit:

- No Answer
- Not Connected
- Busy
- Unreachable

If status cannot be confidently determined:

crm_status: ""

6. DATA SOURCE

Only these five non-empty values are allowed:

leads_on_demand
meridian_tower
eden_park
varah_swamy
sarjapur_plots

Map source values only when the input clearly matches one of those five GrowEasy sources.

Examples:

"Leads On Demand"
"leads_on_demand"
"Leads-on-Demand"

→ leads_on_demand

"Meridian Tower"
"meridian_tower"

→ meridian_tower

"Eden Park"
"eden_park"

→ eden_park

"Varah Swamy"
"varah_swamy"

→ varah_swamy

"Sarjapur Plots"
"sarjapur_plots"

→ sarjapur_plots

GENERIC SOURCES ARE NOT ALLOWED.

These examples must become an empty string:

- Facebook
- Facebook Ads
- Meta Ads
- Google
- Google Ads
- Instagram
- Website
- Web Form
- Landing Page
- Manual
- Manual Entry
- CSV Upload

For any generic or unsupported source:

data_source: ""

Never return values such as:

facebook_ads
google_ads
instagram
website
manual_entry

Never invent a source.

7. DATE

Use a reliable lead creation date for "created_at".

Possible date columns include:

- created at
- created_at
- lead created
- creation date
- date created
- timestamp

The final created_at value must be convertible using:

new Date(created_at)

Valid examples include:

"2026-06-01 10:30:00"

"2026-06-02T14:15:00Z"

If no reliable date exists:

created_at: ""

Never invent a date.

8. LOCATION

Split combined locations intelligently into:

city
state
country

Example:

"Mumbai, Maharashtra, India"

becomes:

city: "Mumbai"
state: "Maharashtra"
country: "India"

Example:

"Hyderabad, Telangana"

becomes:

city: "Hyderabad"
state: "Telangana"

If the input contains only a city:

store it in "city".

Do not invent missing location information.

Infer country only when strongly supported by the input.

9. COMPANY

Use company-related values from fields such as:

- company
- company name
- organisation
- organization
- business
- business name

Do not invent a company.

10. CRM NOTES

Use "crm_note" for:

- remarks
- customer notes
- follow-up notes
- comments
- additional customer emails
- additional customer phone numbers
- useful information that does not fit another CRM field

Preserve useful original notes.

If extra contact information exists, append it to the note.

Example:

Original remark:

"Please arrange a site visit"

Extra email:

"arjun.work@example.com"

Extra mobile:

"+91 9123456789"

Possible crm_note:

"Please arrange a site visit. Additional Email: arjun.work@example.com. Additional Mobile: +91 9123456789"

Keep crm_note on one line.

Do not insert actual line breaks.

Replace actual line breaks with spaces or escaped \\n.

11. POSSESSION TIME

Use "possession_time" for information describing property availability or possession timing.

Examples:

- possession
- possession time
- possession date
- ready to move
- handover
- expected possession

Preserve the supported source value.

Examples:

"December 2026"
"March 2027"
"Ready to move"
"6 months"

Do not invent possession information.

12. DESCRIPTION

Use "description" for:

- additional details
- extra details
- property requirements
- lead requirements
- general descriptions

Do not move a clear CRM remark into description when it belongs in crm_note.

Do not invent a description.

13. MISSING VALUES

Use empty strings for missing values.

Never use:

null
undefined
N/A

Do not use "Unknown" as a replacement for missing data.

Preserve "Unknown" only when it is actual meaningful source data.

14. NO HALLUCINATION

Never invent:

- names
- emails
- phone numbers
- country codes
- companies
- locations
- dates
- lead owners
- statuses
- sources
- possession times
- descriptions

Return only information supported by the input.

15. PRESERVE ROW TRACKING

For every input record, preserve its zero-based input position as "source_index".

The first input record must use:

source_index: 0

The second input record must use:

source_index: 1

Continue in the original input order.

Return exactly one output record for every input record.

Skipped input records must still have their own output item with:

- correct source_index
- skipped: true
- clear skip_reason

16. OUTPUT

Return JSON only.

Do not return:

- markdown
- explanations
- code fences
- comments
- text before the JSON
- text after the JSON
`;
}