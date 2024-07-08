const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); 
const { isEmail } = require('validator');

const Schema = mongoose.Schema;
const userSchema = new Schema({
    username:{
        type: String,
        required: true,
        unique: [true, 'username has been used']
    },
    email: {
        type: String,
        required: true,
        unique: [true, 'email has been used'], 
        lowercase: true,
        validate: [isEmail, 'Please enter a valid email']
    },
    password:{
        type: String,
        required: true,
        minLength: [8, 'minimum password length is 8 character']
    }
});

//use presave hook
userSchema.pre('save', async function(next){
    try{
        const salt = await bcrypt.genSalt();
        this.password = await bcrypt.hash(this.password, salt);
        next();
    }catch(error){
        console.log(error);
    }
});

module.exports = mongoose.model('user',userSchema);