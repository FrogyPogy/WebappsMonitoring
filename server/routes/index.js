const express = require('express');
const router = express.Router();
const mainController = require('../controllers/mainController');
const adminController = require('../controllers/adminController');
const loginController = require('../controllers/loginController');
const requireAuth = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

/** Routes app*/
router.get('/',mainController.homepage);
router.get('/about',mainController.about);
router.get('/contact', mainController.contact);
//router intializeDataset
router.get('/initialize',mainController.initializeData);
//Route menampilkan hasil prediksi terbaru
router.get('/getPrediction', mainController.getPrediction);
//Route fetch data real-time dari thingspeak ke dashboard
router.get('/data', mainController.getData);
//Route initialisasi model pertama regresi pm25 dan co
router.get('/initializeModel',requireAuth,mainController.initializeModel);
router.get('/updateModel', requireAuth, mainController.updateModel);
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
router.delete('/deleteDataset', requireAuth, adminController.deleteDataset);

//Route menampilkan seluruh hasil prediksi
router.get('/prediction', requireAuth, adminController.displayPrediction);
router.delete('/deletePrediction', requireAuth, adminController.deletePrediction);

//Route menampilkan semua data pollution yang disimpan dalam satuan jam
router.get('/getDataSaved', requireAuth, adminController.getDataSaved);
//Route menampilkan evaluation performance model
router.get('/evaluation', requireAuth, adminController.getEvaluation);
router.post('/runEvaluation', requireAuth, adminController.runEvaluation);
router.delete('/deleteModel', requireAuth, adminController.deleteModel);

//Route membackup dataset yang telah disimpan
router.get('/backup', requireAuth, adminController.backupData);
router.get('/backup/Datasetjson', requireAuth, adminController.downloadDatasetJson);
router.get('/backup/Predictionjson', requireAuth, adminController.downloadPredictionJson);
router.get('/backup/Datasetcsv', requireAuth, adminController.downloadDatasetCsv);
router.get('/backup/Predictioncsv', requireAuth, adminController.downloadPredictionCsv);

//Route upload Dataset, datatest dan data train
router.get('/uploadData', requireAuth, adminController.uploadData);
router.post('/uploadData', requireAuth, upload.single('dataset'), adminController.uploadDataset);
router.post('/uploadDatatest',requireAuth, upload.single('dataset-test'), adminController.uploadDatatest);

module.exports = router;