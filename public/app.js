// app.js

const bookList = document.getElementById('book-list');
const addBookForm = document.getElementById('add-book-form');
const updateBookForm = document.getElementById('update-book-form');
const deleteBookForm = document.getElementById('delete-book-form');
const token = localStorage.getItem('token');

window.addEventListener('DOMContentLoaded', (event) => {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = 'login.html';  // Redirect to login if no token
    }
});

if (!token) {
    // If no token is found, redirect to the login page
    window.location.href = 'login.html';
}

// Fetch and display books
async function fetchBooks() {
    const response = await fetch('/books');
    const books = await response.json();
    bookList.innerHTML = '';
    books.forEach(book => {
        const li = document.createElement('li');
        li.textContent = `ID: ${book.id}, Title: ${book.title}, Author: ${book.author}`;
        bookList.appendChild(li);
    });
}

function fetchBook() {
    const token = localStorage.getItem('token'); // Get the token from localStorage

    // Making a GET request to the /book route on the server
    fetch('http://localhost:4000/book', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`, // Include the token in the Authorization header
        },
    })
        .then(response => response.json()) // Parse the JSON response
        .then(data => {})
        .catch(error => {
            console.error('Error fetching books:', error); // Handle errors
        });
}

// Add new book
addBookForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const author = document.getElementById('author').value;

    const response = await fetch('/books', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, author }),
    });

    if (response.ok) {
        fetchBooks(); // Refresh the book list
        addBookForm.reset();
    }
});

// Update book
updateBookForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('update-id').value;
    const title = document.getElementById('update-title').value;
    const author = document.getElementById('update-author').value;

    const response = await fetch(`/books/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, author }),
    });

    if (response.ok) {
        fetchBooks(); // Refresh the book list
        updateBookForm.reset();
    }
});

// Delete book
deleteBookForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('delete-id').value;

    const response = await fetch(`/books/${id}`, {
        method: 'DELETE',
    });

    if (response.ok) {
        fetchBooks(); // Refresh the book list
        deleteBookForm.reset();
    }
});

// Initialize
fetchBooks();
fetchBook();
