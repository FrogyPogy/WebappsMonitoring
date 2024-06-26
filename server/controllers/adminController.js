const mongoose = require("mongoose");
const user = require('../models/user');

exports.dashboard = async(req, res) => {  //Menerapkan langsung fungsi ke objek exports
    try{
        const locals = {
            title: 'AIRMIND',
            description:'Air Pollution Monitoring and Prediction System'
        };
        res.render('dashboard', locals); //rendering admin dashboarad in views
    }catch (error){
        console.error('Terjadi kesalahan saat memuat halaman utama:', error);
        res.status(500).render('error',{message:'Terjadi kesalahan saat memuat halaman utama'});
    }
  };