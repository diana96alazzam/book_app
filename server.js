'use strict';

require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const methodoverride = require('method-override');

const app = express();
const PORT = process.env.PORT || 4000;

const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', (error) => console.log(error));


app.use(express.urlencoded({ extended: true }));
app.use(methodoverride('_method'));
app.use('/public', express.static('public'));

app.set('view engine', 'ejs');

app.get('/', gettingSavedBooks);
app.get('/searches/new', newSearch);
app.post('/searches', postSearchResult);
app.get('/books/:id', getBookDetails);
app.post('/books', addBooks);
app.put('/books/:id', updateBook)
app.delete('/books/:id', deleteBook);

app.use('*', notFound);


function gettingSavedBooks(request, response) {
    const SQL = 'SELECT * FROM books;'
    return client.query(SQL).then((savedBooks) => response.render('pages/index', { books: savedBooks.rows }))
}

function newSearch(request, response) {
    return response.render('pages/searches/new');
}

function postSearchResult(request, response) {
    let searchKeyword = request.body.searched;
    let filterApplied = request.body.searchFilter;


    let bookAPIurl = `https://www.googleapis.com/books/v1/volumes?q=${searchKeyword}+in${filterApplied}`

    return superagent.get(bookAPIurl).then((apiRes) => {

        let bookData = apiRes.body.items;

        let book = bookData.map(item => {
            return new Book(item.volumeInfo);
        })

        // console.log('after api', book);

        response.render('pages/searches/show', { book: book });

    }).catch((err) => errorHandler(err, request, response))

}

function getBookDetails(request, response) {
    const SQL = 'SELECT * FROM books WHERE id=$1;'
    const values = [request.params.id];
    return client.query(SQL, values).then((bookDetails) => {
        response.render('pages/books/detail', { book: bookDetails.rows[0] });
    }).catch((error) => {
        errorHandler(error, request, response);
    });
}


function addBooks(request, response) {
    //replace search title with isbn

    const sqlSearch = 'SELECT (title, author, image_url, description, isbn) FROM books WHERE $1=title AND $2=author AND $3=image_url AND $4=description AND $5=isbn;'
    const searchVal = [request.body.bookTitle, request.body.bookAuthor, request.body.bookImage, request.body.bookDescription, request.body.bookISBN];
    client.query(sqlSearch, searchVal).then((searchedResult)=> {
        if(searchedResult.rows.length > 0){
            response.render('pages/books/show', {book : searchVal});
        }else{
            const SQL = 'INSERT INTO books (title, author, image_url, description, isbn) VALUES ($1,$2,$3, $4, $5);'
            const values = [request.body.bookTitle, request.body.bookAuthor, request.body.bookImage, request.body.bookDescription, request.body.bookISBN];
            client.query(SQL, values).then((addedBook) => {
                console.log('hi', request.body.id)
                response.render('pages/books/show', {book: values});
            }).catch((err) => {
                errorHandler(err, request, response);
            });
        }
    })

}


function updateBook (request, response){
    console.log('hey', request.body);
    const updateSQL = 'UPDATE books SET title=$1, author=$2, image_url=$3, description=$4, isbn=$5 WHERE id=$6 ';
    const updatedValues = [request.body.bookTitle, request.body.bookAuthor, request.body.bookImage, request.body.bookDescription, request.body.bookISBN, request.params.id];
    client.query(updateSQL, updatedValues).then((updateResult)=>{
        response.redirect(`/books/${request.params.id}`)
    }).catch((err)=> errorHandler(err, request, response));
}

function deleteBook (request, response) {
    const deleteSQL = 'DELETE FROM books WHERE id=$1';
    const deleteVal = [request.params.id];
    client.query(deleteSQL, deleteVal).then((deleteResults)=> {
        response.redirect('/');
    }).catch((err)=> errorHandler(err, request, response));
}




function notFound (request, response){
    return response.status(404).send('Page not found');
}


client.connect().then(() => {
    app.listen(PORT, () => console.log(`The server is running on port ${PORT}`));
});


function Book(bookData) {
    this.title = (bookData.title) ? bookData.title : 'Unknown Book Title';
    this.author = (bookData.authors) ? bookData.authors : 'Unknown Book Authors';
    this.description = (bookData.description) ? bookData.description : 'Description not available';
    this.imageThum = (bookData.imageLinks.thumbnail) ? bookData.imageLinks.thumbnail : 'https://i7.uihere.com/icons/829/139/596/thumbnail-caefd2ba7467a68807121ca84628f1eb.png';
    this.isbn = (bookData.industryIdentifiers[0].identifier);
}

//helpers
function errorHandler(err, request, response) {
    response.status(500).render('pages/error', { error: err });
}
