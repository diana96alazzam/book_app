'use strict';

require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const PORT = process.env.PORT || 4000;

const app = express();
app.use(express.static('./public/styles'))

app.set('view engine', 'ejs');


app.get('/hello', (request, response) => {
    response.render('pages/index');
});

app.use(express.urlencoded({ extended: true }));


app.get('/searches/new', (request, response) => {
    response.render('pages/searches/new');
});

app.post('/searches', (request, response) => {
       
    let searchKeyword = request.body.searched;
    let filterApplied = request.body.searchFilter;
    
    // console.log(searchKeyword, filterApplied);

    // if I want to search by title change the q to intitle
    // if I want to search by author change the q to inauthor
    let bookAPIurl = `https://www.googleapis.com/books/v1/volumes?q=${searchKeyword}+in${filterApplied}`

    superagent.get(bookAPIurl).then((apiRes) => {
       
        let bookData = apiRes.body.items;
             
        let book = bookData.map(item => {
            return new Book(item.volumeInfo);
        })
        
        // console.log('after api', book);

        response.render('pages/searches/show', { book: book });

    }).catch((err) => errorHandler(err, request, response))

})


app.use('*', (request, response) => {
    response.status(404).send('Page not found');
});

app.listen(PORT, () => console.log(`The server is running on port ${PORT}`));

function Book(bookData) {
    this.title = (bookData.title)? bookData.title : 'Unknown Book Title';
    this.author = (bookData.authors)? bookData.authors : 'Unknown Book Authors';
    this.description = (bookData.description)? bookData.description : 'Description not available';
    this.imageThum = (bookData.imageLinks.thumbnail)? bookData.imageLinks.thumbnail : 'https://i7.uihere.com/icons/829/139/596/thumbnail-caefd2ba7467a68807121ca84628f1eb.png';
}
//turnery
// isMember ? '$2.00' : '$10.00')

//helpers
function errorHandler(error, request, response) {
    response.status(500).send(error);
}
