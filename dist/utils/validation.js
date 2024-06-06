"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const emailSchema = zod_1.default.string().email({ message: "Invalid Email Address" });
const phoneNumberSchema = zod_1.default.string()
    .length(10, { message: "PhoneNumber must be 10 characters long" })
    .regex(/^\d{10}$/, { message: "Phone number must contain only digits" });
// Validation Schema for Email, PhoneNumber using Zod library.
exports.validationSchema = zod_1.default.object({
    email: emailSchema.optional(),
    phoneNumber: phoneNumberSchema.optional(),
}).refine(data => data.phoneNumber || data.email, {
    message: "Either phone number or email must be provided",
    path: ["phoneNumber", "email"]
});
