const mongoose = require("mongoose");
const dataset = require('../models/dataset');
const resultPrediction = require('../models/resultPrediction');
const resultModel = require('../models/resultModel');
const path = require('path');
const datatest = require('../models/datatest');
const fs = require('fs');
const regressionModel = require("../models/regressionModel");
const json2csv = require('json2csv').parse;
const users = require('../models/user');

exports.dashboard = async(req, res) => {  //Menerapkan langsung fungsi ke objek exports
    try{
        // Memanggil fungsi untuk mendapatkan jumlah dokumen
        const userId = req.user.id; //ambil user_id yang dikirimkan oleh middleware authentikasi
        const fetchUsers = await users.findById(userId).lean(); // Mengambil informasi user

        const totalData = await getDataset();
        const locals = {
            title: 'AIRMIND - Admin',
            description:'Air Pollution Monitoring and Prediction System',
            layout: './layouts/admin',
            totalData: totalData[0],
            totalPredicted: totalData[1],
            peformaCO: totalData[2],
            peformaPM25: totalData[3],
            userName: fetchUsers.username // Mengirim nama pengguna ke view
        };
        res.render('admin/dashboard', locals); //rendering admin dashboarad in views
    }catch (error){
        console.error('Terjadi kesalahan saat memuat halaman utama:', error);
        res.status(500).render('error',{message:'Terjadi kesalahan saat memuat halaman utama'});
    }
};

exports.uploadData = async(req, res) => {
    try{
        const userId = req.user.id; //ambil user_id yang dikirimkan oleh middleware authentikasi
        const fetchUsers = await users.findById(userId).lean(); // Mengambil informasi user

        const locals = {
            title: 'AIRMIND - Upload',
            description: 'Air Pollution Monitoring and Prediction System',
            layout: './layouts/admin',
            userName: fetchUsers.username
        }
        res.render('admin/uploadData', locals);
    }catch(error){
        console.error('Tidak dapat memuat halaman Upload', error);
        res.status(500).render('error',{message:'Tidak dapat memuat halaman Upload'});
    }
};
//Mengupload datatest yang digunakan untuk evaluasi model
exports.uploadDatatest = async(req, res) => {
    if (!req.file){
        return res.status(400).send('No file uploaded');
    }
    const filePath = path.join(req.file.destination, req.file.filename);

    try{
        const data = await fs.promises.readFile(filePath, 'utf8');
        const jsonData = JSON.parse(data);

        const datatestCount = await datatest.countDocuments({});

        if (datatestCount > 0){
            //hapus dataset dan datatrain lama
            await datatest.deleteMany({});
        }
        
        // Urutkan data JSON berdasarkan created_at
        jsonData.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        for (const item of jsonData){
            const newDatatest = new datatest({
                value: {
                    co: parseFloat(item.co).toFixed(2),
                    pm25: parseFloat(item.pm25).toFixed(2),
                    temperature: parseFloat(item.temperature).toFixed(2),
                    humidity: parseFloat(item.humidity).toFixed(2),
                    windSpeed: parseFloat(item.windspeed).toFixed(2)
                },
                actual: {
                  actualco: parseFloat(item.actualco).toFixed(2),
                  actualpm25: parseFloat(item.actualpm25).toFixed(2)  
                },
                timestamp: new Date(item.created_at),
                hours: new Date(item.created_at).getHours()
                });
                await newDatatest.save();
        }

         // Menghapus file setelah diproses
         await fs.promises.unlink(filePath);
        
         res.send('Data test uploaded and processed successfully');
    }catch(error){
        console.error('Error parsing JSON:', error);
        res.status(400).send('Invalid JSON format');
    }
};
// Upload data untuk Inisialisasi dataset awal
exports.uploadDataset = async(req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded');
    }
    const filePath = path.join(req.file.destination, req.file.filename);

    try {
        const data = await fs.promises.readFile(filePath, 'utf8');
        const jsonData = JSON.parse(data);

        //cek apakah dataset kosong?
        const datasetCount = await dataset.countDocuments({});

        if (datasetCount > 0){
            //hapus dataset dan datatrain lama
            await dataset.deleteMany({});
        }
        // Urutkan data JSON berdasarkan created_at
        jsonData.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        // Proses data JSON

        for (const item of jsonData) {
            const newDataPoint = new dataset({
            value: {
                co: parseFloat(item.co).toFixed(2),
                pm25: parseFloat(item.pm25).toFixed(2),
                temperature: parseFloat(item.temperature).toFixed(2),
                humidity: parseFloat(item.humidity).toFixed(2),
                windSpeed: parseFloat(item.windspeed).toFixed(2)
            },
            timestamp: new Date(item.created_at),
            hours: new Date(item.created_at).getHours()
            });
            await newDataPoint.save();
        }
            
        // Menghapus file setelah diproses
        await fs.promises.unlink(filePath);
        
        res.send('Dataset uploaded and processed successfully');

        } catch (parseErr) {
            console.error('Error parsing JSON:', parseErr);
            res.status(400).send('Invalid JSON format');
        };
};
//Menampilkan halaman berisi seluruh dataset
exports.getDataSaved = async (req, res) => {
    try{
        const page = parseInt(req.query.page) || 1;
        const limit = 15;
        const startIndex = (page - 1) * limit;

        const totalDatasets = await dataset.countDocuments();
        const datasets = await dataset.find().skip(startIndex).limit(limit);

        const viewdataset = datasets.map(item => ({
            co: item.value.co,
            pm25: item.value.pm25,
            temp:item.value.temperature,
            hum:item.value.humidity,
            windSpeed:item.value.windSpeed,
            timestamp:item.timestamp,
            _id: item._id
        }));

        const userId = req.user.id; //ambil user_id yang dikirimkan oleh middleware authentikasi
        const fetchUsers = await users.findById(userId).lean(); // Mengambil informasi user
        const locals = {
            title: 'AIRMIND - Air Pollution Dataset',
            description: 'Air Pollution Monitoring and Prediction System',
            layout: './layouts/admin',
            current: page,
            pages: Math.ceil(totalDatasets / limit),
            viewdataset: viewdataset,
            userName: fetchUsers.username
        };

        res.render('admin/viewDataSaved', locals);
    }catch (error){
        console.error('terjadi kesalahan saat memuat halaman Dataset:', error);
        res.status(500).render('error',{message:'Terjadi kesalahan saat memuat halaman dataset'});
    }
};

