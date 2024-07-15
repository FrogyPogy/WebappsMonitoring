const mongoose = require("mongoose");
const user = require('../models/user');
const jwt = require('jsonwebtoken');
const { json } = require("express");

const maxAge = 1 * 24 * 60 * 60;
const createdToken = (id) => {
    return jwt.sign({ id }, 'AirMind secret key', {
        expiresIn: maxAge
    });
}

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
//Login or Sign in
exports.checkAuth = async (req, res) => {
    try{
        const {email, password} = req.body;
        const auth = await user.login(email, password);
        
        if (auth){
            const token = createdToken(auth._id);
            res.cookie('jwt', token, {httpOnly: true, maxAge: maxAge * 1000});
            res.redirect('/admin');
        }
    }catch(error){
      console.log(error);
      req.flash('error_msg', error.message);
      res.redirect('/signIn');
    }
  };

exports.createUser = async (req, res) => {
    const {name, email, password} = req.body;
    try{
        //check if username or email already exist
        const existUsername = await user.findOne({ username: name });
        const existEmail = await user.findOne({ email: email });
        if(existUsername){
            req.flash('error_msg', 'username already exist');
            return res.redirect('/signUp');
        }
        if(existEmail){
            req.flash('error_msg', 'email already exist');
            return res.redirect('/signUp');
        }

        const users = await user.create({
            username: name,
            email: email,
            password: password
        });
        const token = createdToken(users._id);
        res.cookie('jwt', token, {httpOnly: true, maxAge: maxAge * 1000});
        req.flash('success_msg', 'Account created successfully');
        res.redirect('/admin');
    }catch(error){
        console.log(error);
        if (error.errors && error.errors.password) {
            req.flash('error_msg', error.errors.password.message);
        } else {
            req.flash('error_msg', 'An error occurred. Please try again.');
        }
        res.redirect('/signUp');
    }
};

