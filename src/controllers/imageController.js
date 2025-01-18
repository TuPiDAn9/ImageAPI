const db = require('../../config/db');
const { saveFile } = require('../utils/fileUtils');
const path = require('path');
const fs = require('fs').promises;

const uploadImage = async (req, res) => {
    try {
        const image = req.files.image;
        const publicPath = await saveFile(image);

        const query = 'INSERT INTO images (name, path) VALUES (?, ?)';
        db.query(query, [image.name, publicPath], (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).send('Database error.');
            }
            res.send({
                message: 'Image uploaded successfully!',
                imageId: result.insertId,
                imagePath: publicPath,
            });
        });
    } catch (err) {
        console.error('File upload error:', err);
        res.status(500).send('File upload error.');
    }
};

// Метод для загрузки Base64-данных
const uploadBase64 = async (req, res) => {
    try {
        const { data } = req.body; // Ожидаем поле "data" с Base64

        // Проверка, что данные были переданы
        if (!data) {
            return res.status(400).json({ message: 'No Base64 data provided.' });
        }

        // Вставка Base64-данных в таблицу base64_data
        const query = 'INSERT INTO base64_data (data) VALUES (?)';
        db.query(query, [data], (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).send('Database error.');
            }
            res.status(200).json({ message: 'Base64 data uploaded successfully!', id: result.insertId });
        });
    } catch (err) {
        console.error('Base64 upload error:', err);
        res.status(500).send('Base64 upload error.');
    }
};

// Метод для получения Base64-данных
const getBase64Data = (req, res) => {
    const query = 'SELECT * FROM base64_data';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Database error.');
        }

        res.status(200).json(results);
    });
};

const getImages = (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const query = 'SELECT * FROM images LIMIT ? OFFSET ?';
    db.query(query, [limit, offset], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Database error.');
        }
        res.send(results);
    });
};

const deleteImage = async (req, res) => {
    const imageId = req.params.id;

    try {
        const selectQuery = 'SELECT path FROM images WHERE id = ?';
        db.query(selectQuery, [imageId], async (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).send('Database error.');
            }
            if (results.length === 0) {
                return res.status(404).send('Image not found.');
            }

            const filePath = path.join(__dirname, '..', '..', results[0].path);
            try {
                await fs.unlink(filePath);
            } catch (err) {
                console.error('Error deleting file:', err.message);
            }

            const deleteQuery = 'DELETE FROM images WHERE id = ?';
            db.query(deleteQuery, [imageId], (err) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).send('Database error.');
                }
                res.send({ message: 'Image deleted successfully!' });
            });
        });
    } catch (err) {
        console.error('File deletion error:', err);
        res.status(500).send('File deletion error.');
    }
};

module.exports = { uploadImage, getImages, deleteImage, uploadBase64, getBase64Data };