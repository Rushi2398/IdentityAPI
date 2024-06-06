import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

type Contact = {
    id: number;
    phoneNumber: string | null;
    email: string | null;
    linkedId: number | null;
    linkPrecedence: 'primary' | 'secondary';
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
};

// get All Primary and Secondary Contacts for given email and phoneNumber
export const getAllContacts = async (email: string | undefined, phoneNumber: string | undefined) => {
    const initialContacts = await prisma.contact.findMany({
        where: {
            OR: [
                { email },
                { phoneNumber }
            ]
        }
    });
    // return empty array if no entry found in the database.
    if (!initialContacts) return [];

    const allContacts: Contact[] = [];
    const uniqueLinkIds = new Set<number>();

    initialContacts.forEach(contact => {
        allContacts.push(contact);
        if (contact.linkedId) uniqueLinkIds.add(contact.linkedId);
    });

    // for all the initialContacts, find all the secondary and primary contacts
    for (const linkedId of uniqueLinkIds) {
        let contact = await prisma.contact.findUnique({
            where: {
                id: linkedId!
            }
        });

        if (!allContacts.includes(contact!)) {
            while (contact) {

                allContacts.push(contact);
                if (contact.linkedId === null) break;

                contact = await prisma.contact.findUnique({
                    where: { id: contact.linkedId }
                });
            }
        }
    }
    return allContacts;
}

// Create a new contact when there is no existing combination present with email and phone Number
export const createPrimaryContact = async (email: string, phoneNumber: string) => {
    const newContact = await prisma.contact.create({
        data: {
            email,
            phoneNumber,
            linkPrecedence: "primary",
        }
    });

    return newContact;
}

// Create a secondary contact since the email or phoneNumber is already present with a primary contact
export const createSecondaryContact = async (email: string | undefined, phoneNumber: string | undefined, primaryContact: Contact) => {
    const newSecondaryContact = await prisma.contact.create({
        data: {
            email: email ?? primaryContact.email,
            phoneNumber: phoneNumber ?? primaryContact.phoneNumber,
            linkPrecedence: "secondary",
            linkedContact: {
                connect: {
                    id: primaryContact.id!
                }
            }
        }
    });

    return newSecondaryContact;
}

// Update all the contacts whose primary Id is converted to Secondary Id
export const updateSecondaryContact = async (email: string | undefined, phoneNumber: string | undefined, allContacts: Contact[]) => {
    const primaryContacts = allContacts.filter(contact => contact.linkedId === null);
    let oldContact, newContact;

    if (primaryContacts[0].updatedAt < primaryContacts[1].updatedAt) {
        oldContact = primaryContacts[0]!;
        newContact = primaryContacts[1]!;
    } else {
        oldContact = primaryContacts[1]!;
        newContact = primaryContacts[0]!;
    }

    await prisma.contact.updateMany({
        where: {
            OR: [
                { id: newContact.id },
                { linkedId: newContact.id }
            ]
        },
        data: {
            linkPrecedence: "secondary",
            linkedId: oldContact.id
        }
    });
}

// return the result back to caller
export const returnResult = (result: Contact[]) => {
    return (req: Request, res: Response) => {
        const primaryId = result.filter(contact => contact.linkedId === null);
        const emailIds = new Set([result.map(contact => contact.email)]);
        const phones = new Set([result.map(contact => contact.phoneNumber)]);
        const secondaryIds = new Set([result.map(contact => contact.linkedId).filter(Boolean)]);

        return res.status(200).json({
            contact: {
                primaryContactId: primaryId[0].id,
                emails: Array.from(emailIds),
                phoneNumbers: Array.from(phones),
                secondaryContactIds: Array.from(secondaryIds)
            }
        });
    }
}