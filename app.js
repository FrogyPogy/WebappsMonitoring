require('dotenv').config();

const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const connectDB = require('./server/config/db');
const schedule = require('./server/utils/scheduler');
const cookieParser = require('cookie-parser');
const session = require('express-session');

//middleware for flash error or success message
const flash = require('connect-flash');

const app = express();
const port = 5000 || process.env.port;

app.use(express.urlencoded({extended:true}));
app.use(express.json());

//Connect to Database
connectDB();

app.use(session({
    secret: 'flash_msg',
    resave: false,
    saveUninitialized: true,
    cookie: {maxAge: 60000} // 1 minute age
}));

// middleware
app.use(express.static('public'));
app.use(cookieParser());
app.use(flash());

//global variable for flash message
app.use((req, res, next) =>{
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    next();
});

// Templating Engine
app.use(expressLayouts);
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

