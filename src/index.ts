import express from 'express';
import { config } from 'dotenv';
import { handleIdentityReconciliation } from './controllers/contact';
import path from 'path';

const app = express();
config();
const PORT = process.env.PORT || 8000;

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());
// Route Handler
app.use('/api', handleIdentityReconciliation);

// GET route to render the welcome page
app.get('/', (req, res) => {
    res.render('index');
});

app.listen(PORT, () => {
    console.log(`Server Started at ${PORT}`);
})