import { Request, Response } from "express";
import { validationSchema } from "../utils/validation";
import { z } from "zod";
import { createContact, getAllContacts } from "../utils/helper";

export const handleIdentityReconciliation = async (req: Request, res: Response) => {
    try {
        const { email, phoneNumber } = validationSchema.parse(req.body);

        // function to get all primary and secondary contacts from Database
        const result = await getAllContacts(email, phoneNumber);

        if (!result) {
            // function to create new Contact and save it in database
            if (email && phoneNumber) {
                const newContact = createContact(email, phoneNumber);
            } else {
                return res.status(400).json({
                    msg: "Contact doesn't exist and user has to provide both email and phoneNumber"
                })
            }
        }
    } catch (e) {
        if (e instanceof z.ZodError)
            return res.status(400).json({
                message: e.errors
            });
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}