import z from "zod";

export const doctorFormSchema = z.object({
  specialty: z.string().min(1, "Specialty is required"),
  experience: z
    .number({ invalid_type_error: "Experience must be a number" })
    .int()
    .min(1, "Experience must be at least 1 year")
    .max(70, "Experience must be less than 70 years"),
});
