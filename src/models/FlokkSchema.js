const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const FlokkSchema = new Schema({
    navn: String,
    eier: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Eier'
        }
    ],
    serieinndeling: String,
    buemerkeNavn: String,
    buemerkeBilde: String

});

const Flokk = model('Flokk', FlokkSchema);

module.exports = Flokk;