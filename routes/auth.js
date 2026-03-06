// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isNotAuthenticated, preventCache } = require('../middleware/auth');

// Страница логина (доступна только неавторизованным)
router.get('/login', isNotAuthenticated, preventCache, authController.showLoginPage);

// Обработка входа
router.post('/login', isNotAuthenticated, authController.login);

// Обработка регистрации
router.post('/register', isNotAuthenticated, authController.register);

// Выход из системы
router.get('/logout', authController.logout);

// Получение данных текущего пользователя (для проверки авторизации)
router.get('/me', authController.getCurrentUser);

module.exports = router;