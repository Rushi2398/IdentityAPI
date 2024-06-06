import z from 'zod';

const emailSchema = z.string().email({ message: "Invalid Email Address" });

const phoneNumberSchema = z.string()
    .length(10, { message: "PhoneNumber must be 10 characters long" })
    .regex(/^\d{10}$/, { message: "Phone number must contain only digits" });

// Validation Schema for Email, PhoneNumber using Zod library.
export const validationSchema = z.object({
    email: emailSchema.optional(),
    phoneNumber: phoneNumberSchema.optional(),
}).refine(data => data.phoneNumber || data.email, {
    message: "Either phone number or email must be provided",
    path: ["phoneNumber", "email"]
});