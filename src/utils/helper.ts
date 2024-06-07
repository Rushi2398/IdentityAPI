import { PrismaClient } from "@prisma/client";
import { Response } from "express";

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
export const getAllContacts = async (email: string | null | undefined, phoneNumber: string | null | undefined) => {
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
    for (const contact of initialContacts) {
        const otherContacts = await prisma.contact.findMany({
            where: {
                linkedId: contact?.id
            }
        })
        allContacts.push(...otherContacts);
    }
    return allContacts;
}

// Create a new contact when there is no existing combination present with email and phone Number
export const createPrimaryContact = async (email: string | null | undefined, phoneNumber: string | null | undefined) => {
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
const createSecondaryContact = async (email: string | null | undefined, phoneNumber: string | null | undefined, primaryContact: Contact) => {
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
const updateSecondaryContact = async (email: string | null | undefined, phoneNumber: string | null | undefined, allContacts: Contact[]) => {
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

    const updatedContacts = await prisma.contact.findMany({
        where: {
            linkedId: oldContact.id,
            linkPrecedence: "secondary"
        }
    });

    return updatedContacts;
}

export const returnResult = async (email: string | null, phoneNumber: string | null, result: Contact[], res: Response) => {
    const primaryContacts = result.filter(contact => contact.linkedId === null);
    let primaryId = getUniqueContacts(primaryContacts);
    let contactExist = result.some(contact => contact.email === email && contact.phoneNumber === phoneNumber);

    contactExist = email && phoneNumber ? contactExist : true;

    // Case 1: Where there is only one primary Contact for the given email and phoneNumber
    if (!contactExist && primaryId.length === 1) {
        const secondaryContact = await createSecondaryContact(email, phoneNumber, primaryId[0]);
        result.push(secondaryContact);
    }

    // Case 2: Where there are 2 primary Contacts for the given email and phoneNumber.
    if (!contactExist && primaryId.length === 2) {
        const updatedContacts = await updateSecondaryContact(email, phoneNumber, result);
        result = await getAllContacts(email, phoneNumber);
        result.push(...updatedContacts)
    }

    // return the required result in JSON format 
    primaryId = result.filter(contact => contact.linkedId === null);

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

//get Unique Contacts (objects) from the PrimaryContacts: Remove repeated contacts
const getUniqueContacts = (contacts: Contact[]): Contact[] => {
    const uniqueContactsMap = new Map<number, Contact>();

    contacts.forEach(contact => {
        if (!uniqueContactsMap.has(contact.id)) {
            uniqueContactsMap.set(contact.id, contact);
        }
    });

    return Array.from(uniqueContactsMap.values());
}

