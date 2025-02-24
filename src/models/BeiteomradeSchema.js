const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const beiteomradeSchema = new Schema({
  sprak: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sprak'
    }
  ],
  fylker: [String]
});

const Beiteomrade = model('Beiteomrade', beiteomradeSchema);

module.exports = Beiteomrade;