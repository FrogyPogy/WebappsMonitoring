const express = require('express');
const router = express.Router();
const mainController = require('../controllers/mainController');
const adminController = require('../controllers/adminController');
const loginController = require('../controllers/loginController');
const requireAuth = require('../middleware/authMiddleware');

/** Routes app*/
router.get('/',mainController.homepage);
router.get('/about',mainController.about);
//router intializeDataset
router.get('/initialize',mainController.initializeData);
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
//Route signout
router.get('/signOut',loginController.signOut);
//Route admin
router.get('/admin', requireAuth, adminController.dashboard);
//Route menampilkan seluruh hasil prediksi
router.get('/prediction', requireAuth, mainController.displayPrediction);
//Route menampilkan semua data pollution yang disimpan dalam satuan jam
router.get('/getDataSaved', requireAuth, adminController.getDataSaved);
//Route menampilkan evaluation performance model
router.get('/evaluation', requireAuth, adminController.getEvaluation);
//Route membackup dataset yang telah disimpan
router.get('/backup', requireAuth, adminController.backupData);


module.exports = router;