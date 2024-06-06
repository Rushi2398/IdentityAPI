import express from 'express';
import { handleIdentityReconciliation } from '../controllers/contact';

export const contactRouter = express.Router();

contactRouter.post('/identity', handleIdentityReconciliation);