'use strict';

require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const PORT = process.env.PORT || 4000;

const app = express();
app.use(express.static('./public/styles'))

app.set('view engine', 'ejs');


app.get('/hello', (request, response) => {
    response.render('pages/index' );
});

app.get('/searches/new', (request, response) => {
    response.render('pages/searches/new' );
});


app.use('*', (request, response) => {
    response.status(404).send('Page not found');
});

app.listen(PORT, () => console.log(`The server is running on port ${PORT}`));
