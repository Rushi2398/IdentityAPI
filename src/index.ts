import express from 'express';
import { config } from 'dotenv';

const app = express();
config();
const PORT = process.env.PORT || 8000;

app.use(express.json());

app.listen(PORT, () => {
    console.log(`Server Started at ${PORT}`)
})