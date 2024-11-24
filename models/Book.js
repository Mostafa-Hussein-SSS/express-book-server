const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Define the Book model
const Book = sequelize.define('Book', {
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    author: {
        type: DataTypes.STRING,
        allowNull: false,
    },
});

// Synchronize the model with the database (create table if not exists)
Book.sync();

module.exports = Book;
