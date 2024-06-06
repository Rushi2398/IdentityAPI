import express from 'express';
import { handleIdentityReconciliation } from '../controllers/contact';

export const contactRouter = express.Router();

// Controller for Identity Endpoint
contactRouter.post('/identity', handleIdentityReconciliation);