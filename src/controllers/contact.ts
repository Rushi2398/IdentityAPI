import { Request, Response } from "express";
import { validationSchema } from "../utils/validation";
import { z } from "zod";
import { createPrimaryContact, createSecondaryContact, getAllContacts, updateSecondaryContact } from "../utils/helper";

export const handleIdentityReconciliation = async (req: Request, res: Response) => {
    try {
        const { email, phoneNumber } = validationSchema.parse(req.body);
        // const { email, phoneNumber } = req.body;
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

        // get all the primary contacts retrieved from the database.
        const primaryContacts = result.filter(contact => contact.linkedId === null);

        // Case 1: Where there is only one primary Contact for the given email and phoneNumber
        if (primaryContacts.length === 1) {
            let contactExist = result.some(contact => contact.email === email && contact.phoneNumber === phoneNumber);
            contactExist = email && phoneNumber ? contactExist : true;
            if (!contactExist) {
                const secondaryContact = await createSecondaryContact(email, phoneNumber, primaryContacts[0]);
                result.push(secondaryContact);
            }
            const emailIds = new Set(result.map(contact => contact.email));
            const phones = new Set(result.map(contact => contact.phoneNumber));
            const secondaryIds = new Set(result.filter(contact => contact.id !== primaryContacts[0].id).map(contact => contact.id));

            return res.status(200).json({
                contact: {
                    primaryContactId: primaryContacts[0].id,
                    emails: Array.from(emailIds),
                    phoneNumbers: Array.from(phones),
                    secondaryContactIds: Array.from(secondaryIds)
                }
            });
        }

        // Case 2: Where there are 2 primary Contacts for the given email and phoneNumber.
        if (primaryContacts.length === 2) {
            const contactExist = result.some(contact => contact.email === email && contact.phoneNumber === phoneNumber);
            if (!contactExist) {
                const updatedContacts = await updateSecondaryContact(email, phoneNumber, result);
                result = await getAllContacts(email, phoneNumber);
                result.push(...updatedContacts)
            }
            const primaryId = result.filter(contact => contact.linkedId === null);
            const emailIds = new Set(result.map(contact => contact.email));
            const phones = new Set(result.map(contact => contact.phoneNumber));
            const secondaryIds = new Set(result.filter(contact => contact.id !== primaryId[0].id).map(contact => contact.id));

            return res.status(200).json({
                contact: {
                    primaryContactId: primaryId[0].id,
                    emails: Array.from(emailIds),
                    phoneNumbers: Array.from(phones),
                    secondaryContactIds: Array.from(secondaryIds)
                }
            });
        }
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