const express = require('express');
const connectDB = require('./config/db');

const app = express();

/** connect database */
connectDB();

const { PORT = 6000 } = process.env;

app.use(express.json({ extended: false }));

app.get('/', (req, res) => res.send('API running'));

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
