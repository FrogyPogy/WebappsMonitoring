exports.homepage = async(req, res) => {  //Menerapkan langsung fungsi ke objek exports
    const locals = {
        title: 'AIRMIND',
        description:'Air Pollution Monitoring and Prediction System'
    }
    res.render('index', locals); //rendering index.ejs in views
};

exports.about = async(req, res) => {
    const locals = {
        title:'About - AIRMIND',
        description:'Air Pollution Monitoring and Prediction System'
    }
    res.render('about', locals);
};

