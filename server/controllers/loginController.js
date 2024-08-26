const mongoose = require("mongoose");
const user = require('../models/user');
const jwt = require('jsonwebtoken');
const { json } = require("express");

const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');

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

//destroy jwt cookies
exports.signOut = (req, res) => {
    res.cookie('jwt', '', { maxAge: 1 });
    res.redirect('/');
};

exports.forgotPasswordPage = async (req, res) => {
    try{
        const locals = {
            title:'Forget Password - AIRMIND',
            description:'Air Pollution Monitoring and Prediction System'
        }
        res.render('forgotPassword', locals);

    }catch(error){
        res.status(500).json({ message: 'Error load Page', error });
    }

}

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const users = await user.findOne({ email });
  
        if (!users) {
            return res.status(400).json({ message: 'Email not found' });
        }
  
        // Generate token
        const token = crypto.randomBytes(20).toString('hex');
        users.resetPasswordToken = token;
        users.resetPasswordExpires = Date.now() + 3600000; // 1 hour expiration
  
        await users.save();
  
        // Create transport and send email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.email_transporter,
                pass: process.env.app_password
            }
        });
  
        const mailOptions = {
            to: users.email,
            from: process.env.email_transporter,
            subject: 'Password Reset',
            text: `You are receiving this because you have requested to reset your password.\n\n
            Please click on the following link, or paste this into your browser to complete the process:\n\n
            http://${req.headers.host}/reset-password/${token}\n\n
            If you did not request this, please ignore this email and your password will remain unchanged.\n`
        };
  
        await transporter.sendMail(mailOptions);
  
        res.status(200).json({ message: 'Password reset email sent' });
  
    } catch (error) {
        res.status(500).json({ message: 'Error in sending email', error });
    }
  };

  exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const users = await user.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() } // Token must not be expired
        });

        if (!users) {
            return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Save the new password
        users.password = hashedPassword;
        users.resetPasswordToken = undefined;
        users.resetPasswordExpires = undefined;

        await users.save();

        res.status(200).json({ message: 'Password has been updated' });

    } catch (error) {
        res.status(500).json({ message: 'Error in resetting password', error });
    }
};