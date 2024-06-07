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
exports.returnResult = exports.createPrimaryContact = exports.getAllContacts = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// get All Primary and Secondary Contacts for given email and phoneNumber
const getAllContacts = (email, phoneNumber) => __awaiter(void 0, void 0, void 0, function* () {
    const initialContacts = yield prisma.contact.findMany({
        where: {
            OR: [
                { email },
                { phoneNumber }
            ]
        }
    });
    // return empty array if no entry found in the database.
    if (!initialContacts)
        return [];
    const allContacts = [];
    const uniqueLinkIds = new Set();
    initialContacts.forEach(contact => {
        allContacts.push(contact);
        if (contact.linkedId)
            uniqueLinkIds.add(contact.linkedId);
    });
    // for all the initialContacts, find all the secondary and primary contacts
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
    for (const contact of initialContacts) {
        const otherContacts = yield prisma.contact.findMany({
            where: {
                linkedId: contact === null || contact === void 0 ? void 0 : contact.id
            }
        });
        allContacts.push(...otherContacts);
    }
    return allContacts;
});
exports.getAllContacts = getAllContacts;
// Create a new contact when there is no existing combination present with email and phone Number
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
// Create a secondary contact since the email or phoneNumber is already present with a primary contact
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
// Update all the contacts whose primary Id is converted to Secondary Id
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
    const updatedContacts = yield prisma.contact.findMany({
        where: {
            linkedId: oldContact.id,
            linkPrecedence: "secondary"
        }
    });
    return updatedContacts;
});
const returnResult = (email, phoneNumber, result, res) => __awaiter(void 0, void 0, void 0, function* () {
    const primaryContacts = result.filter(contact => contact.linkedId === null);
    let primaryId = getUniqueContacts(primaryContacts);
    let contactExist = result.some(contact => contact.email === email && contact.phoneNumber === phoneNumber);
    contactExist = email && phoneNumber ? contactExist : true;
    // Case 1: Where there is only one primary Contact for the given email and phoneNumber
    if (!contactExist && primaryId.length === 1) {
        const secondaryContact = yield createSecondaryContact(email, phoneNumber, primaryId[0]);
        result.push(secondaryContact);
    }
    // Case 2: Where there are 2 primary Contacts for the given email and phoneNumber.
    if (!contactExist && primaryId.length === 2) {
        const updatedContacts = yield updateSecondaryContact(email, phoneNumber, result);
        result = yield (0, exports.getAllContacts)(email, phoneNumber);
        result.push(...updatedContacts);
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
});
exports.returnResult = returnResult;
//get Unique Contacts (objects) from the PrimaryContacts: Remove repeated contacts
const getUniqueContacts = (contacts) => {
    const uniqueContactsMap = new Map();
    contacts.forEach(contact => {
        if (!uniqueContactsMap.has(contact.id)) {
            uniqueContactsMap.set(contact.id, contact);
        }
    });
    return Array.from(uniqueContactsMap.values());
};
