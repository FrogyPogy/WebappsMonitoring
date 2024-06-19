require('dotenv').config();

const express = require('express');
const expresLayouts = require('express-ejs-layouts');
const connectDB = require('./server/config/db');
const schedule = require('./server/utils/scheduler');

const app = express();
const port = 5000 || process.env.port;

app.use(express.urlencoded({extended:true}));
app.use(express.json());

//Connect to Database
connectDB();

// Static Files
app.use(express.static('public'));

// Templating Engine
app.use(expresLayouts);
app.set('layout', './layouts/main');
app.set('view engine', 'ejs');

//Route Handling
app.use('/', require('./server/routes/index'));


// ERROR HANDLING 404
app.get('*', function(req, res){
    res.status(404).render('404')
});

app.listen(port, () => {
    console.log(`App Listening on port ${port}`);
    schedule.start();
});

