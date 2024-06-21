const { string } = require('mathjs');
const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const resultModelSchema = new Schema({
    model: {
        type: [[Number]], 
        required: true
    },
    lastTrainedAt:{
        type: Date,
        default: Date.now
    },
    name:{
        type: string,
        required: true
    }
});

module.exports = mongoose.model('resultModel', resultModelSchema);