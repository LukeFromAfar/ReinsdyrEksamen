const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const { v4: uuidv4 } = require('uuid');
const Beiteomraade = require('./BeiteomradeSchema');

const flokkSchema = new Schema({
    eier: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Eier'
        }
    ],
    navn: String,
    serieinndeling: {
        type: String,
        default: () => uuidv4()
    },
    buemerkeNavn: String,
    buemerkeBilde: String,
    beiteomraader: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Beiteomraade'
        }
    ],
    
});

const Flokk = model('Flokk', flokkSchema);

module.exports = Flokk;