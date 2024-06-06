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
exports.handleIdentityReconciliation = void 0;
const validation_1 = require("../utils/validation");
const zod_1 = require("zod");
const helper_1 = require("../utils/helper");
const handleIdentityReconciliation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, phoneNumber } = validation_1.validationSchema.parse(req.body);
        // function to get all primary and secondary contacts from Database
        const result = yield (0, helper_1.getAllContacts)(email, phoneNumber);
        if (!result.length) {
            // function to create new Contact and save it in database
            if (email && phoneNumber) {
                const newContact = yield (0, helper_1.createPrimaryContact)(email, phoneNumber);
                return res.status(200).json({
                    contact: {
                        primaryContactId: newContact.id,
                        emails: [newContact.email],
                        phoneNumbers: [newContact.phoneNumber],
                        secondaryContactIds: []
                    }
                });
            }
            else {
                return res.status(400).json({
                    msg: "Contact doesn't exist and user has to provide both email and phoneNumber"
                });
            }
        }
        // get all the primary contacts retrieved from the database.
        const primaryContacts = result.filter(contact => contact.linkedId === null);
        if (primaryContacts.length === 1) {
            const secondaryContact = yield (0, helper_1.createSecondaryContact)(email, phoneNumber, primaryContacts[0]);
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
            });
        }
        if (primaryContacts.length === 2) {
            yield (0, helper_1.updateSecondaryContact)(email, phoneNumber, result);
        }
    }
    catch (e) {
        if (e instanceof zod_1.z.ZodError)
            return res.status(400).json({
                message: e.errors
            });
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
});
exports.handleIdentityReconciliation = handleIdentityReconciliation;
