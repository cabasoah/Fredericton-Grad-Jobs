// Initials on a soft colour picked from the company name, so the same
// company always gets the same colour. Used instead of logos, which most
// companies do not provide.
const PALETTE = [
  "bg-indigo-100 text-indigo-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-800",
  "bg-sky-100 text-sky-700",
  "bg-rose-100 text-rose-700",
  "bg-violet-100 text-violet-700",
];

const SIZES = {
  sm: "h-9 w-9 text-xs rounded-lg",
  md: "h-11 w-11 text-sm rounded-xl",
  lg: "h-14 w-14 text-base rounded-2xl",
};

const initials =(name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? `${words[0]?.[0] ?? ""}${words[1]?.[0] ?? ""}` : name.trim().slice(0, 2);
  return letters.toUpperCase() || "?";
};

const colourFor = (name: string) => {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
};

const CompanyAvatar = ({ name, size = "md" }: { name: string; size?: keyof typeof SIZES }) => (
  <span aria-hidden className={`inline-flex shrink-0 items-center justify-center font-semibold ${SIZES[size]} ${colourFor(name)}`}>
    {initials(name)}
  </span>
);

export default CompanyAvatar;
