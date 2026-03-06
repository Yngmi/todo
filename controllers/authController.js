// controllers/authController.js
const User = require('../models/User');

module.exports = {
    /**
     * Отображение страницы логина
     */
    showLoginPage: (req, res) => {
        res.render('login', { 
            title: 'Авторизация',
            script: 'auth',
            layout: 'layouts/main'
        });
    },

    /**
     * Обработка входа пользователя
     * Ожидает: POST /auth/login с полями login, password
     */
    login: async (req, res) => {
        try {
            const { login, password } = req.body;
            
            // Валидация входных данных
            if (!login || !password) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Заполните все поля' 
                });
            }

            // Проверяем логин и пароль через модель User
            const user = await User.checkPassword(login, password);
            
            if (user) {
                // Сохраняем данные пользователя в сессии
                req.session.userId = user.id;
                req.session.user = user;
                
                // Сохраняем сессию и отправляем ответ
                req.session.save((err) => {
                    if (err) {
                        console.error('Ошибка сохранения сессии:', err);
                        return res.status(500).json({ 
                            success: false, 
                            message: 'Ошибка сервера при сохранении сессии' 
                        });
                    }
                    
                    res.json({ 
                        success: true, 
                        message: 'Успешный вход! Перенаправление...',
                        redirect: '/menu'
                    });
                });
            } else {
                res.status(401).json({ 
                    success: false, 
                    message: 'Неверный логин или пароль' 
                });
            }
        } catch (error) {
            console.error('Ошибка при входе:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Ошибка сервера. Попробуйте позже.' 
            });
        }
    },

    /**
     * Обработка регистрации нового пользователя
     * Ожидает: POST /auth/register с полями login, password, full_name, phone (опционально)
     */
    register: async (req, res) => {
        try {
            const { login, password, full_name, phone } = req.body;
            
            // Валидация обязательных полей
            if (!login || !password || !full_name) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Заполните все обязательные поля (логин, пароль, ФИО)' 
                });
            }

            // Проверка длины пароля (минимум 6 символов)
            if (password.length < 6) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Пароль должен быть не менее 6 символов' 
                });
            }

            // Проверяем, не занят ли логин
            const existingUser = await User.findByLogin(login);
            if (existingUser) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Пользователь с таким логином уже существует' 
                });
            }

            // Создаем нового пользователя
            const userId = await User.create({ 
                login, 
                password, 
                full_name, 
                phone 
            });
            
            // Получаем данные созданного пользователя
            const newUser = await User.findById(userId);
            
            // Автоматически входим после регистрации
            req.session.userId = userId;
            req.session.user = newUser;
            
            req.session.save((err) => {
                if (err) {
                    console.error('Ошибка сохранения сессии:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Ошибка сервера при сохранении сессии' 
                    });
                }
                
                res.json({ 
                    success: true, 
                    message: 'Регистрация успешна! Перенаправление...',
                    redirect: '/menu'
                });
            });
        } catch (error) {
            console.error('Ошибка при регистрации:', error);
            
            // Специальная обработка ошибки уникальности логина
            if (error.message === 'Пользователь с таким логином уже существует') {
                return res.status(400).json({ 
                    success: false, 
                    message: error.message 
                });
            }
            
            res.status(500).json({ 
                success: false, 
                message: 'Ошибка сервера. Попробуйте позже.' 
            });
        }
    },

    /**
     * Выход пользователя из системы
     */
    logout: (req, res) => {
        // Уничтожаем сессию
        req.session.destroy((err) => {
            if (err) {
                console.error('Ошибка при выходе:', err);
            }
            // Очищаем куки и перенаправляем на страницу входа
            res.clearCookie('connect.sid');
            res.redirect('/auth/login');
        });
    },

    /**
     * Получение данных текущего пользователя
     */
    getCurrentUser: (req, res) => {
        if (req.session.user) {
            res.json({ 
                success: true, 
                user: req.session.user 
            });
        } else {
            res.status(401).json({ 
                success: false, 
                message: 'Пользователь не авторизован' 
            });
        }
    }
};