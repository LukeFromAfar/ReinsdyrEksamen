const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const EierSchema = new Schema({
  navn: String,
  epost: String,
  passord: String,
  kontaktspråk: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Språk'
    }
  ],
});

const Eier = model('Eier', EierSchema);

module.exports = Eier;