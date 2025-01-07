const mongoose = require('mongoose');

const riddleSchema = new mongoose.Schema({
    question: { type: String, unique: true },
    answer: String, // Track if the riddle was used
});

const Riddle = mongoose.model('Riddle', riddleSchema);
module.exports = { Riddle };