// controllers/taskController.js
const Task = require('../models/Task');

module.exports = {
    /**
     * Получение всех задач пользователя
     * GET /tasks
     */
    getTasks: async (req, res) => {
        try {
            const userId = req.session.userId;
            const tasks = await Task.getUserTasks(userId);
            
            res.json({ 
                success: true, 
                tasks 
            });
        } catch (error) {
            console.error('Ошибка при получении задач:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Ошибка при загрузке задач' 
            });
        }
    },

    /**
     * Создание новой задачи
     * POST /tasks
     * Ожидает: title, description (опционально), parent_id (опционально)
     */
    createTask: async (req, res) => {
        try {
            const { title, description, parent_id } = req.body;
            const userId = req.session.userId;
            
            // Валидация
            if (!title || title.trim() === '') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Название задачи обязательно' 
                });
            }

            // Проверяем, существует ли родительская задача (если указана)
            if (parent_id) {
                const parentTask = await Task.findById(parent_id, userId);
                if (!parentTask) {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Родительская задача не найдена' 
                    });
                }
            }

            // Создаем задачу
            const taskId = await Task.create({
                user_id: userId,
                title: title.trim(),
                description: description || null,
                parent_id: parent_id || null
            });

            // Получаем созданную задачу для ответа
            const newTask = await Task.findById(taskId, userId);
            
            res.json({ 
                success: true, 
                message: 'Задача успешно создана',
                task: newTask
            });
        } catch (error) {
            console.error('Ошибка при создании задачи:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Ошибка при создании задачи' 
            });
        }
    },

    /**
     * Переключение статуса задачи (выполнено/не выполнено)
     * PUT /tasks/:id/toggle
     */
    toggleTask: async (req, res) => {
        try {
            const taskId = req.params.id;
            const userId = req.session.userId;
            
            // Проверяем существование задачи
            const task = await Task.findById(taskId, userId);
            if (!task) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Задача не найдена' 
                });
            }

            // Переключаем статус
            const success = await Task.toggleComplete(taskId, userId);
            
            if (success) {
                // Получаем обновленную задачу
                const updatedTask = await Task.findById(taskId, userId);
                
                // Получаем обновленное дерево задач для возможного обновления интерфейса
                const allTasks = await Task.getUserTasks(userId);
                
                res.json({ 
                    success: true, 
                    message: 'Статус задачи обновлен',
                    task: updatedTask,
                    tasks: allTasks // Отправляем все задачи, чтобы обновить родительские статусы
                });
            } else {
                res.status(500).json({ 
                    success: false, 
                    message: 'Не удалось обновить статус задачи' 
                });
            }
        } catch (error) {
            console.error('Ошибка при переключении статуса:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Ошибка при обновлении статуса задачи' 
            });
        }
    },

    /**
     * Удаление задачи
     * DELETE /tasks/:id
     */
    deleteTask: async (req, res) => {
        try {
            const taskId = req.params.id;
            const userId = req.session.userId;
            
            // Проверяем существование задачи
            const task = await Task.findById(taskId, userId);
            if (!task) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Задача не найдена' 
                });
            }

            // Удаляем задачу
            const success = await Task.delete(taskId, userId);
            
            if (success) {
                // Получаем обновленное дерево задач
                const allTasks = await Task.getUserTasks(userId);
                
                res.json({ 
                    success: true, 
                    message: 'Задача успешно удалена',
                    tasks: allTasks
                });
            } else {
                res.status(500).json({ 
                    success: false, 
                    message: 'Не удалось удалить задачу' 
                });
            }
        } catch (error) {
            console.error('Ошибка при удалении задачи:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Ошибка при удалении задачи' 
            });
        }
    },

    /**
     * Получение конкретной задачи
     * GET /tasks/:id
     */
    getTask: async (req, res) => {
        try {
            const taskId = req.params.id;
            const userId = req.session.userId;
            
            const task = await Task.findById(taskId, userId);
            
            if (task) {
                res.json({ 
                    success: true, 
                    task 
                });
            } else {
                res.status(404).json({ 
                    success: false, 
                    message: 'Задача не найдена' 
                });
            }
        } catch (error) {
            console.error('Ошибка при получении задачи:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Ошибка при загрузке задачи' 
            });
        }
    },

    /**
     * Получение статистики по задачам
     * GET /tasks/stats
     */
    getStats: async (req, res) => {
        try {
            const userId = req.session.userId;
            const stats = await Task.getStats(userId);
            
            res.json({ 
                success: true, 
                stats 
            });
        } catch (error) {
            console.error('Ошибка при получении статистики:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Ошибка при загрузке статистики' 
            });
        }
    },

    /**
     * Получение всех корневых задач (для выпадающего списка)
     * GET /tasks/root
     */
    getRootTasks: async (req, res) => {
        try {
            const userId = req.session.userId;
            const tasks = await Task.getRootTasks(userId);
            
            res.json({ 
                success: true, 
                tasks 
            });
        } catch (error) {
            console.error('Ошибка при получении корневых задач:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Ошибка при загрузке задач' 
            });
        }
    }
};