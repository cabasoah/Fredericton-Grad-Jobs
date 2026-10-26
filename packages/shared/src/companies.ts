import { z } from "zod";

// Company as returned by the API.
export const CompanySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  website: z.string().nullable(),
  logoUrl: z.string().nullable(),
  contactEmail: z.string().nullable(),
  contactPhone: z.string().nullable(),
  createdAt: z.iso.datetime(),
});

// Company details submitted with a new job. Optional fields are omitted
// (not sent as empty strings) when the user leaves them blank.
export const CompanyInputSchema = z.strictObject({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional(),
  website: z.url().optional(),
  logoUrl: z.url().optional(),
  contactEmail: z.email().optional(),
  contactPhone: z.string().trim().max(50).optional(),
});

export type Company = z.infer<typeof CompanySchema>;
export type CompanyInput = z.infer<typeof CompanyInputSchema>;
