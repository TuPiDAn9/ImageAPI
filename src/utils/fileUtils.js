const fs = require('fs').promises;
const path = require('path');
const { v4: uuid } = require('uuid');

const saveFile = async (file) => {
    const uploadDir = path.join(__dirname, '..', '..', 'uploads');
    const uniqueName = `${uuid()}-${file.name}`;
    const uploadPath = path.join(uploadDir, uniqueName);
    const publicPath = `/uploads/${uniqueName}`;

    try {
        // Проверяем, существует ли папка, и создаём её, если нужно
        await fs.mkdir(uploadDir, { recursive: true });

        // Перемещаем файл
        await file.mv(uploadPath);

        return publicPath;
    } catch (err) {
        console.error('Error saving file:', err);
        throw new Error('File save failed.');
    }
};

module.exports = { saveFile };
