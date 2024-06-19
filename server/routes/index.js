const express = require('express');
const router = express.Router();
const mainController = require('../controllers/mainController');

/** Routes app*/
router.get('/',mainController.homepage);
router.get('/about',mainController.about);
//router intializeDataset
router.get('/initialize',mainController.initializeData);
//Route menampilkan hasil prediksi
router.get('/prediction', mainController.displayPrediction);
router.get('/data', mainController.getData);

module.exports = router;