const cron = require('node-cron');
// const pollutionDataFetcher = require('./pollutionDataFetcher');
const regressionModel = require('../models/regressionModel');
const dataset = require ('../models/dataset');
const math = require('mathjs');
const resultPrediction = require('../models/resultPrediction');

module.exports = {
    start: () => {
        //melakukan scheduling setiap satu jam utk ambil dan prediksi data
        cron.schedule('12 * * * *', updateAndPredict);
        //melakukan scheduling setiap 3 hari sekali untuk updateModel Regresi 
        // cron.schedule('0 0 */3 * *', regressionModel.updateRegressionModel);
    },
};
async function fetchLatestAirPollutionData() {
  const apiKey = '2P8XPOJ7NOLG0YPU';
  const channelId = '2422190';
  const response = await fetch(`https://api.thingspeak.com/channels/${channelId}/feeds.json?api_key=${apiKey}&results=60`);
  const data = await response.json();
  return data.feeds;
}
function calcMedian(data){
  const medianCO = math.median(data[1]);
  const medianPM25 = math.median(data[2]);
  const medianTemp = math.median(data[3]);
  const medianHum = math.median(data[4]);
  const medianWS = math.median(data[5]);
  const resultMedian = [data[0], medianCO, medianPM25, medianTemp, medianHum, medianWS];

  return resultMedian;
}

async function updateAndPredict(){
  try{
    const recentData = await fetchLatestAirPollutionData();
    const latestData = await regressionModel.isLatestData(recentData[recentData.length-1]);
    if(latestData){
      
      const latestFeed = recentData[recentData.length - 1];
      const latestHour = new Date(latestFeed.created_at).getHours();
      
      const prevHour = (latestHour - 1 + 24) % 24;
      //filter data berdasarkan jam terbaru dan satu jam sebelumnya
      const filterData = recentData.filter(feed => { 
        const feedHour = new Date(feed.created_at).getHours();
        return feedHour === latestHour || feedHour === prevHour;
      }) 

      //pisahkan nilai dari masing" field
      const fieldCO = filterData.map(feed => parseFloat(feed.field1)).filter(value => !isNaN(value));
      const fieldPM25 = filterData.map(feed => parseFloat(feed.field2)).filter(value => !isNaN(value));
      const fieldTemp  = filterData.map(feed => parseFloat(feed.field3)).filter(value => !isNaN(value));
      const fieldHum = filterData.map(feed => parseFloat(feed.field4)).filter(value => !isNaN(value));
      const fieldWS = filterData.map(feed => parseFloat(feed.field5)).filter(value => !isNaN(value));
      const nextHour = (latestHour+1) % 24;
      const data = [latestHour, fieldCO, fieldPM25, fieldTemp, fieldHum, fieldWS];
      
      const time = new Date(latestFeed.created_at);
      // data yang siap untuk diprediksi

      const readyPredict = calcMedian(data);
      console.log(readyPredict[1]);
      const predictedValue = await regressionModel.predictAirPollution(readyPredict);
      //menyimpan data baru kedalam dataset
      if(predictedValue){
        // predictedValue[co, pm25]
        await resultPrediction.create({
          jenis:"prediction",
          value:{
            co: parseFloat(predictedValue[1]).toFixed(2),
            pm25: parseFloat(predictedValue[0]).toFixed(2)
          },
          createdAt: time
        });
        const newDataPoint = new dataset({
          value: {
            co: parseFloat(readyPredict[1]),
            pm25: parseFloat(readyPredict[2]),
            temperature: parseFloat(readyPredict[3]),
            humidity: parseFloat(readyPredict[4]),
            windSpeed: parseFloat(readyPredict[5])
          },
          timestamp: time,
          hours: latestHour
        });
        await newDataPoint.save();
      }
    }
  }catch(error){
    console.error('Terjadi kesalahan saat pengambilan data atau menyimpan data');
    throw error;
  }
}