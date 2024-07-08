const mongoose = require("mongoose");
const user = require('../models/user');
const jwt = require('jsonwebtoken');


exports.signInPage = async(req, res) => {
    const locals = {
        title:'Sign In - AIRMIND',
        description:'Air Pollution Monitoring and Prediction System'
    }
    res.render('signIn', locals);
};

exports.signUpPage = async(req, res) => {
    const locals = {
        title: 'Sign Up - AIRMIND',
        description: 'Air Pollution Monitoring and Prediction System'
    }
    res.render('signUp', locals);
}

exports.checkAuth = async (req, res) => {
    try{
        const {username, password} = req.body;
        if(req.body.username === 'admin' && req.body.password === 'password'){
            res.send('You are logged in as Admin.');
            res.redirect('/admin'); //redirect To Admin
        }else{
            res.send('incorrect username or password!');
        }
        
    }catch(error){
      console.log(error);
    }
  };
const maxAge = 1 * 24 * 60 * 60;
const createdToken = (id) => {
    return jwt.sign({ id }, 'AirMind secret key', {
        expiresIn: maxAge
    });
}

exports.createUser = async (req, res) => {
    const {name, email, password} = req.body;
    try{
        const users = await user.create({
            username: name,
            email: email,
            password: password
        });
        const token = createdToken(users._id);
        res.cookie('jwt', token, {httpOnly: true, maxAge: maxAge * 1000});
        res.status(201).send('Account created successfully');
    }catch(error){
        console.log(error);
    }
};

