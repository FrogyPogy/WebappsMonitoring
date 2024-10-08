const mongoose = require("mongoose");
const dataset = require('../models/dataset');
const regressionModel = require('../models/regressionModel');
const resultPrediction = require('../models/resultPrediction');
const init = require('../models/init');
const resultModel = require('../models/resultModel');

exports.homepage = async(req, res) => {  //Menerapkan langsung fungsi ke objek exports
  try{
    const initStatus = await init.findOne({});
    if (!initStatus) {
      await init.create({ isInit: false });
    }
    if(!initStatus || !initStatus.isInit){
      await exports.initializeData(req, res);
      //ubah status pada isInit
      await init.updateOne({}, { isInit: true}, {upsert: true});
    }
    
  const locals = {
        title: 'AIRMIND',
        description:'Air Pollution Monitoring and Prediction System'
  };
    res.render('index', locals); //rendering index.ejs in views
  }catch (error){
    console.error('Terjadi kesalahan saat memuat halaman utama:', error);
    res.status(500).render('500',{message:'Terjadi kesalahan saat memuat halaman utama'});
  }
};

exports.about = async(req, res) => {
    const locals = {
        title:'About - AIRMIND',
        description:'Air Pollution Monitoring and Prediction System'
    }
    res.render('about', locals);
};

exports.contact = async (req, res) => {
  const locals = {
    title:'Contact - AIRMIND',
    description:'Air Pollution Monitoring and Prediction System'
  }
  res.render('contact', locals);
}

exports.initializeData = async (req, res) => {
    try {
      // Ambil 100 data awal dari ThingSpeak
      const apiKey = '2P8XPOJ7NOLG0YPU';
      const channelId = '2422190';
      const response = await fetch(`https://api.thingspeak.com/channels/${channelId}/feeds.json?api_key=${apiKey}&results=100`);
      const data = await response.json();
  
      // Simpan data ke dalam model dataset
      for (const item of data.feeds) {
        const newDataPoint = new dataset({
          value: {
            co: parseFloat(item.field1),
            pm25: parseFloat(item.field2),
            temperature: parseFloat(item.field3),
            humidity: parseFloat(item.field4),
            windSpeed: parseFloat(item.field5)
          },
          timestamp: new Date(item.created_at),
          hours: new Date(item.created_at).getHours()
        });
        await newDataPoint.save();
      }
  
      //Lakukan pelatihan model regresi awal
      const dataPoints = await dataset.find({}).sort({ 'hours': -1 }).limit(100);
      await regressionModel.firstTrain(dataPoints);
      const locals = {
        title: 'AIRMIND',
        description:'Air Pollution Monitoring and Prediction System'
      };
      res.render('index', locals); //rendering index.ejs in views
    } catch (error) {
      console.error('Terjadi kesalahan:', error);
      res.status(500).json({ error: 'Terjadi kesalahan saat menyimpan data awal' });
    }
  };
exports.updateModel = async (req, res) => {
  try{
    const lastDataset = await dataset.find({}).sort({ timestamp: 1 }).limit(100);
    await regressionModel.firstTrainPM25(lastDataset);
    await regressionModel.firstTrain(lastDataset);

    req.flash('success_msg', 'new model trainde successfully');
    res.redirect('/prediction');

  }catch(error){
    req.flash('error_msg', 'fail to train new model');
    res.redirect('/prediction');
  }
}

exports.initializeModel = async (req, res) => {
  try{
    //cek apakah resultModel kosong?
    const resultModelCount = await resultModel.countDocuments({});

    if (resultModelCount > 0){
      //Hapus semua model jika ada:
      await resultModel.deleteMany({});
    }
    
    //ambil seluruh data dari dataset
    const firstDataset = await dataset.find({}).sort({ timestamp: 1 }).limit(100);
    await regressionModel.firstTrainPM25(firstDataset);
    await regressionModel.firstTrain(firstDataset);
  
    req.flash('success_msg', 'initial model trained successfully');
    res.redirect('/prediction'); //rendering index.ejs in views
  }catch(error){
    req.flash('error_msg', 'fail to train model');
    res.redirect('/prediction');
    // res.status(500).json({error: 'terjadi kesalahan saat melakukan initialize model'});
  }
};

//formatDate
//untuk memformat tipe data waktu menjadi hari dan jam
// function formatDate(dateStr){
//   const date = new Date(dateStr);
//   const hours = date.getHours();
//   const day = date.getDate();
//   return `${hours}:00, ${day}`;
// }

//Get data from thingspeak 
exports.getData = async (req, res) => {
  try{
    const apiKey = '2P8XPOJ7NOLG0YPU';
        const channelId = '2422190';
        const response = await fetch(`https://api.thingspeak.com/channels/${channelId}/feeds.json?api_key=${apiKey}&results=60`);
        const data = await response.json();
        res.json(data);
  }catch(error){
      console.error('Error fetching data from ThingSpeak:', error);
      res.status(500).json({ error: 'Error fetching data' });
  }
}

exports.getPrediction = async (req, res) => {
  try{
    const lastPrediction = await resultPrediction.findOne({}).sort({ createdAt: -1 })

    res.json(lastPrediction);
  }catch(error){
    req.flash('error_msg', 'Belum ada model prediksi');
    res.status(500).json({ error: 'Error fetching data from Prediction' });
  }
}


