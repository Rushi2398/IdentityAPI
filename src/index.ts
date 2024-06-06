import express from 'express';
import { config } from 'dotenv';
import { handleIdentityReconciliation } from './controllers/contact';

const app = express();
config();
const PORT = process.env.PORT || 8000;

app.use(express.json());
// Route Handler
app.use('/api', handleIdentityReconciliation);

app.listen(PORT, () => {
    console.log(`Server Started at ${PORT}`);
})