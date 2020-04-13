'use strict';

require('dotenv').config();
const express = require('express');
const superagent = require('superagent');

const app = express();
const PORT = process.env.PORT || 4000;

const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', (error) => console.log(error));

app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static('public'));

app.set('view engine', 'ejs');

app.get('/', gettingSavedBooks);

function gettingSavedBooks (request, response){
        const SQL = 'SELECT * FROM books;'
        return client.query(SQL).then((savedBooks) => response.render('pages/index', {books: savedBooks.rows}))
}

app.get('/hello', (request, response) => {
    response.render('pages/index');
});

app.get('/searches/new', (request, response) => {
    response.render('pages/searches/new');
});

app.post('/searches', (request, response) => {
       
    let searchKeyword = request.body.searched;
    let filterApplied = request.body.searchFilter;
    
  
    let bookAPIurl = `https://www.googleapis.com/books/v1/volumes?q=${searchKeyword}+in${filterApplied}`

    superagent.get(bookAPIurl).then((apiRes) => {
       
        let bookData = apiRes.body.items;
             
        let book = bookData.map(item => {
            return new Book(item.volumeInfo);
        })
        
        // console.log('after api', book);

        response.render('pages/searches/show', { book: book });

    }).catch((err) => errorHandler(err, request, response))

});

app.get('/books/:id', (request, response) => {
    const SQL = 'SELECT * FROM books WHERE id=$1;'
    const values = [request.params.id];
    client.query(SQL, values).then((bookDetails) => {
        response.render('pages/books/detail', {book: bookDetails.rows[0]});
    }).catch((error) => {
        errorHandler(error, request, response);
    });

})

app.post('/books', (request, response)=> {
    //replace search title with isbn
    const sqlSearch = 'SELECT title FROM books WHERE isbn=$1;'
    const searchVal = [request.body.bookISBN];
    client.query(sqlSearch, searchVal).then((searchedResult)=> {
        if(searchedResult.rows.length > 0){
            response.redirect('/');
        }else{
            const SQL = 'INSERT INTO books (title, author, image_url, description, isbn) VALUES ($1,$2,$3, $4, $5);'
            const values = [request.body.bookTitle, request.body.bookAuthor, request.body.bookImage, request.body.bookDescription, request.body.bookISBN];
            client.query(SQL, values).then((addedBook)=> {
                response.render('pages/books/show', {book : values});
            }).catch((err) => {
                errorHandler(err, request, response);
              });
        }
    })
})




app.use('*', (request, response) => {
    response.status(404).send('Page not found');
});


client.connect().then(() => {
    app.listen(PORT, () => console.log(`The server is running on port ${PORT}`));
});
  

function Book(bookData) {
    this.title = (bookData.title)? bookData.title : 'Unknown Book Title';
    this.author = (bookData.authors)? bookData.authors : 'Unknown Book Authors';
    this.description = (bookData.description)? bookData.description : 'Description not available';
    this.imageThum = (bookData.imageLinks.thumbnail)? bookData.imageLinks.thumbnail : 'https://i7.uihere.com/icons/829/139/596/thumbnail-caefd2ba7467a68807121ca84628f1eb.png';
    this.isbn = (bookData.industryIdentifiers[0].identifier);
}

//helpers
function errorHandler(err, request, response) {
    response.status(500).render('pages/error', { error: err });
}
