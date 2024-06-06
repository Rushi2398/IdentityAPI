import { PrismaClient } from "@prisma/client";

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

export const getAllContacts = async (email: string | undefined, phoneNumber: string | undefined) => {
    const initialContacts = await prisma.contact.findMany({
        where: {
            OR: [
                { email },
                { phoneNumber }
            ]
        }
    });

    if (!initialContacts) return [];

    const allContacts: Contact[] = [];
    const uniqueLinkIds = new Set<number>();

    initialContacts.forEach(contact => {
        allContacts.push(contact);
        if (contact.linkedId) uniqueLinkIds.add(contact.linkedId);
    });

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