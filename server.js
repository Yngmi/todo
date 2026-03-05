// server.js
const express = require('express');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const path = require('path');
const dotenv = require('dotenv');
const hbs = require('hbs');

// Загружаем переменные окружения из .env файла
dotenv.config();

// Создаем экземпляр приложения Express
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// НАСТРОЙКА HANDLEBARS (HBS)
// ============================================
// Указываем, что шаблоны будут с расширением .hbs
app.set('view engine', 'hbs');
// Указываем папку с шаблонами
app.set('views', path.join(__dirname, 'views'));
// Регистрируем папку с частичными шаблонами (partials)
// Partials - это переиспользуемые кусочки кода (например, шапка сайта)
hbs.registerPartials(path.join(__dirname, 'views', 'partials'));

// ============================================
// НАСТРОЙКА MIDDLEWARE
// ============================================
// Middleware для обработки данных из форм (URL-encoded)
app.use(express.urlencoded({ extended: true }));
// Middleware для обработки JSON данных
app.use(express.json());
// Раздаем статические файлы из папки public (CSS, JS клиентский)
app.use(express.static(path.join(__dirname, 'public')));

// ============================================
// НАСТРОЙКА СЕССИЙ
// ============================================
// Используем файловое хранилище для сессий
// Это значит, что сессии хранятся в файлах на сервере
// При перезапуске сервера сессии НЕ сохраняются (как и требуется в задании)
app.use(session({
  store: new FileStore({
    // Папка для хранения файлов сессий
    path: path.join(__dirname, 'sessions'),
    // Сколько раз повторять попытку чтения файла
    retries: 0,
    // Время жизни сессии в секундах (86400 = 24 часа)
    ttl: 86400,
  }),
  // Секретный ключ для подписи сессии (из .env)
  secret: process.env.SESSION_SECRET,
  // Не сохранять сессию, если она не изменилась
  resave: false,
  // Не создавать сессию автоматически для каждого запроса
  saveUninitialized: false,
  // Настройки cookie
  cookie: {
    // Время жизни cookie (24 часа)
    maxAge: 24 * 60 * 60 * 1000,
    // Cookie доступны только через HTTP (не через JavaScript)
    httpOnly: true,
    // В разработке можно false, в продакшне должно быть true (HTTPS)
    secure: false
  }
}));

// ============================================
// ПОДКЛЮЧЕНИЕ К БАЗЕ ДАННЫХ
// ============================================
const { initializeDatabase } = require('./config/database');
// Инициализируем базу данных (создаем таблицы, если их нет)
initializeDatabase().catch(console.error);

// ============================================
// ПОДКЛЮЧЕНИЕ РОУТОВ
// ============================================
// Роуты для авторизации (логин, регистрация, выход)
app.use('/auth', require('./routes/auth'));
// Роуты для работы с задачами
app.use('/tasks', require('./routes/tasks'));

// ============================================
// ГЛАВНАЯ СТРАНИЦА
// ============================================
app.get('/', (req, res) => {
  // Если пользователь авторизован, отправляем на меню
  if (req.session.userId) {
    res.redirect('/menu');
  } else {
    // Иначе на страницу логина
    res.redirect('/auth/login');
  }
});

// ============================================
// СТРАНИЦА МЕНЮ (ЗАЩИЩЕННАЯ)
// ============================================
// Подключаем middleware для проверки авторизации
const { isAuthenticated } = require('./middleware/auth');
// Добавляем middleware для предотвращения кэширования
const { preventCache } = require('./middleware/auth');

app.get('/menu', isAuthenticated, preventCache, (req, res) => {
  // Рендерим шаблон menu.hbs и передаем в него данные
  res.render('menu', { 
    title: 'Главное меню',
    // Используем для скрипта на странице
    script: 'tasks',
    // Данные пользователя из сессии
    user: req.session.user 
  });
});

// ============================================
// ЗАПУСК СЕРВЕРА
// ============================================
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
  console.log(`📁 Режим: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 База данных: ${process.env.DB_NAME}`);
});

// ============================================
// ОБРАБОТКА ОШИБОК
// ============================================
app.use((err, req, res, next) => {
  console.error('❌ Ошибка:', err.stack);
  res.status(500).send('Что-то пошло не так!');
});