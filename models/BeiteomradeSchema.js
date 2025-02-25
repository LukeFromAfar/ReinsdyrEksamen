const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const beiteomraadeSchema = new Schema({
  beiteomraade: String,
  fylker: [String]
});

const Beiteomraade = model('Beiteomraade', beiteomraadeSchema);

module.exports = Beiteomraade;