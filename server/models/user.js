const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); 
const { isEmail } = require('validator');

const Schema = mongoose.Schema;
const userSchema = new Schema({
    username:{
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true, 
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
//membuat statics method dengan nama login
userSchema.statics.login = async function(email, password){
    const user = await this.findOne({email});
    if(user){
        const auth = await bcrypt.compare(password, user.password);
        if(auth){
            return user;
        }
        throw Error('incorrect password');
    }
    throw Error('incorrect Email');
}

module.exports = mongoose.model('user',userSchema);