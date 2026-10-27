import { APPLICATION_STAGE_LABELS, type Application } from "@fredericton-grad-jobs/shared";

const COLUMNS: [header: string, value: (application: Application) => string][] = [
  ["Company", (a) => a.companyName],
  ["Role", (a) => a.roleTitle],
  ["Stage", (a) => APPLICATION_STAGE_LABELS[a.stage]],
  ["Applied", (a) => a.appliedAt?.slice(0, 10) ?? ""],
  ["Next follow-up", (a) => a.nextFollowUpAt?.slice(0, 10) ?? ""],
  ["URL", (a) => a.url ?? ""],
  ["Notes", (a) => a.notes],
  ["Added", (a) => a.createdAt.slice(0, 10)],
  ["Last updated", (a) => a.updatedAt.slice(0, 10)],
];

// Spreadsheets run cells starting with these as formulas ("CSV injection"),
// so such values are prefixed with an apostrophe.
const FORMULA_START = /^[=+\-@\t\r]/;

const cell = (value: string) => {
  const safe = FORMULA_START.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

// RFC 4180 CSV with a header row and CRLF line endings.
export const applicationsToCsv = (applications: Application[]) =>
  [COLUMNS.map(([header]) => header), ...applications.map((a) => COLUMNS.map(([, value]) => value(a)))]
    .map((row) => row.map(cell).join(","))
    .join("\r\n") + "\r\n";

// Starts a download of the CSV in the browser.
export const downloadCsv = (csv: string, filename: string) => {
  // The BOM makes Excel read the file as UTF-8 (accents, em dashes).
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
