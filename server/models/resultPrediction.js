const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const resultPredictionSchema = new Schema({
    id: Schema.Types.ObjectId,
    jenis: {type: String},
    value: {type: Number, required: true},
    createdAt: {
        type: Date, 
        default: Date.now
    } 
});

module.exports = mongoose.model('resultPrediction',resultPredictionSchema);