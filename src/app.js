require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const fileUpload = require('express-fileupload');
const morgan = require('morgan');
const cors = require('cors');
const imageRoutes = require('./routes/imageRoutes');
const errorHandler = require('./middleware/errorHandler');
const fs = require('fs');
const path = require('path');

const accessLogStream = fs.createWriteStream(path.join(__dirname, '..', 'logs', 'access.log'), { flags: 'a' });
const blockedIpsPath = path.join(__dirname, '..', 'blocked_ips.txt');

const app = express();
const uploadDir = path.resolve(__dirname, '../uploads');
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 50, // Лимит запросов с одного IP
});
const allowedOrigins = ['https://your_domain.com'];
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true); // Разрешаем запрос
        } else {
            callback(new Error('Not allowed by CORS')); // Отклоняем запрос
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Разрешённые HTTP-методы
    credentials: true, // Для работы с куки или авторизацией
};
const getBlockedIps = () => {
    try {
        const data = fs.readFileSync(blockedIpsPath, 'utf-8');
        return data.split('\n').map(ip => ip.trim()).filter(ip => ip); // Убираем пустые строки
    } catch (err) {
        console.error('Error reading blocked IPs file:', err);
        return [];
    }
};

// Создание папки для загрузок
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Установка прав 775 на папку uploads
try {
    fs.chmodSync(uploadDir, 0o775);
    console.log('Permissions for uploads directory set to 775.');
} catch (err) {
    console.error('Failed to set permissions for uploads directory:', err);
}

// Middleware
app.use(morgan(':date[clf] :remote-addr :method :status :url :response-time ms'));
app.use(morgan(':date[clf] :remote-addr :method :status :url :response-time ms', {
    stream: accessLogStream,
    skip: (req) => getBlockedIps().includes(req.ip), // Пропускаем логирование для заблокированных IP
}));
app.use(express.json({ limit: '100mb' })); // Для JSON
app.use(express.text({ limit: '100mb' })); // Для текстовых данных (например, Base64)
app.use(cors(corsOptions));
app.use((req, res, next) => {
    const allowedHost = 'YOUR_HOST';
    if (req.hostname !== allowedHost) {
        return res.status(403).send('Access denied: Invalid host');
    }
    next();
});
app.use(fileUpload({
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
    useTempFiles: true,
    tempFileDir: path.join(__dirname, '../tmp'), // Временная папка для загрузок
}));
app.use((req, res, next) => {
    const clientIp = req.ip; // Получаем IP-адрес клиента
    const blockedIps = getBlockedIps();

    if (blockedIps.includes(clientIp)) {
        // Если IP заблокирован, просто завершаем запрос без логирования
        return res.status(403).send('Access denied: Your IP is blocked.');
    }

    next(); // Продолжаем обработку запроса
});
app.use(limiter);
app.use('/uploads', express.static(uploadDir));

// Маршруты
app.use(imageRoutes);
app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'favicon.ico'));
});
app.get('/docs', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'docs.html'));
});

// Обработка ошибок
app.use(errorHandler);

// Запуск сервера
const port = process.env.PORT || 30003;
app.listen(port, () => {
    console.log(`API running at http://localhost:${port}`);
});
