// routes/auth.js
const express = require('express');
const router = express.Router();
const { isNotAuthenticated } = require('../middleware/auth');

// Страница логина (пока просто заглушка)
router.get('/login', isNotAuthenticated, (req, res) => {
  res.render('login', { 
    title: 'Авторизация',
    script: 'auth',
    layout: 'layouts/main'
  });
});

// Временный ответ для теста
router.post('/login', (req, res) => {
  res.json({ message: 'Логин работает' });
});

router.post('/register', (req, res) => {
  res.json({ message: 'Регистрация работает' });
});

router.get('/logout', (req, res) => {
  res.redirect('/auth/login');
});

module.exports = router;