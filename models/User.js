// models/User.js
const { pool } = require('../config/database');
const crypto = require('crypto');

class User {
    /**
     * Хеширование пароля с использованием SHA256
     * ВНИМАНИЕ: Для продакшена лучше использовать bcrypt
     * Но для учебного проекта SHA256 подойдет
     */
    static hashPassword(password) {
        return crypto.createHash('sha256').update(password).digest('hex');
    }

    /**
     * Создание нового пользователя
     * @param {Object} userData - данные пользователя
     * @returns {number} id созданного пользователя
     */
    static async create(userData) {
        const { login, password, full_name, phone } = userData;
        
        // Проверяем, что все обязательные поля заполнены
        if (!login || !password || !full_name) {
            throw new Error('Логин, пароль и ФИО обязательны для заполнения');
        }

        const hashedPassword = this.hashPassword(password);
        
        try {
            const [result] = await pool.execute(
                'INSERT INTO users (login, password, full_name, phone) VALUES (?, ?, ?, ?)',
                [login, hashedPassword, full_name, phone || null]
            );
            
            console.log(`✅ Создан новый пользователь с ID: ${result.insertId}`);
            return result.insertId;
        } catch (error) {
            // Обрабатываем ошибку уникальности логина
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Пользователь с таким логином уже существует');
            }
            throw error;
        }
    }

    /**
     * Поиск пользователя по логину
     * @param {string} login - логин пользователя
     * @returns {Object|null} данные пользователя или null
     */
    static async findByLogin(login) {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE login = ?',
            [login]
        );
        return rows[0] || null;
    }

    /**
     * Поиск пользователя по ID
     * @param {number} id - ID пользователя
     * @returns {Object|null} данные пользователя или null
     */
    static async findById(id) {
        const [rows] = await pool.execute(
            'SELECT id, login, full_name, phone, created_at FROM users WHERE id = ?',
            [id]
        );
        return rows[0] || null;
    }

    /**
     * Проверка логина и пароля
     * @param {string} login - логин
     * @param {string} password - пароль
     * @returns {Object|null} данные пользователя (без пароля) или null
     */
    static async checkPassword(login, password) {
        // Ищем пользователя по логину
        const user = await this.findByLogin(login);
        
        // Если пользователь не найден
        if (!user) {
            return null;
        }
        
        // Хешируем введенный пароль и сравниваем с хранящимся
        const hashedPassword = this.hashPassword(password);
        
        if (user.password === hashedPassword) {
            // Удаляем пароль из возвращаемых данных
            const { password, ...userWithoutPassword } = user;
            console.log(`✅ Пользователь ${login} успешно авторизован`);
            return userWithoutPassword;
        }
        
        return null;
    }

    /**
     * Обновление данных пользователя
     * @param {number} id - ID пользователя
     * @param {Object} userData - новые данные
     * @returns {boolean} успешность операции
     */
    static async update(id, userData) {
        const { full_name, phone } = userData;
        
        const [result] = await pool.execute(
            'UPDATE users SET full_name = ?, phone = ? WHERE id = ?',
            [full_name, phone, id]
        );
        
        return result.affectedRows > 0;
    }

    /**
     * Изменение пароля
     * @param {number} id - ID пользователя
     * @param {string} newPassword - новый пароль
     * @returns {boolean} успешность операции
     */
    static async changePassword(id, newPassword) {
        const hashedPassword = this.hashPassword(newPassword);
        
        const [result] = await pool.execute(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, id]
        );
        
        return result.affectedRows > 0;
    }

    /**
     * Удаление пользователя
     * @param {number} id - ID пользователя
     * @returns {boolean} успешность операции
     */
    static async delete(id) {
        const [result] = await pool.execute(
            'DELETE FROM users WHERE id = ?',
            [id]
        );
        
        return result.affectedRows > 0;
    }
}

module.exports = User;