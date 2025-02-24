const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const sprakSchema = new Schema({
    navn: String,   
    sprakkode: Number,
});

const Sprak = model('Sprak', sprakSchema);

module.exports = Sprak;