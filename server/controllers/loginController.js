const mongoose = require("mongoose");
const user = require('../models/user');

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