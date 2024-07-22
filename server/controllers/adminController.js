const mongoose = require("mongoose");
const dataset = require('../models/dataset');
const resultPrediction = require('../models/resultPrediction');
const resultModel = require('../models/resultModel');
const path = require('path');
const datatest = require('../models/datatest');
const fs = require('fs');
const regressionModel = require("../models/regressionModel");
const json2csv = require('json2csv').parse;

exports.dashboard = async(req, res) => {  //Menerapkan langsung fungsi ke objek exports
    try{
        // Memanggil fungsi untuk mendapatkan jumlah dokumen
        const totalData = await getDataset();
        const locals = {
            title: 'AIRMIND - Admin',
            description:'Air Pollution Monitoring and Prediction System',
            layout: './layouts/admin',
            totalData: totalData[0],
            totalPredicted: totalData[1],
            peformaCO: totalData[2],
            peformaPM25: totalData[3]
        };
        res.render('admin/dashboard', locals); //rendering admin dashboarad in views
    }catch (error){
        console.error('Terjadi kesalahan saat memuat halaman utama:', error);
        res.status(500).render('error',{message:'Terjadi kesalahan saat memuat halaman utama'});
    }
};

exports.uploadData = async(req, res) => {
    try{
        const locals = {
            title: 'AIRMIND - Upload',
            description: 'Air Pollution Monitoring and Prediction System',
            layout: './layouts/admin'
        }
        res.render('admin/uploadData', locals);
    }catch(error){
        console.error('Tidak dapat memuat halaman Upload', error);
        res.status(500).render('error',{message:'Tidak dapat memuat halaman Upload'});
    }
};
exports.uploadDatatest = async(req, res) => {//Masih ada perbaikan fungsi jangan dipakai dahulu
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

exports.getDataSaved = async (req, res) => {
    try{
        const datasets = await fetchDataset(); // Panggil fungsi fetchDataset untuk mendapatkan data
        const viewdataset = datasets.map(item => ({
            co: item.value.co,
            pm25: item.value.pm25,
            temp:item.value.temperature,
            hum:item.value.humidity,
            windSpeed:item.value.windSpeed,
            timestamp:item.timestamp,
        }));
        const locals = {
            title: 'AIRMIND - Data Pollution Saved',
            description:'Air Pollution Monitoring and Prediction System',
            layout: './layouts/admin'
        };
        res.render('admin/viewDataSaved', {...locals, viewdataset});
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
exports.displayPrediction = async (req, res) => {
    try {
        const locals = {
            title: 'Prediction - AIRMIND',
            description: 'Air Pollution Monitoring and Prediction System',
            layout: './layouts/admin'
        };

        const predictions = await resultPrediction.find({});
        const datasets = await fetchDataset(); // Panggil fungsi fetchDataset untuk mendapatkan data

        // Gabungkan prediksi CO dan PM2.5 berdasarkan timestamp yang mirip
        /*reduce digunakan untuk menerapkan fungsi yang dibuat didalamnya pada setiap elemen array
        reduce(callback, initialValue) dan disini initialValue diisi kosong {}
        */
        const combinedPredictions = predictions.reduce((acc, prediction) => {
            const timestamp = prediction.createdAt;
            const key = timestamp.toISOString().slice(0, 16); // Ambil YYYY-MM-DDTHH:MM
            if (!acc[key]) {//inisialisasi object acc[]
                acc[key] = { timestamp, predictedCO: null, predictedPM25: null };
            }
            if (prediction.jenis === 'CO') {//mengisi nilai object acc[] pada field co
                acc[key].predictedCO = prediction.value;
            } else if (prediction.jenis === 'PM25') {// mengisi nilai object pada field pm25
                acc[key].predictedPM25 = prediction.value;
            }
            return acc;//return acc atau akumulator untuk iterasi elemen berikutnya 
        }, {});

        // Konversi objek menjadi array
        const combinedPredictionsArray = Object.values(combinedPredictions);

        // Fungsi untuk membandingkan hanya tanggal dan jam (mengabaikan menit dan detik)
        const compareDateHour = (date1, date2) => {
            const d1 = new Date(date1);
            const d2 = new Date(date2);
            return d1.getFullYear() === d2.getFullYear() &&
                   d1.getMonth() === d2.getMonth() &&
                   d1.getDate() === d2.getDate() &&
                   d1.getHours() === d2.getHours();
        };

        // Gabungkan data prediksi dan data aktual berdasarkan tanggal dan jam
        const combinedData = combinedPredictionsArray.reduce((acc, prediction) => {
            const actual = datasets.find(dataset => compareDateHour(prediction.timestamp, dataset.timestamp)) || {};
            if (actual){
                acc.push({
                    timestamp: prediction.timestamp,
                    predictedCO: prediction.predictedCO,
                    predictedPM25: prediction.predictedPM25,
                    actualCO: actual.value ? actual.value.co : null,
                    actualPM25: actual.value ? actual.value.pm25 : null
                })
            }
            return acc;
        }, []);

        res.render('admin/prediction', {
            ...locals,
            combinedData
        });
    } catch (error) {
        console.error('Terjadi kesalahan saat memuat halaman prediksi:', error);
        res.status(500).render('error', { message: 'Terjadi kesalahan saat memuat halaman prediksi' });
    }
};

exports.getEvaluation = async (req, res) => {
    try{
        const models = await getModel();
        
        const locals = {
            title: 'AIRMIND - Model Evaluation',
            description:'Air Pollution Monitoring and Prediction System',
            layout: './layouts/admin'
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
        const resultMAPE = regressionModel.calculateMAPE(actualData, predictedValues, modelName);
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
        const locals = {
            title: 'AIRMIND - Backup Dataset',
            description:'Air Pollution Monitoring and Prediction System',
            layout: './layouts/admin'
        };
        res.render('admin/backupdata', locals);
    }catch(error){
        console.error('terjadi kesalahan saat memuat halaman backup dataset:', error);
        res.status(500).render('error',{message:'Terjadi kesalahan saat memuat halaman backup dataset'});
    }
};

exports.downloadJson = async (req, res) => {
    try {
        const datasets = await dataset.find({});
        const predictions = await resultPrediction.find({});

        const data = {
            datasets,
            predictions
        };

        res.setHeader('Content-Disposition', 'attachment; filename=backup.json');
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Terjadi kesalahan saat mengunduh data JSON:', error);
        res.status(500).send('Terjadi kesalahan saat mengunduh data JSON');
    }
};

exports.downloadCsv = async (req, res) => {
    try {
        const datasets = await dataset.find({});
        const predictions = await resultPrediction.find({});

        const datasetCsv = json2csv(datasets, { fields: ['_id', 'value.co', 'value.pm25', 'value.temperature', 'value.humidity', 'value.windSpeed', 'timestamp', 'hours'] });
        const predictionCsv = json2csv(predictions, { fields: ['createdAt', 'value', 'jenis'] });

        const csv = `Datasets\n${datasetCsv}\n\nPredictions\n${predictionCsv}`;

        res.setHeader('Content-Disposition', 'attachment; filename=backup.csv');
        res.setHeader('Content-Type', 'text/csv');
        res.send(csv);
    } catch (error) {
        console.error('Terjadi kesalahan saat mengunduh data CSV:', error);
        res.status(500).send('Terjadi kesalahan saat mengunduh data CSV');
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
exports.testFunction = async (req, res) => {
    try{
        const {modelId} = req.body;
        console.log(modelId);
    }catch(error){

    }
}

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
}
