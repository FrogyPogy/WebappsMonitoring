const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const resultPredictionSchema = new Schema({
    id: Schema.Types.ObjectId,
    jenis: {type: String},
    value:{
        co:{type: Number, required: true},
        pm25:{type: Number, required: true}
    },
    createdAt: {//diisi dengan tanggal dari dataset input
        type: Date, 
        default: Date.now
    } 
});

module.exports = mongoose.model('resultPrediction',resultPredictionSchema);