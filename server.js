const express = require('express');

const app = express();

const { PORT = 6000 } = process.env;

app.get('/', (req, res) => res.send('API running'));

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
