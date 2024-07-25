const jwt = require('jsonwebtoken');

const requireAuth = (req, res, next) => {
    const token = req.cookies.jwt;

    if(token){
        jwt.verify(token, 'AirMind secret key', (error, decodedToken) => {
            if(error){
                console.log(error.message);
                res.redirect('/signIn');
            }else{
                req.user = decodedToken;
                console.log(decodedToken);
                next();
            }
        });
    }else{
        res.redirect('/signIn');
    }
}

module.exports = requireAuth;