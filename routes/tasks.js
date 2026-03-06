// routes/tasks.js
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { isAuthenticated } = require('../middleware/auth');

// Все роуты задач требуют авторизации
router.use(isAuthenticated);

// Получение всех задач
router.get('/', taskController.getTasks);

// Получение статистики
router.get('/stats', taskController.getStats);

// Получение корневых задач (для выпадающего списка)
router.get('/root', taskController.getRootTasks);

// Получение конкретной задачи
router.get('/:id', taskController.getTask);

// Создание задачи
router.post('/', taskController.createTask);

// Переключение статуса задачи
router.put('/:id/toggle', taskController.toggleTask);

// Удаление задачи
router.delete('/:id', taskController.deleteTask);

module.exports = router;