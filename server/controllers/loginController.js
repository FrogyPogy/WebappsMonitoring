const mongoose = require("mongoose");
const user = require('../models/user');

exports.signInPage = async(req, res) => {
    const locals = {
        title:'SignIn - AIRMIND',
        description:'Air Pollution Monitoring and Prediction System'
    }
    res.render('signIn', locals);
};

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