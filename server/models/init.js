const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const initSchema = new Schema({
    isInit: {type: Boolean,  default: false, required: true}
});

module.exports = mongoose.model('init',initSchema);