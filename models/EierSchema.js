const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const eierSchema = new Schema({
  navn: String,
  epost: String,
  passord: String,
  kontaktsprak: String,
  telefonnummer: Number
});

const Eier = model('Eier', eierSchema);

module.exports = Eier;