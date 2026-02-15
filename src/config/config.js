const dotenv = require('dotenv').config();

dotenv.config();
const config = {
    PORT:process.env.PORT || 8000,
    MONGODB_URI:process.env.MONGODB_URI,
    JWT_SECRET:process.env.JWT_SECRET,
    JWT_EXPIRATION:process.env.JWT_EXPIRATION,
    CORS_ORIGIN:process.env.CORS_ORIGIN,
    FRONTEND_BASE_URL:process.env.FRONTEND_BASE_URL,
    API_BASE_URL:process.env.API_BASE_URL
}

module.exports = config;
