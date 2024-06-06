import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Contact = {
    id: number | null;
    phoneNumber: string | null;
    email: string | null;
    linkedId: number | null;
    linkPrecedence: 'primary' | 'secondary';
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
};

export const getAllContacts = async (email: string | undefined, phoneNumber: string | undefined) => {
    const allContacts: Contact[] = [];
    return allContacts;
}

export const createContact = async (email: string, phoneNumber: string) => {
    let newContact: Contact;
}