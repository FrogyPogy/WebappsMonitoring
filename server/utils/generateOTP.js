const generateOTP = async () => {
    try{
        return (otp = `${Math.floor(1000 + Math.random() * 9000)}`);

    }catch{
        throw error;
    }
}
module.exports = generateOTP;