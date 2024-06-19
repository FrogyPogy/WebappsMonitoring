const mongoose = require("mongoose");
const dataset = require('../models/dataset');
const regressionModel = require('../models/regressionModel');
const resultPrediction = require('../models/resultPrediction');
const init = require('../models/init');

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
    res.status(500).render('error',{message:'Terjadi kesalahan saat memuat halaman utama'});
  }
};

exports.about = async(req, res) => {
    const locals = {
        title:'About - AIRMIND',
        description:'Air Pollution Monitoring and Prediction System'
    }
    res.render('about', locals);
};

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

//DisplayAirPollutinPrediction
exports.displayPrediction = async (req, res) => {
    //Ambil prediksi dari database resultPrediction
    try {
      const predictions = await resultPrediction.find({});
      res.render('prediction', { predictions: predictions.map(p => ({
        jenis: p.jenis,
        value: p.value,
        timestamp: p.createdAt
      })) });
    } catch (error) {
      console.error('Terjadi kesalahan saat memuat halaman prediksi:', error);
      res.status(500).render('error', { message: 'Terjadi kesalahan saat memuat halaman prediksi' });
    }
};

//formatDate
//untuk memformat tipe data waktu menjadi hari dan jam
function formatDate(dateStr){
  const date = new Date(dateStr);
  const hours = date.getHours();
  const day = date.getDate();
  return `${hours}:00, ${day}`;
}

//Get data from thingspeak 
exports.getData = async (req, res) => {
  try{
    const apiKey = '2P8XPOJ7NOLG0YPU';
        const channelId = '2422190';
        const response = await fetch(`https://api.thingspeak.com/channels/${channelId}/feeds.json?api_key=${apiKey}&results=60`);
        const data = await response.json();
        data.feeds = data.feeds.map(feedTime=>{
          feedTime.created_at = formatDate(feedTime.created_at);
          return feedTime;
        })
        res.json(data);
  }catch(error){
      console.error('Error fetching data from ThingSpeak:', error);
      res.status(500).json({ error: 'Error fetching data' });
  }
}


