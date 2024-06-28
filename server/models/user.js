const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const userSchema = new Schema({
    username:{
        type: String,
        required: true,
        unique: true
    },
    password:{
        type: String,
        required: true,
    },
    roles:{
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('user',userSchema);