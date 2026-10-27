// <input type="date"> uses "YYYY-MM-DD" in the viewer's local time zone.
export const toDateInputValue = (iso: string | null) => {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

// "" -> null (cleared), otherwise the date string the API accepts.
export const fromDateInputValue = (value: string) => (value === "" ? null : value);

export const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
