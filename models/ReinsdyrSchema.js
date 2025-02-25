const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const { v4: uuidv4 } = require('uuid');

const reinsdyrSchema = new Schema({
  serienummer: {
    type: String,
    default: () => uuidv4()
  },
  navn: String,
  fodselsdato: Date,
  flokk: [
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Flokk'
    }
  ],
});

const Reinsdyr = model('Reinsdyr', reinsdyrSchema);

module.exports = Reinsdyr;