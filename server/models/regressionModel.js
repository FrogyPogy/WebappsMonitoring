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
          const fetchModelCO = await resultModel.findOne({ name: 'modelCO' }).sort({ lastTrainedAt: -1 }).limit(1);
          const fetchModelPM25 = await resultModel.findOne({ name: 'modelPM25' }).sort({ lastTrainedAt: -1 }).limit(1);
          
          const coeffCO = fetchModelCO.model.flat();
          const coeffPM25 = fetchModelPM25.model.flat();
          var dataPM25 = data;
          // const temp = dataPM25[1];
          // const dataPM25
          [dataPM25[1], dataPM25[2]] = [dataPM25[2], dataPM25[1]];
          
          if (fetchModelCO && fetchModelPM25) {
            const predictionCO = math.abs(math.multiply(data, coeffCO));
            const predictionPM25 = math.abs(math.multiply(dataPM25, coeffPM25));
            // Simpan hasil prediksi yang baru
            
            const result = [predictionCO, predictionPM25];
            return result;
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
    calculateMAPE : (actualData, predictedData, type) => {
      try{
        let totalAPE = 0;
        let count = 0;

        for (const actual of actualData){
          const predicted = predictedData.find(p => p.timestamp.toISOString() === actual.timestamp.toISOString());
          

          if (predicted && type == 'modelCO'){
            const actualValue = parseFloat(actual.actualco);
            const predictedValue = parseFloat(predicted.predicted);
            console.log('predicted value = ', predicted, 'actual value = ', actualValue);

            if (actualValue !== 0){
              const ape = math.abs((actualValue - predictedValue) / actualValue);
              totalAPE += ape;
              count++;
            }
          }else if(predicted && type == 'modelPM25'){
            const actualValue = parseFloat(actual.actualpm25);
            const predictedValue = parseFloat(predicted.predicted);

            if (actualValue !== 0){
              const ape = math.abs((actualValue - predictedValue) / actualValue);
              totalAPE += ape;
              count++;
            }
          }
        }
        return (totalAPE/ count) * 100;
      }catch (error){
        console.error('Terjadi kesalahan saat menghitung MAPE:', error);
        throw error;
      }
    }, 

    calculateRMSE: (actualData, predictedData, type) => {
      try {
        let totalSquaredError = 0;
        let count = 0;
  
        for (const actual of actualData) {
          const predicted = predictedData.find(p => p.timestamp.toISOString() === actual.timestamp.toISOString());
          
          if (predicted && type === 'modelCO') {
            const actualValue = parseFloat(actual.actualco);
            const predictedValue = parseFloat(predicted.predicted);
  
            const squaredError = Math.pow(actualValue - predictedValue, 2);
            totalSquaredError += squaredError;
            count++;
          } else if (predicted && type === 'modelPM25') {
            const actualValue = parseFloat(actual.actualpm25);
            const predictedValue = parseFloat(predicted.predicted);
  
            const squaredError = Math.pow(actualValue - predictedValue, 2);
            totalSquaredError += squaredError;
            count++;
          }
        }
        return Math.sqrt(totalSquaredError / count);
      } catch (error) {
        console.error('Terjadi kesalahan saat menghitung RMSE:', error);
        throw error;
      }
    },

    predictTest: async (data, _id) => {
      try {
        
        /*format input Data yang digunakan seperti predictAirPollution()*/
        // Coba memuat model regresi dari database resultModel
        
        const fetchModel = await resultModel.findOne({ _id: _id });
        const coeff = fetchModel.model.flat();
        const modelName = fetchModel.name;
        var dataPM25 = data;
        // const temp = dataPM25[1];
        // const dataPM25
        [dataPM25[1], dataPM25[2]] = [dataPM25[2], dataPM25[1]];
        
        if (fetchModel && (modelName == 'modelCO' )) {
          console.log('model yang dievaluasi saat ini', modelName);
          const predictionCO = math.abs(math.multiply(data, coeff));
          
          const result = predictionCO;
          // Simpan hasil prediksi yang baru
          return result;
        }else if (fetchModel && (modelName == 'modelPM25')){
          console.log('model yang digunakan saat ini', modelName);
          const predictionPM25 = math.abs(math.multiply(dataPM25, coeff));
          const result = predictionPM25;
          return result;
        }else{
          // Jika model belum ada, kembalikan null
          return null;
        }
      }catch(error){
        console.error('Terjadi kesalahan memprediksi saat tahap evaluasi:', error);
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
    firstTrainPM25: async (data) => {
      try {
        // Ekstrak fitur-fitur dari data
        const formattedData = data.map((d, index) => [
          d.hours,
          d.value.pm25,
          index > 0 ? data[index - 1].value.co : 0, // Lag CO
          index > 0 ? data[index - 1].value.pm25 : 0, // Lag PM2.5
          index > 0 ? data[index - 1].value.humidity : 0, // Lag Humidity
          index > 0 ? data[index - 1].value.temperature : 0, // Lag Temperature
          index > 0 ? data[index - 1].value.windSpeed : 0 // Lag Wind Speed
        ]);
        // Definisikan data training
        // hours, lag_co, lag_pm25, lag_humidity, lag_temperature, lag_windspeed
        const X = formattedData.map(row => [row[0], row[2], row[3], row[4], row[5], row[6]]); 
        const y = formattedData.map(row => row[1]); // pm25
        
        const coef = module.exports.multipleLinearRegression(X,y);
        
        // Simpan coeff yang baru dilatih
        await resultModel.create({
            model: coef,
            lastTrainedAt: new Date(),
            name: "modelPM25"
          });
      }catch(error){
        console.error('terjadi kesalahan saat melatih model regresi pm25: ',error);
        throw error;
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
            lastTrainedAt: new Date(),
            name: "modelCO"
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
    //updateRegressionModel perlu di penambahan untuk update 2 model sekaligus
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
