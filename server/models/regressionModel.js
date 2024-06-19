const math = require('mathjs');
const dataset = require('../models/dataset');
const resultModel = require('../models/resultModel');
const resultPrediction = require('./resultPrediction');

module.exports = {
    predictAirPollution: async (data) => { //digunakan hanya untuk prediksi
        try {
          /*format input Data yang digunakan yaitu:
              hours, co saat ini, pm25 saat ini, humidity saat ini,
              temperature saat ini dan windspeed saat ini dalam bentuk
              array 1D misal [16, 3, 5, 50, 30, 2]
          */
          // Coba memuat model regresi dari database resultModel
          const fetchModel = await resultModel.findOne().sort({ lastTrainedAt: -1 }).limit(1);
          const coeff = fetchModel.model.flat();
          if (fetchModel) {
            const prediction = Math.abs(math.multiply(data, coeff));
            // Simpan hasil prediksi yang baru
            await resultPrediction.create({
              jenis:"CO",
              value: parseFloat(prediction)
            });
            return true;
          }
          else{
            // Jika model belum ada, kembalikan null
            return null;
          }
        }catch (error) {
            console.error('Terjadi kesalahan saat memprediksi polusi udara:', error);
            throw error;
        }  
    },
    isLatestData: async (data) => { //Cek apakah data dari thingspeak benar terbaru? 
      const lastData = await dataset.find({}).sort({timestamp: -1}).limit(1);
      if (Math.abs(new Date(lastData[0].timestamp).getTime() - new Date(data.created_at).getTime()) > 10*1000){
        return true;
      }
      else{
        return false;
      }
    },
    firstTrain: async (data) => { //digunakan untuk membangun model awal dari 100 data thingspeak
      try {
        // Ekstrak fitur-fitur dari data
        const formattedData = data.map((d, index) => [
          d.hours,
          d.value.co,
          index > 0 ? data[index - 1].value.co : 0, // Lag CO
          index > 0 ? data[index - 1].value.pm25 : 0, // Lag PM2.5
          index > 0 ? data[index - 1].value.humidity : 0, // Lag Humidity
          index > 0 ? data[index - 1].value.temperature : 0, // Lag Temperature
          index > 0 ? data[index - 1].value.windSpeed : 0 // Lag Wind Speed
        ]);
        // Definisikan data training
        // hours, lag_co, lag_pm25, lag_humidity, lag_temperature, lag_windspeed
        const X = formattedData.map(row => [row[0], row[2], row[3], row[4], row[5], row[6]]); 
        const y = formattedData.map(row => row[1]); // co
        
        const coef = module.exports.multipleLinearRegression(X,y);
        
        // Simpan coeff yang baru dilatih
        await resultModel.create({
            model: coef,
            lastTrainedAt: new Date()
          });
        } catch (error) {
          console.error('Terjadi kesalahan saat melatih model regresi:', error);
          throw error;
        }
    },
    multipleLinearRegression(X,y){
      const XT = math.transpose(X);
      const XT_X = math.multiply(XT, X);
      const XT_X_INV = math.inv(XT_X);
      const XT_y = math.multiply(XT, y);
      const coef = math.multiply(XT_X_INV, XT_y); //coefficients from model
      return coef;
    },
    updateRegressionModel: async () => {// digunakan untuk update model baru yang memiliki data terbaru
        try {
          // Ambil 150 data terbaru dari dataset
          const recentData = await dataset.find({}).sort({ timestamp: -1 }).limit(150);
          const formattedData = data.map((d, index) => [
            d.hours,
            d.value.co,
            index > 0 ? data[index - 1].value.co : 0, // Lag CO
            index > 0 ? data[index - 1].value.pm25 : 0, // Lag PM2.5
            index > 0 ? data[index - 1].value.humidity : 0, // Lag Humidity
            index > 0 ? data[index - 1].value.temperature : 0, // Lag Temperature
            index > 0 ? data[index - 1].value.windSpeed : 0 // Lag Wind Speed
          ]);
          // Definisikan data training
          // hours, lag_co, lag_pm25, lag_humidity, lag_temperature, lag_windspeed
          const X = formattedData.map(row => [row[0], row[2], row[3], row[4], row[5], row[6]]); 
          const y = formattedData.map(row => row[1]); // co
    
          // Buat model regresi linier dan latih
          const coef = module.exports.multipleLinearRegression(X,y);
    
          // Simpan model yang baru dilatih
          await resultModel.create({
            model: coef,
            lastTrainedAt: new Date()
          });
          console.log('Model regresi berhasil diperbarui');
        } catch (error) {
          console.error('Terjadi kesalahan saat update model regresi:', error);
          throw error;
        }
    }
};
