const express = require('express');
const router = express.Router();
const mainController = require('../controllers/mainController');
const adminController = require('../controllers/adminController');
const loginController = require('../controllers/loginController');

/** Routes app*/
router.get('/',mainController.homepage);
router.get('/about',mainController.about);
//router intializeDataset
router.get('/initialize',mainController.initializeData);
//Route menampilkan hasil prediksi
router.get('/prediction', mainController.displayPrediction);
//Route menampilkan hasil prediksi terbaru
router.get('/getPrediction', mainController.getPrediction);
//Route fetch data real-time dari thingspeak ke dashboard
router.get('/data', mainController.getData);
//Route initialisasi model pertama regresi pm25 dan co
router.get('/initializeModel',mainController.initializeModel);
//Route signIn
router.get('/signIn',loginController.signInPage);
router.post('/signIn',loginController.checkAuth);
//Route signUp
router.post('/signUp',loginController.createUser);
router.get('/signUp',loginController.signUpPage);



module.exports = router;