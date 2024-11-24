const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { body, validationResult } = require('express-validator');
const Sequelize = require('sequelize'); // Import Sequelize
const Book = require('./models/Book'); // Import Sequelize Book model
const protect = require('./middleware/auth');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User'); // Assuming you have a User model

dotenv.config();
const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files from 'public' folder

// Routes

// Register Route
app.post(
    '/register',
    [
        body('username').notEmpty().withMessage('Username is required'),
        body('email').isEmail().withMessage('Invalid email format'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, password } = req.body;

        try {
            // Check if the email already exists
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(400).json({ error: 'Email already in use' });
            }

            // Create a new user
            const newUser = await User.create({
                username,
                email,
                password,
            });

            // Generate JWT token
            const token = jwt.sign({ id: newUser.id, email: newUser.email }, process.env.JWT_SECRET, {
                expiresIn: '1h', // Token expires in 1 hour
            });

            res.status(201).json({ token }); // Send back the token
        } catch (err) {
            res.status(500).json({ error: 'Registration failed' });
        }
    }
);

// Login Route
app.post('/login', async (req, res) => {

    console.log('Login Request Received:');

    const { email, password } = req.body; // Extract email and password

    try {
        // Find the user by email
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        // Compare the entered password with the stored hashed password


        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
            expiresIn: '1h', // Token expires in 1 hour
        });

        res.json({ token });

    } catch (err) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Protect the root directory and any other routes
app.get('/', protect, (req, res) => {
    res.send('Welcome to the protected root page!');
});

// GET /book - Fetch a single book (assuming this is for a specific use case, e.g., fetching the first book)
app.get('/book', async (req, res) => {
    try {
        const book = await Book.findAll(); // Retrieve one book, you can customize this logic
        if (!book) {
            return res.status(404).json({ error: 'No book found' });
        }
        res.json(book);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve the book' });
    }
});

// GET /books - Retrieve all books
app.get('/books', protect, async (req, res) => {

    try {

        // Extract query parameters
        const { page = 1, limit = 10, sortBy = 'title', order = 'ASC', title, author } = req.query;

        // Calculate offset for pagination
        const offset = (page - 1) * limit;

        // Create a where clause for filtering
        const where = {};
        if (title) where.title = { [Sequelize.Op.like]: `%${title}%` }; // Partial match on title
        if (author) where.author = { [Sequelize.Op.like]: `%${author}%` }; // Partial match on author

        // Fetch books from the database
        const books = await Book.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [[sortBy, order.toUpperCase()]], // Sorting
        });

        // Respond with paginated and filtered data
        res.json({
            total: books.count,
            page: parseInt(page),
            pages: Math.ceil(books.count / limit),
            data: books.rows,
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve books' });
    }
});

// GET /books/:id - Retrieve a specific book by ID
app.get('/books/:id', protect, async (req, res) => {
    try {
        const book = await Book.findByPk(req.params.id);
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }
        res.json(book);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve the book' });
    }
});

// POST /books - Create a new book
app.post(
    '/books',
    [
        body('title').notEmpty().withMessage('Title is required'),
        body('author').notEmpty().withMessage('Author is required'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const newBook = await Book.create({
                title: req.body.title,
                author: req.body.author,
            });
            res.status(201).json(newBook);
        } catch (err) {
            res.status(500).json({ error: 'Failed to create a book' });
        }
    }
);

// PUT /books/:id - Update an existing book by ID
app.put(
    '/books/:id',
    [
        body('title').notEmpty().withMessage('Title is required'),
        body('author').notEmpty().withMessage('Author is required'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const book = await Book.findByPk(req.params.id);
            if (!book) {
                return res.status(404).json({ error: 'Book not found' });
            }

            book.title = req.body.title;
            book.author = req.body.author;
            await book.save();

            res.json(book);
        } catch (err) {
            res.status(500).json({ error: 'Failed to update the book' });
        }
    }
);

// DELETE /books/:id - Delete a book by ID
app.delete('/books/:id', async (req, res) => {
    try {
        const book = await Book.findByPk(req.params.id);
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }

        await book.destroy();
        res.json({ message: 'Book deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete the book' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
