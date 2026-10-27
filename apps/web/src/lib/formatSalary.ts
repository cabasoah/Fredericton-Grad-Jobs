type SalaryFields = {
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
};

const formatAmount = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: "compact",
    // Explicit minimum: the currency style defaults to 2 decimals, and newer
    // ICU versions (e.g. Node 22.23) then print "$70.0K" instead of "$70K".
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(amount);

// "$70K - $80K / Year", "From $80K / Year", "Up to $50K / Year", or
// "Salary not listed". Non-USD currencies are prefixed, e.g. "CA$70K".
export const formatSalary = ({ salaryMin, salaryMax, currency }: SalaryFields) => {
  if (salaryMin !== null && salaryMax !== null) {
    return salaryMin === salaryMax
      ? `${formatAmount(salaryMin, currency)} / Year`
      : `${formatAmount(salaryMin, currency)} - ${formatAmount(salaryMax, currency)} / Year`;
  }
  if (salaryMin !== null) return `From ${formatAmount(salaryMin, currency)} / Year`;
  if (salaryMax !== null) return `Up to ${formatAmount(salaryMax, currency)} / Year`;
  return "Salary not listed";
};

const formatFullAmount = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);

// Full amounts for the job page, e.g. "$70,000 – $80,000 per year" or
// "CA$60,000 – CA$75,000 per year".
export const formatSalaryRange = ({ salaryMin, salaryMax, currency }: SalaryFields) => {
  if (salaryMin !== null && salaryMax !== null) {
    return salaryMin === salaryMax
      ? `${formatFullAmount(salaryMin, currency)} per year`
      : `${formatFullAmount(salaryMin, currency)} – ${formatFullAmount(salaryMax, currency)} per year`;
  }
  if (salaryMin !== null) return `From ${formatFullAmount(salaryMin, currency)} per year`;
  if (salaryMax !== null) return `Up to ${formatFullAmount(salaryMax, currency)} per year`;
  return "Salary not listed";
};