const fetchDataset = async () => {
    try{
        const allDataset = await dataset.find({});
        return allDataset;
    }catch(error){
        console.error('Error fetching dataset from dataset:', error);
        throw error;
    }
};

//DisplayAirPollutinPrediction
/*Tampilkan hasil prediksi beserta aktual value dimana
waktu dari aktual value merupakan satu jam kedepan setelah
waktu hasil prediksi tersebut (waktu aktual value = waktu prediksi + 1jam)
*/
exports.displayPrediction = async (req, res) => {
    try {
        const userId = req.user.id; //ambil user_id yang dikirimkan oleh middleware authentikasi
        const fetchUsers = await users.findById(userId).lean(); // Mengambil informasi user

        const locals = {
            title: 'Prediction - AIRMIND',
            description: 'Air Pollution Monitoring and Prediction System',
            layout: './layouts/admin',
            userName: fetchUsers.username
        };
        const predictions = await resultPrediction.find({});
        const datasets = await fetchDataset(); // Panggil fungsi fetchDataset untuk mendapatkan data

        // Gabungkan prediksi CO dan PM2.5 berdasarkan timestamp yang mirip
        /*reduce digunakan untuk menerapkan fungsi yang dibuat didalamnya pada setiap elemen array
        reduce(callback, initialValue) dan disini initialValue diisi kosong {}
        */

        // Konversi objek menjadi array
        const combinedPredictionsArray = Object.values(predictions);

        // Fungsi untuk membandingkan hanya tanggal dan jam (mengabaikan menit dan detik)
        const compareDateHour = (datePredict, dateActual) => {
            const d1 = new Date(datePredict);
            const d2 = new Date(dateActual);
            return d1.getFullYear() === d2.getFullYear() &&
                   d1.getMonth() === d2.getMonth() &&
                   d1.getDate() === d2.getDate() &&
                   d1.getHours() === d2.getHours(); //karena hasil prediksi merupakan data untuk satu jam kedepan
        };

        // Gabungkan data prediksi dan data aktual berdasarkan tanggal dan jam
        const combinedData = combinedPredictionsArray.reduce((acc, prediction) => {
            const actual = datasets.find(dataset => compareDateHour(prediction.createdAt, dataset.timestamp)) || {};
            if (actual){
                acc.push({
                    _id: prediction._id,
                    timestamp: prediction.createdAt,
                    predictedCO: prediction.value.co,
                    predictedPM25: prediction.value.pm25,
                    actualCO: actual.value ? actual.value.co : null,
                    actualPM25: actual.value ? actual.value.pm25 : null
                })
            }
            return acc;
        }, []);

        // Pagination logic
        const page = parseInt(req.query.page) || 1;
        const limit = 15;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedResults = combinedData.slice(startIndex, endIndex);

        const totalPages = Math.ceil(combinedData.length / limit);

        res.render('admin/prediction', {
            ...locals,
            combinedData: paginatedResults,
            currentPage: page,
            totalPages: totalPages
        });
    } catch (error) {
        console.error('Terjadi kesalahan saat memuat halaman prediksi:', error);
        res.status(500).render('error', { message: 'Terjadi kesalahan saat memuat halaman prediksi' });
    }
};

