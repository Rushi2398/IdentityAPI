import { Request, Response } from "express";
import { validationSchema } from "../utils/validation";
import { z } from "zod";
import { createPrimaryContact, createSecondaryContact, getAllContacts, updateSecondaryContact } from "../utils/helper";

export const handleIdentityReconciliation = async (req: Request, res: Response) => {
    try {
        const { email, phoneNumber } = validationSchema.parse(req.body);

        // function to get all primary and secondary contacts from Database
        const result = await getAllContacts(email, phoneNumber);

        if (!result.length) {
            // function to create new Contact and save it in database
            if (email && phoneNumber) {
                const newContact = await createPrimaryContact(email, phoneNumber);
                return res.status(200).json({
                    contact: {
                        primaryContactId: newContact.id,
                        emails: [newContact.email],
                        phoneNumbers: [newContact.phoneNumber],
                        secondaryContactIds: []
                    }
                })
            } else {
                return res.status(400).json({
                    msg: "Contact doesn't exist and user has to provide both email and phoneNumber"
                })
            }
        }

        // get all the primary contacts retrieved from the database.
        const primaryContacts = result.filter(contact => contact.linkedId === null);

        if (primaryContacts.length === 1) {
            const secondaryContact = await createSecondaryContact(email, phoneNumber, primaryContacts[0]);
            result.push(secondaryContact);

            const emailIds = new Set([result.map(contact => contact.email)]);
            const phones = new Set([result.map(contact => contact.phoneNumber)]);
            const secondaryIds = new Set([result.map(contact => contact.linkedId).filter(Boolean)]);

            return res.status(200).json({
                contact: {
                    primaryContactId: primaryContacts[0].id,
                    emails: Array.from(emailIds),
                    phoneNumbers: Array.from(phones),
                    secondaryContactIds: Array.from(secondaryIds)
                }
            })
        }

        if (primaryContacts.length === 2) {
            await updateSecondaryContact(email, phoneNumber, result);

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