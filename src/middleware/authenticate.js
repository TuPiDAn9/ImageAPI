const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1]; // Извлекаем токен после "Bearer "
    const fixedToken = process.env.JWT_TOKEN; // Фиксированный токен из переменной окружения

    if (token !== fixedToken) {
        return res.status(403).json({ message: 'Invalid token.' });
    }

    next();
};

module.exports = authenticateToken;