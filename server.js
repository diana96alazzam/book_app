require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const PORT = process.env.PORT || 4000;

const app = express();

app.get('/', (request, response) => {
    response.status(200).send('test main page');
});

app.use('*', (request, response) => {
    response.status(404).send('Page not found');
});

app.listen(PORT, () => console.log(`The server is running on port ${PORT}`));
