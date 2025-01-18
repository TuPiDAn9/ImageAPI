const express = require('express');
const { uploadImage, getImages, deleteImage, uploadBase64, getBase64Data } = require('../controllers/imageController');
const authenticateToken = require('../middleware/authenticate');
const router = express.Router();

router.post('/upload', authenticateToken, uploadImage);
router.post('/upload-base64', authenticateToken, uploadBase64); // Загрузка Base64
router.get('/base64-data', authenticateToken, getBase64Data); // Получение Base64
router.get('/images', authenticateToken, getImages);
router.delete('/images/:id', authenticateToken, deleteImage);

module.exports = router;