import { Request, Response } from "express";
import { validationSchema } from "../utils/validation";
import { z } from "zod";
import { createPrimaryContact, getAllContacts, returnResult } from "../utils/helper";

export const handleIdentityReconciliation = async (req: Request, res: Response) => {
    try {
        const { email, phoneNumber } = validationSchema.parse(req.body);
        // function to get all primary and secondary contacts from Database
        let result = await getAllContacts(email, phoneNumber);

        if (!result.length) {
            // function to create new Contact and save it in Database
            if (email && phoneNumber) {
                const newContact = await createPrimaryContact(email, phoneNumber);
                // return new contact after creating a Contact in the Database
                return res.status(200).json({
                    contact: {
                        primaryContactId: newContact.id,
                        emails: [newContact.email],
                        phoneNumbers: [newContact.phoneNumber],
                        secondaryContactIds: []
                    }
                })
            } else {
                // return message in case either email and phone number is not given and contact doesn't exist in the Database.
                return res.status(400).json({
                    msg: "Contact doesn't exist and user has to provide both email and phoneNumber"
                })
            }
        }

        returnResult(email, phoneNumber, result, res);

    } catch (e) {
        // Zod Error
        if (e instanceof z.ZodError)
            return res.status(400).json({
                message: e.errors
            });
        // Other Errors
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}