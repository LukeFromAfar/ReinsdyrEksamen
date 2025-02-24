const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const elokkSchema = new Schema({
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

const Flokk = model('Flokk', flokkSchema);

module.exports = Flokk;