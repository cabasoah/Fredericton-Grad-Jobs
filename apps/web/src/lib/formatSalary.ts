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