exports.getEvaluation = async (req, res) => {
    try{
        const models = await getModel();
        const userId = req.user.id; //ambil user_id yang dikirimkan oleh middleware authentikasi
        const fetchUsers = await users.findById(userId).lean(); // Mengambil informasi user

        const locals = {
            title: 'AIRMIND - Model Evaluation',
            description:'Air Pollution Monitoring and Prediction System',
            layout: './layouts/admin',
            userName: fetchUsers.username
        };
        res.render('admin/evaluation', {...locals, models});
    }catch(error){
        console.error('terjadi kesalahan saat memuat halaman evaluation:', error);
        res.status(500).render('error',{message:'Terjadi kesalahan saat memuat halaman evaluation'});
    }
};

const getModel = async() => {
    try{
        const result = await resultModel.find({});
        const formatResult = result.map(item => ({
            name: item.name,
            lastTrainedAt: item.lastTrainedAt,
            performance: item.performance !== undefined ? item.performance: "belum dievaluasi",
            _id: item._id
        }));
        return formatResult; 
    }catch(error){
        console.error('Error fetching resultModel', error);
        throw error;
    }
};

exports.runEvaluation = async (req, res) => {
    try{
      const recentData = await datatest.find({});
      const { modelId, modelName } = req.body;
      
      //const predictedValue; untuk menampung hasil prediksi seluruh data
      const predictedValues = [];

      for (const item of recentData) {
        var co = parseFloat(item.value.co);
        var pm25 = parseFloat(item.value.pm25);
        var temperature = parseFloat(item.value.temperature);
        var humidity = parseFloat(item.value.humidity);
        var windSpeed = parseFloat(item.value.windSpeed);
        var hours = item.hours;
        var nextHour = (hours + 1) % 24;
        var data = [hours, co, pm25, temperature, humidity, windSpeed];
        console.log(data);
        const predicted = await regressionModel.predictTest(data, modelId);
        console.log('hasil prediksi co: ',predicted);
        if(predicted){
            //await push to predictedValue          
            const predictedData = {
                timestamp: item.timestamp,
                hours: item.hours,
                predicted:parseFloat(predicted)
            };
            predictedValues.push(predictedData);
        }
      }
      if(predictedValues.length > 0){
        //run MAPE function
        const actualData = recentData.map(item => ({
            timestamp: item.timestamp,
            actualco : parseFloat(item.actual.actualco),
            actualpm25: parseFloat(item.actual.actualpm25)
        }));
        const resultMAPE = regressionModel.calculateRMSE(actualData, predictedValues, modelName);
        await resultModel.findByIdAndUpdate(
            modelId,
            { performance: parseFloat(resultMAPE).toFixed(2) },
            { new: true } // Mengembalikan dokumen yang telah diperbarui
        );
        res.json({ success: true, predictions: predictedValues });
      }
      
    }catch(error){
      console.error('Terjadi kesalahan saat pengambilan datatest');
      throw error;
    }
};

exports.backupData = async (req, res) => {
    try{
        const userId = req.user.id; //ambil user_id yang dikirimkan oleh middleware authentikasi
        const fetchUsers = await users.findById(userId).lean(); // Mengambil informasi user

        const locals = {
            title: 'AIRMIND - Backup Dataset',
            description:'Air Pollution Monitoring and Prediction System',
            layout: './layouts/admin',
            userName: fetchUsers.username
        };
        res.render('admin/backupdata', locals);
    }catch(error){
        console.error('terjadi kesalahan saat memuat halaman backup dataset:', error);
        res.status(500).render('error',{message:'Terjadi kesalahan saat memuat halaman backup dataset'});
    }
};

