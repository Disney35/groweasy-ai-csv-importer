"use client";

import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import { importCsv, previewCsv } from "@/lib/api";

import type {
  ImportResponse,
  PreviewResponse,
} from "@/types/crm";

type AppStep = "upload" | "preview" | "result";

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<AppStep>("upload");

  const [file, setFile] = useState<File | null>(null);

  const [preview, setPreview] =
    useState<PreviewResponse | null>(null);

  const [result, setResult] =
    useState<ImportResponse | null>(null);

  const [isDragging, setIsDragging] = useState(false);

  const [isPreviewing, setIsPreviewing] =
    useState(false);

  const [isImporting, setIsImporting] =
    useState(false);

  const [importProgress, setImportProgress] =
    useState(0);

  const [processingMessage, setProcessingMessage] =
    useState("");

  const [error, setError] = useState("");

  // BONUS: Dark mode
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [themeReady, setThemeReady] = useState(false);

  /*
   * BONUS: DARK MODE
   * - Restores saved theme
   * - Falls back to system preference
   * - Applies one global data-theme attribute to <html>
   */
  useEffect(() => {
    const savedTheme = localStorage.getItem("groweasy-theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    const shouldUseDark =
      savedTheme === "dark" ||
      (savedTheme === null && prefersDark);

    setIsDarkMode(shouldUseDark);
    document.documentElement.setAttribute(
      "data-theme",
      shouldUseDark ? "dark" : "light"
    );
    setThemeReady(true);
  }, []);

  useEffect(() => {
    if (!themeReady) {
      return;
    }

    const theme = isDarkMode ? "dark" : "light";

    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("groweasy-theme", theme);
  }, [isDarkMode, themeReady]);

  /*
   * AI PROCESSING PROGRESS
   */
  useEffect(() => {
    if (!isImporting) {
      return;
    }

    const messages = [
      "Preparing CSV records...",
      "Sending records to Gemini AI...",
      "Detecting customer information...",
      "Mapping CRM fields...",
      "Validating emails and mobile numbers...",
      "Normalizing lead statuses...",
      "Checking data sources...",
      "Finalizing CRM records...",
    ];

    setImportProgress(5);
    setProcessingMessage(messages[0]);

    const interval = window.setInterval(() => {
      setImportProgress((currentProgress) => {
        if (currentProgress >= 92) {
          return 92;
        }

        const increment =
          Math.floor(Math.random() * 7) + 2;

        const nextProgress = Math.min(
          currentProgress + increment,
          92
        );

        const messageIndex = Math.min(
          Math.floor(
            (nextProgress / 100) * messages.length
          ),
          messages.length - 1
        );

        setProcessingMessage(
          messages[messageIndex]
        );

        return nextProgress;
      });
    }, 700);

    return () => {
      window.clearInterval(interval);
    };
  }, [isImporting]);

  /*
   * FILE HANDLING
   */
  async function handleFile(
    selectedFile: File
  ) {
    setError("");

    if (
      !selectedFile.name
        .toLowerCase()
        .endsWith(".csv")
    ) {
      setError(
        "Please select a valid CSV file."
      );

      return;
    }

    setFile(selectedFile);
    setIsPreviewing(true);

    try {
      const response =
        await previewCsv(selectedFile);

      setPreview(response);
      setStep("preview");
    } catch (err) {
      setFile(null);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to preview CSV file."
      );
    } finally {
      setIsPreviewing(false);
    }
  }

  function handleInputChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const selectedFile =
      event.target.files?.[0];

    if (selectedFile) {
      void handleFile(selectedFile);
    }
  }

  /*
   * DRAG AND DROP
   */
  function handleDragOver(
    event: DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();

    setIsDragging(true);
  }

  function handleDragLeave(
    event: DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();

    setIsDragging(false);
  }

  function handleDrop(
    event: DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();

    setIsDragging(false);

    const selectedFile =
      event.dataTransfer.files?.[0];

    if (selectedFile) {
      void handleFile(selectedFile);
    }
  }

  /*
   * CONFIRM AI IMPORT
   */
  async function handleConfirmImport() {
    if (!file) {
      return;
    }

    setError("");
    setResult(null);

    setImportProgress(5);

    setProcessingMessage(
      "Preparing CSV records..."
    );

    setIsImporting(true);

    try {
      const response = await importCsv(file);

      setImportProgress(100);

      setProcessingMessage(
        "AI extraction completed successfully!"
      );

      await new Promise<void>((resolve) => {
        window.setTimeout(
          () => resolve(),
          500
        );
      });

      setResult(response);
      setStep("result");
    } catch (err) {
      setImportProgress(0);

      setProcessingMessage("");

      setError(
        err instanceof Error
          ? err.message
          : "AI import failed."
      );
    } finally {
      setIsImporting(false);
    }
  }

  /*
   * RESET IMPORTER
   */
  function resetImporter() {
    setStep("upload");

    setFile(null);

    setPreview(null);

    setResult(null);

    setError("");

    setImportProgress(0);

    setProcessingMessage("");

    setIsDragging(false);

    setIsPreviewing(false);

    setIsImporting(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <main className="app-shell">
      {/* =========================
          TOP BAR
      ========================= */}

      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">
            G
          </div>

          <div>
            <h1>GrowEasy</h1>

            <p>AI CSV Importer</p>
          </div>
        </div>

        <div className="topbar-actions">
          <div className="ai-badge">
            <span className="ai-dot" />

            Powered by Gemini AI
          </div>

          <button
            type="button"
            className="theme-toggle"
            onClick={() =>
              setIsDarkMode(
                (currentMode) =>
                  !currentMode
              )
            }
            aria-label={
              isDarkMode
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
            aria-pressed={isDarkMode}
            title={
              isDarkMode
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
          >
            <span className="theme-icon">
              {isDarkMode ? "☀" : "☾"}
            </span>

            <span>
              {isDarkMode
                ? "Light"
                : "Dark"}
            </span>
          </button>
        </div>
      </header>

      {/* =========================
          HERO
      ========================= */}

      <section className="hero">
        <div className="hero-badge">
          ✦ Intelligent CRM Data Extraction
        </div>

        <h2>
          Turn any CSV into
          <span> clean CRM leads.</span>
        </h2>

        <p>
          Upload messy exports from Facebook,
          Google Ads, spreadsheets, sales
          reports, or any CRM. Our AI
          intelligently maps every field into
          GrowEasy format.
        </p>
      </section>

      {/* =========================
          STEPS
      ========================= */}

      <section className="steps">
        <div
          className={`step ${
            step === "upload"
              ? "active"
              : "completed"
          }`}
        >
          <span>1</span>

          <div>
            <strong>Upload</strong>

            <small>Select your CSV</small>
          </div>
        </div>

        <div className="step-line" />

        <div
          className={`step ${
            step === "preview"
              ? "active"
              : step === "result"
                ? "completed"
                : ""
          }`}
        >
          <span>2</span>

          <div>
            <strong>Preview</strong>

            <small>Review raw data</small>
          </div>
        </div>

        <div className="step-line" />

        <div
          className={`step ${
            step === "result"
              ? "active"
              : ""
          }`}
        >
          <span>3</span>

          <div>
            <strong>AI Results</strong>

            <small>Import CRM leads</small>
          </div>
        </div>
      </section>

      {/* =========================
          ERROR MESSAGE
      ========================= */}

      {error && (
        <div className="error-box">
          <span>!</span>

          <p>{error}</p>
        </div>
      )}

      {/* =========================
          STEP 1: UPLOAD
      ========================= */}

      {step === "upload" && (
        <section className="card upload-card">
          <div
            className={`drop-zone ${
              isDragging
                ? "dragging"
                : ""
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() =>
              fileInputRef.current?.click()
            }
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleInputChange}
              hidden
            />

            {isPreviewing ? (
              <div className="loading-content">
                <div className="spinner" />

                <h3>
                  Reading your CSV...
                </h3>

                <p>
                  Preparing a safe preview.
                  No AI yet.
                </p>
              </div>
            ) : (
              <>
                <div className="upload-icon">
                  ↑
                </div>

                <h3>
                  Drop your CSV file here
                </h3>

                <p>
                  or{" "}
                  <strong>
                    browse from your computer
                  </strong>
                </p>

                <small>
                  Supports any valid CSV
                  format
                </small>
              </>
            )}
          </div>

          <div className="feature-row">
            <div>
              <span>✓</span>
              Any column names
            </div>

            <div>
              <span>✓</span>
              Messy data supported
            </div>

            <div>
              <span>✓</span>
              AI-powered mapping
            </div>
          </div>
        </section>
      )}

      {/* =========================
          STEP 2: PREVIEW
      ========================= */}

      {step === "preview" &&
        preview && (
          <section className="card">
            <div className="section-header">
              <div>
                <span className="section-label">
                  STEP 2
                </span>

                <h3>
                  Preview uploaded data
                </h3>

                <p>
                  Review the original CSV
                  before starting AI
                  extraction.
                </p>
              </div>

              <div className="file-chip">
                <span>CSV</span>

                <div>
                  <strong>
                    {preview.fileName}
                  </strong>

                  <small>
                    {preview.totalRows} rows
                    detected
                  </small>
                </div>
              </div>
            </div>

            <div className="table-meta">
              <p>
                Showing preview of{" "}
                <strong>
                  {preview.preview.length}
                </strong>{" "}
                rows
              </p>

              <p>
                <strong>
                  {preview.columns.length}
                </strong>{" "}
                columns detected
              </p>
            </div>

            <div className="table-wrapper preview-table">
              <table>
                <thead>
                  <tr>
                    <th>#</th>

                    {preview.columns.map(
                      (column) => (
                        <th key={column}>
                          {column}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {preview.preview.map(
                    (row, rowIndex) => (
                      <tr key={rowIndex}>
                        <td className="row-number">
                          {rowIndex + 1}
                        </td>

                        {preview.columns.map(
                          (column) => (
                            <td key={column}>
                              {row[column] || (
                                <span className="empty-value">
                                  Empty
                                </span>
                              )}
                            </td>
                          )
                        )}
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            <div className="action-bar">
              <button
                className="secondary-button"
                onClick={resetImporter}
                disabled={isImporting}
              >
                ← Choose another file
              </button>

              <button
                className="primary-button"
                onClick={
                  handleConfirmImport
                }
                disabled={isImporting}
              >
                {isImporting ? (
                  <>
                    <span className="button-spinner" />

                    Gemini is extracting
                    leads...
                  </>
                ) : (
                  <>
                    ✦ Confirm & Run AI
                    Import
                  </>
                )}
              </button>
            </div>

            {/* BONUS: AI PROGRESS */}

            {isImporting && (
              <div className="processing-panel">
                <div className="progress-header">
                  <div>
                    <strong>
                      AI is intelligently
                      mapping your data
                    </strong>

                    <p>
                      {processingMessage}
                    </p>
                  </div>

                  <strong className="progress-percentage">
                    {importProgress}%
                  </strong>
                </div>

                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${importProgress}%`,
                    }}
                  />
                </div>

                <div className="progress-footer">
                  <span>
                    Gemini AI processing
                  </span>

                  <span>
                    {importProgress < 100
                      ? "Please keep this page open"
                      : "Completed"}
                  </span>
                </div>
              </div>
            )}
          </section>
        )}

      {/* =========================
          STEP 3: RESULTS
      ========================= */}

      {step === "result" &&
        result && (
          <>
            <section className="success-banner">
              <div className="success-icon">
                ✓
              </div>

              <div>
                <h3>
                  Import completed
                  successfully
                </h3>

                <p>
                  Gemini finished extracting
                  your CRM records.
                </p>
              </div>

              <button
                onClick={resetImporter}
              >
                Import another CSV
              </button>
            </section>

            {/* STATISTICS */}

            <section className="stats-grid">
              <div className="stat-card">
                <span>Total rows</span>

                <strong>
                  {result.totalRows}
                </strong>

                <small>
                  Processed by the system
                </small>
              </div>

              <div className="stat-card success-stat">
                <span>Imported</span>

                <strong>
                  {result.totalImported}
                </strong>

                <small>
                  Valid CRM records
                </small>
              </div>

              <div className="stat-card skipped-stat">
                <span>Skipped</span>

                <strong>
                  {result.totalSkipped}
                </strong>

                <small>
                  Missing contact details
                </small>
              </div>

              <div className="stat-card">
                <span>
                  Success rate
                </span>

                <strong>
                  {result.totalRows > 0
                    ? Math.round(
                        (result.totalImported /
                          result.totalRows) *
                          100
                      )
                    : 0}
                  %
                </strong>

                <small>
                  Successfully extracted
                </small>
              </div>
            </section>

            {/* IMPORTED RECORDS */}

            <section className="card results-card">
              <div className="section-header">
                <div>
                  <span className="section-label success-label">
                    IMPORTED
                  </span>

                  <h3>CRM records</h3>

                  <p>
                    Clean, AI-extracted leads
                    ready for GrowEasy CRM.
                  </p>
                </div>

                <div className="count-badge">
                  {result.totalImported}{" "}
                  records
                </div>
              </div>

              <div className="table-wrapper results-table">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Contact</th>
                      <th>Company</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Notes</th>
                      <th>Source</th>
                    </tr>
                  </thead>

                  <tbody>
                    {result.imported.map(
                      (record, index) => (
                        <tr
                          key={`${record.email}-${index}`}
                        >
                          <td className="row-number">
                            {index + 1}
                          </td>

                          <td>
                            <strong className="person-name">
                              {record.name ||
                                "—"}
                            </strong>
                          </td>

                          <td>
                            <div className="contact-cell">
                              <span>
                                {record.email ||
                                  "No email"}
                              </span>

                              <small>
                                {
                                  record.country_code
                                }

                                {record.mobile_without_country_code ||
                                  "No mobile"}
                              </small>
                            </div>
                          </td>

                          <td>
                            {record.company ||
                              "—"}
                          </td>

                          <td>
                            {[
                              record.city,
                              record.state,
                              record.country,
                            ]
                              .filter(Boolean)
                              .join(", ") ||
                              "—"}
                          </td>

                          <td>
                            {record.crm_status ? (
                              <span
                                className={`status-badge ${record.crm_status
                                  .toLowerCase()
                                  .replaceAll(
                                    "_",
                                    "-"
                                  )}`}
                              >
                                {record.crm_status
                                  .replaceAll(
                                    "_",
                                    " "
                                  )
                                  .toLowerCase()}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>

                          <td className="notes-cell">
                            {record.crm_note ||
                              "—"}
                          </td>

                          <td>
                            {record.data_source
                              ? record.data_source
                                  .replaceAll(
                                    "_",
                                    " "
                                  )
                                  .replace(
                                    /\b\w/g,
                                    (char) =>
                                      char.toUpperCase()
                                  )
                              : "—"}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* SKIPPED RECORDS */}

            {result.skipped.length >
              0 && (
              <section className="card skipped-card">
                <div className="section-header">
                  <div>
                    <span className="section-label warning-label">
                      SKIPPED
                    </span>

                    <h3>
                      Records needing
                      attention
                    </h3>

                    <p>
                      These rows were not
                      imported because they
                      have no usable email or
                      mobile number.
                    </p>
                  </div>

                  <div className="count-badge warning-count">
                    {result.totalSkipped}{" "}
                    skipped
                  </div>
                </div>

                <div className="skipped-list">
                  {result.skipped.map(
                    (record) => (
                      <div
                        className="skipped-item"
                        key={
                          record.sourceIndex
                        }
                      >
                        <div className="skipped-number">
                          {record.sourceIndex +
                            1}
                        </div>

                        <div>
                          <strong>
                            {record.reason}
                          </strong>

                          <p>
                            {Object.entries(
                              record.originalRecord
                            )
                              .map(
                                ([
                                  key,
                                  value,
                                ]) =>
                                  `${key}: ${
                                    value ||
                                    "Empty"
                                  }`
                              )
                              .join(" • ")}
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </section>
            )}
          </>
        )}

      {/* =========================
          FOOTER
      ========================= */}

      <footer>
        <p>
          Built for the GrowEasy Software
          Developer Assignment
        </p>

        <span>
          Secure processing • Gemini AI • No
          database storage
        </span>
      </footer>
    </main>
  );
}