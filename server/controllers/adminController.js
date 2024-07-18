const mongoose = require("mongoose");
const dataset = require('../models/dataset');
const resultPrediction = require('../models/resultPrediction');
const resultModel = require('../models/resultModel');
const path = require('path');
const datatrain = require('../models/datatrain');
const fs = require('fs');

exports.dashboard = async(req, res) => {  //Menerapkan langsung fungsi ke objek exports
    try{
        // Memanggil fungsi untuk mendapatkan jumlah dokumen
        const totalData = await getDataset();
        const locals = {
            title: 'AIRMIND - Admin',
            description:'Air Pollution Monitoring and Prediction System',
            layout: './layouts/admin',
            totalData: totalData[0],
            totalPredicted: totalData[1]
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

exports.handleUploadData = (req, res) => {
    const filePath = path.join(__dirname, '..', req.file.path);
    
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).send('Error reading file');
        }

        try {
            dataset.deleteMany({});
            datatrain.deleteMany({});
            const jsonData = JSON.parse(data);
            
            // Proses data JSON sesuai kebutuhan Anda
            // Simpan data ke dalam model dataset dan datatrain
            for (const item of jsonData) {
                const newDataPoint = new dataset({
                value: {
                    co: parseFloat(item.co),
                    pm25: parseFloat(item.pm25),
                    temperature: parseFloat(item.temperature),
                    humidity: parseFloat(item.humidity),
                    windSpeed: parseFloat(item.windspeed)
                },
                timestamp: new Date(item.created_at),
                hours: new Date(item.created_at).getHours()
                });
                newDataPoint.save();

                const newDatatrain = new datatrain({
                value: {
                    co: parseFloat(item.co),
                    pm25: parseFloat(item.pm25),
                    temperature: parseFloat(item.temperature),
                    humidity: parseFloat(item.humidity),
                    windSpeed: parseFloat(item.windspeed)
                },
                timestamp: new Date(item.created_at),
                hours: new Date(item.created_at).getHours(),
                jenis: 'datatrain'
                });
                newDatatrain.save();
            }

            // Menghapus file setelah diproses
            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr) {
                    console.error('Error deleting file:', unlinkErr);
                }
            });

            res.send('File uploaded and processed successfully');
        } catch (parseErr) {
            console.error('Error parsing JSON:', parseErr);
            res.status(400).send('Invalid JSON format');
        }
    });
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
        const combinedData = combinedPredictionsArray.map(prediction => {
            const actual = datasets.find(dataset => compareDateHour(prediction.timestamp, dataset.timestamp)) || {};
            return {
                timestamp: prediction.timestamp,
                predictedCO: prediction.predictedCO,
                predictedPM25: prediction.predictedPM25,
                actualCO: actual.value ? actual.value.co : null,
                actualPM25: actual.value ? actual.value.pm25 : null
            };
        });

        res.render('admin/prediction', {
            ...locals,
            combinedData
        });
    } catch (error) {
        console.error('Terjadi kesalahan saat memuat halaman prediksi:', error);
        res.status(500).render('error', { message: 'Terjadi kesalahan saat memuat halaman prediksi' });
    }
};

// exports.displayPrediction = async (req, res) => {
//     //Ambil prediksi dari database resultPrediction
//     try {
//       const locals = {
//         title: 'Prediction - AIRMIND',
//         description:'Air Pollution Monitoring and Prediction System',
//         layout: './layouts/admin'
//       };
//       const predictions = await resultPrediction.find({});
//       res.render('admin/prediction', { ...locals, predictions: predictions.map(p => ({
//         jenis: p.jenis,
//         value: p.value,
//         timestamp: p.createdAt
//       }))});
//     } catch (error) {
//       console.error('Terjadi kesalahan saat memuat halaman prediksi:', error);
//       res.status(500).render('error', { message: 'Terjadi kesalahan saat memuat halaman prediksi' });
//     }
// };

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
            performance: item.performance !== undefined ? item.performance: "belum dievaluasi"
        }));
        return formatResult; 
    }catch(error){
        console.error('Error fetching resultModel', error);
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
//Get total data saved in dataset 
const getDataset = async () => {
    try{
        const totalData = await dataset.countDocuments({});
        const totalPredicted = await resultPrediction.countDocuments({});
        var total = [totalData, totalPredicted];
        return total;
    }catch(error){
        console.error('Kesalahan dalam menghitung data:', error);
    }
}