exports.downloadDatasetJson = async (req, res) => {
    try {
        const datasets = await dataset.find({});

        res.setHeader('Content-Disposition', 'attachment; filename=backupDataset.json');
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(datasets, null, 2));
    } catch (error) {
        console.error('Terjadi kesalahan saat mengunduh dataset JSON:', error);
        res.status(500).send('Terjadi kesalahan saat mengunduh dataset JSON');
    }
};

exports.downloadPredictionJson = async (req, res) => {
    try{
        const predictions = await resultPrediction.find({});
        res.setHeader('Content-Disposition', 'attachment; filename=backupPrediction.json');
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(predictions, null, 2));

    }catch(error){
        console.error('Terjadi kesalahan saat mengunduh data prediction JSON:', error);
        res.status(500).send('Terjadi kesalahan saat mengunduh data prediction JSON');
    }
};

exports.downloadDatasetCsv = async (req, res) => {
    try {
        const datasets = await dataset.find({});
        const datasetCsv = json2csv(datasets, { fields: ['_id', 'value.co', 'value.pm25', 'value.temperature', 'value.humidity', 'value.windSpeed', 'timestamp', 'hours'] });

        const csv = `Datasets\n${datasetCsv}`;

        res.setHeader('Content-Disposition', 'attachment; filename=backupDataset.csv');
        res.setHeader('Content-Type', 'text/csv');
        res.send(csv);
    } catch (error) {
        console.error('Terjadi kesalahan saat mengunduh dataset CSV:', error);
        res.status(500).send('Terjadi kesalahan saat mengunduh dataset CSV');
    }
};
exports.downloadPredictionCsv = async (req, res) => {
    try {
        const predictions = await resultPrediction.find({});
        const predictionCsv = json2csv(predictions, { fields: ['createdAt', 'value.co', 'value.pm25'] });

        const csv = `Predictions\n${predictionCsv}`;

        res.setHeader('Content-Disposition', 'attachment; filename=backupPrediction.csv');
        res.setHeader('Content-Type', 'text/csv');
        res.send(csv);
    } catch (error) {
        console.error('Terjadi kesalahan saat mengunduh data prediction CSV:', error);
        res.status(500).send('Terjadi kesalahan saat mengunduh data prediction CSV');
    }
};

exports.deleteDataset = async (req, res) => {
    try{
        const { datasetId } = req.body;
        const result = await dataset.findByIdAndDelete( datasetId );

        if(!result){
            return res.status(404).json({ message: 'Dataset not found' });
        }
        res.status(200).json({ success: true, message: 'Dataset deleted successfully' });

    }catch(error){
        console.error('Error deleting model:', error);
        res.status(500).json({ message: 'Error deleting dataset' });
    }
};

exports.deleteModel = async (req, res) => {
    try{
        const { modelId } = req.body;
        console.log('Received modelId:', modelId); // Log to check if modelId is received

        const result = await resultModel.findByIdAndDelete(modelId);

        if (!result) {
            return res.status(404).json({ message: 'Result not found' });
        }
        res.status(200).json({ success: true, message: 'Model deleted successfully' });
    } catch (error) {
        console.error('Error deleting model:', error);
        res.status(500).json({ message: 'Error deleting model' });
    }
};
exports.deletePrediction = async (req, res) => {
    try{
        const { predictionId } = req.body;
        const result = await resultPrediction.findByIdAndDelete(predictionId);

        if(!result){
            return res.status(404).json({message: 'Result not found'});
        }
        res.status(200).json({success: true, message: 'Prediction data deleted successfully'});
    }catch(error){
        console.error('Error deleting prediction data: ', error);
        res.status(500).json({message: 'Error deleting prediction data'});
    }
};

//Get total data saved in dataset 
const getDataset = async () => {
    try{
        const totalData = await dataset.countDocuments({});
        const totalPredicted = await resultPrediction.countDocuments({});
        const performanceCO = await resultModel.findOne({ name: 'modelCO' }).sort({ lastTrainedAt: -1 }).limit(1);
        const performancePM25 = await resultModel.findOne({ name: 'modelPM25' }).sort({lastTrainedAt: -1}).limit(1);

        var total = [totalData, totalPredicted, performanceCO.performance, performancePM25.performance];
        return total;
    }catch(error){
        console.error('Kesalahan dalam menghitung data:', error);
    }
};
