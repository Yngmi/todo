// models/Task.js
const { pool } = require('../config/database');

class Task {
    /**
     * Создание новой задачи
     * @param {Object} taskData - данные задачи
     * @returns {number} id созданной задачи
     */
    static async create(taskData) {
        const { user_id, title, description, parent_id = null } = taskData;
        
        // Проверка обязательных полей
        if (!user_id || !title) {
            throw new Error('ID пользователя и название задачи обязательны');
        }

        try {
            const [result] = await pool.execute(
                'INSERT INTO tasks (user_id, title, description, parent_id) VALUES (?, ?, ?, ?)',
                [user_id, title, description || null, parent_id]
            );
            
            console.log(`✅ Создана новая задача с ID: ${result.insertId}`);
            return result.insertId;
        } catch (error) {
            console.error('Ошибка при создании задачи:', error);
            throw error;
        }
    }

    /**
     * Получение всех задач пользователя в виде дерева
     * @param {number} userId - ID пользователя
     * @returns {Array} дерево задач
     */
    static async getUserTasks(userId) {
        try {
            // Получаем все задачи пользователя
            const [rows] = await pool.execute(
                'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC',
                [userId]
            );
            
            // Преобразуем плоский список в дерево
            // Сначала создаем объект для быстрого доступа к задачам по ID
            const taskMap = {};
            const roots = [];
            
            // Заполняем taskMap и добавляем каждому задаче массив для подзадач
            rows.forEach(task => {
                task.subtasks = [];
                taskMap[task.id] = task;
            });
            
            // Распределяем задачи по родителям
            rows.forEach(task => {
                if (task.parent_id && taskMap[task.parent_id]) {
                    // Если есть родитель, добавляем в его подзадачи
                    taskMap[task.parent_id].subtasks.push(task);
                } else if (!task.parent_id) {
                    // Если нет родителя, это корневая задача
                    roots.push(task);
                }
            });
            
            // Рекурсивно сортируем подзадачи (новые сверху)
            const sortSubtasks = (tasks) => {
                tasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                tasks.forEach(task => {
                    if (task.subtasks.length > 0) {
                        sortSubtasks(task.subtasks);
                    }
                });
            };
            
            sortSubtasks(roots);
            return roots;
        } catch (error) {
            console.error('Ошибка при получении задач:', error);
            throw error;
        }
    }

    /**
     * Получение конкретной задачи по ID
     * @param {number} taskId - ID задачи
     * @param {number} userId - ID пользователя (для проверки принадлежности)
     * @returns {Object|null} задача или null
     */
    static async findById(taskId, userId) {
        const [rows] = await pool.execute(
            'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
            [taskId, userId]
        );
        return rows[0] || null;
    }

    /**
     * Получение всех корневых задач (без родителя)
     * @param {number} userId - ID пользователя
     * @returns {Array} список корневых задач
     */
    static async getRootTasks(userId) {
        const [rows] = await pool.execute(
            'SELECT * FROM tasks WHERE user_id = ? AND parent_id IS NULL ORDER BY created_at DESC',
            [userId]
        );
        return rows;
    }

    /**
     * Переключение статуса задачи (выполнено/не выполнено)
     * @param {number} taskId - ID задачи
     * @param {number} userId - ID пользователя
     * @returns {boolean} успешность операции
     */
    static async toggleComplete(taskId, userId) {
        try {
            // Начинаем транзакцию, чтобы обновить и родителя, если все подзадачи выполнены
            const connection = await pool.getConnection();
            await connection.beginTransaction();
            
            try {
                // Переключаем статус задачи
                const [result] = await connection.execute(
                    'UPDATE tasks SET is_completed = NOT is_completed WHERE id = ? AND user_id = ?',
                    [taskId, userId]
                );
                
                if (result.affectedRows === 0) {
                    await connection.rollback();
                    connection.release();
                    return false;
                }
                
                // Получаем обновленную задачу
                const [updatedTask] = await connection.execute(
                    'SELECT * FROM tasks WHERE id = ?',
                    [taskId]
                );
                
                // Если задача стала выполненной, проверяем родителя
                if (updatedTask[0].is_completed) {
                    await this.checkAndUpdateParentStatus(updatedTask[0].parent_id, userId, connection);
                }
                
                await connection.commit();
                connection.release();
                return true;
            } catch (error) {
                await connection.rollback();
                connection.release();
                throw error;
            }
        } catch (error) {
            console.error('Ошибка при переключении статуса:', error);
            throw error;
        }
    }

    /**
     * Проверка и обновление статуса родительской задачи
     * Если все подзадачи выполнены, родитель тоже выполняется
     */
    static async checkAndUpdateParentStatus(parentId, userId, connection) {
        if (!parentId) return;
        
        // Получаем все подзадачи родителя
        const [subtasks] = await connection.execute(
            'SELECT COUNT(*) as total, SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed FROM tasks WHERE parent_id = ?',
            [parentId]
        );
        
        // Если все подзадачи выполнены, помечаем родителя как выполненного
        if (subtasks[0].total === subtasks[0].completed) {
            await connection.execute(
                'UPDATE tasks SET is_completed = TRUE WHERE id = ? AND user_id = ?',
                [parentId, userId]
            );
            
            // Рекурсивно проверяем родителя этой задачи
            const [parent] = await connection.execute(
                'SELECT parent_id FROM tasks WHERE id = ?',
                [parentId]
            );
            
            if (parent[0].parent_id) {
                await this.checkAndUpdateParentStatus(parent[0].parent_id, userId, connection);
            }
        }
    }

    /**
     * Обновление задачи
     * @param {number} taskId - ID задачи
     * @param {number} userId - ID пользователя
     * @param {Object} taskData - новые данные
     * @returns {boolean} успешность операции
     */
    static async update(taskId, userId, taskData) {
        const { title, description } = taskData;
        
        const [result] = await pool.execute(
            'UPDATE tasks SET title = ?, description = ? WHERE id = ? AND user_id = ?',
            [title, description, taskId, userId]
        );
        
        return result.affectedRows > 0;
    }

    /**
     * Удаление задачи
     * @param {number} taskId - ID задачи
     * @param {number} userId - ID пользователя
     * @returns {boolean} успешность операции
     */
    static async delete(taskId, userId) {
        try {
            // Получаем задачу для проверки
            const task = await this.findById(taskId, userId);
            if (!task) return false;
            
            // Удаляем задачу (подзадачи удалятся каскадно благодаря FOREIGN KEY)
            const [result] = await pool.execute(
                'DELETE FROM tasks WHERE id = ? AND user_id = ?',
                [taskId, userId]
            );
            
            if (result.affectedRows > 0 && task.parent_id) {
                // Если удалили подзадачу, проверяем статус родителя
                const connection = await pool.getConnection();
                await this.checkAndUpdateParentStatus(task.parent_id, userId, connection);
                connection.release();
            }
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Ошибка при удалении задачи:', error);
            throw error;
        }
    }

    /**
     * Получение статистики по задачам пользователя
     * @param {number} userId - ID пользователя
     * @returns {Object} статистика
     */
    static async getStats(userId) {
        const [rows] = await pool.execute(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN parent_id IS NULL THEN 1 ELSE 0 END) as root_tasks,
                SUM(CASE WHEN parent_id IS NOT NULL THEN 1 ELSE 0 END) as subtasks
            FROM tasks 
            WHERE user_id = ?`,
            [userId]
        );
        
        return rows[0];
    }
}

module.exports = Task;