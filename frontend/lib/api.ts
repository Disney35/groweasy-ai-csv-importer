import type {
  ImportResponse,
  PreviewResponse,
} from "@/types/crm";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5000";

async function sendCsv<T>(
  endpoint: string,
  file: File
): Promise<T> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ??
      data.error ??
      "Something went wrong."
    );
  }

  return data as T;
}

export function previewCsv(
  file: File
): Promise<PreviewResponse> {
  return sendCsv<PreviewResponse>(
    "/api/csv/preview",
    file
  );
}

export function importCsv(
  file: File
): Promise<ImportResponse> {
  return sendCsv<ImportResponse>(
    "/api/csv/import",
    file
  );
}