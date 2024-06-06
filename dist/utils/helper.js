"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSecondaryContact = exports.createSecondaryContact = exports.createPrimaryContact = exports.getAllContacts = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getAllContacts = (email, phoneNumber) => __awaiter(void 0, void 0, void 0, function* () {
    const initialContacts = yield prisma.contact.findMany({
        where: {
            OR: [
                { email },
                { phoneNumber }
            ]
        }
    });
    if (!initialContacts)
        return [];
    const allContacts = [];
    const uniqueLinkIds = new Set();
    initialContacts.forEach(contact => {
        allContacts.push(contact);
        if (contact.linkedId)
            uniqueLinkIds.add(contact.linkedId);
    });
    for (const linkedId of uniqueLinkIds) {
        let contact = yield prisma.contact.findUnique({
            where: {
                id: linkedId
            }
        });
        if (!allContacts.includes(contact)) {
            while (contact) {
                allContacts.push(contact);
                if (contact.linkedId === null)
                    break;
                contact = yield prisma.contact.findUnique({
                    where: { id: contact.linkedId }
                });
            }
        }
    }
    return allContacts;
});
exports.getAllContacts = getAllContacts;
const createPrimaryContact = (email, phoneNumber) => __awaiter(void 0, void 0, void 0, function* () {
    const newContact = yield prisma.contact.create({
        data: {
            email,
            phoneNumber,
            linkPrecedence: "primary",
        }
    });
    return newContact;
});
exports.createPrimaryContact = createPrimaryContact;
const createSecondaryContact = (email, phoneNumber, primaryContact) => __awaiter(void 0, void 0, void 0, function* () {
    const newSecondaryContact = yield prisma.contact.create({
        data: {
            email: email !== null && email !== void 0 ? email : primaryContact.email,
            phoneNumber: phoneNumber !== null && phoneNumber !== void 0 ? phoneNumber : primaryContact.phoneNumber,
            linkPrecedence: "secondary",
            linkedContact: {
                connect: {
                    id: primaryContact.id
                }
            }
        }
    });
    return newSecondaryContact;
});
exports.createSecondaryContact = createSecondaryContact;
const updateSecondaryContact = (email, phoneNumber, allContacts) => __awaiter(void 0, void 0, void 0, function* () {
    const primaryContacts = allContacts.filter(contact => contact.linkedId === null);
    let oldContact, newContact;
    if (primaryContacts[0].updatedAt < primaryContacts[1].updatedAt) {
        oldContact = primaryContacts[0];
        newContact = primaryContacts[1];
    }
    else {
        oldContact = primaryContacts[1];
        newContact = primaryContacts[0];
    }
    yield prisma.contact.updateMany({
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
});
exports.updateSecondaryContact = updateSecondaryContact;
