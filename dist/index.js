"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = require("dotenv");
const contact_1 = require("./controllers/contact");
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
(0, dotenv_1.config)();
const PORT = process.env.PORT || 8000;
// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path_1.default.join(__dirname, 'views'));
// Serve static files from the public directory
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
app.use(express_1.default.json());
// Route Handler
app.use('/api', contact_1.handleIdentityReconciliation);
// GET route to render the welcome page
app.get('/', (req, res) => {
    res.render('index');
});
app.listen(PORT, () => {
    console.log(`Server Started at ${PORT}`);
});
