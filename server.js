const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB Atlas
mongoose.connect('mongodb+srv://JACKI:SCRAM@cluster0.jnaox.mongodb.net/booksdb?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

// Book Schema
const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  status: { type: String, enum: ['read', 'unread'], default: 'unread' },
  reviews: [{
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, required: true }
  }]
});

const Book = mongoose.model('Book', bookSchema);

// GET all books
app.get('/books', async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET a single book by ID
app.get('/books/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST a new book
app.post('/books', async (req, res) => {
  const { title, author } = req.body;
  if (!title || !author) return res.status(400).json({ error: 'Title and author are required' });
  try {
    const newBook = new Book({ title, author });
    await newBook.save();
    res.status(201).json(newBook);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT to update a book's status
app.put('/books/:id', async (req, res) => {
  const { status } = req.body;
  if (status !== 'read' && status !== 'unread') return res.status(400).json({ error: "Status must be 'read' or 'unread'" });
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    book.status = status;
    await book.save();
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE a book
app.delete('/books/:id', async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST a review for a book
app.post('/books/:id/reviews', async (req, res) => {
  const { rating, comment } = req.body;
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
  if (!comment || typeof comment !== 'string') return res.status(400).json({ error: 'Comment must be a non-empty string' });
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    book.reviews.push({ rating, comment });
    await book.save();
    res.status(201).json({ rating, comment });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});