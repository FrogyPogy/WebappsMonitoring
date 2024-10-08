const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const datasetSchema = new Schema({
    value:{
        co:{type: Number, required: true},
        pm25:{type: Number, required: true},
        temperature:{ type: Number, required: true},
        humidity:{type: Number, required: true},
        windSpeed:{type: Number, required: true}
    },
    timestamp:{type: Date, required: true},
    hours: {type: Number, required: true}
});

module.exports = mongoose.model('dataset',datasetSchema);