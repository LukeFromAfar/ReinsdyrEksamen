const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const reinsdyrSchema = new Schema({
  serienummer: Number,
  navn: String,
  fodselsdato: Date,
  flokk: [
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Flokk'
    }
  ]
});

const Reinsdyr = model('Reinsdyr', reinsdyrSchema);

module.exports = Reinsdyr;