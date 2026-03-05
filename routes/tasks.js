// routes/tasks.js
const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

// Все роуты задач требуют авторизации
router.use(isAuthenticated);

// Временные ответы для теста
router.get('/', (req, res) => {
  res.json({ tasks: [] });
});

router.post('/', (req, res) => {
  res.json({ message: 'Задача создана' });
});

module.exports = router;