// middleware/auth.js

module.exports = {
  // Middleware для проверки, авторизован ли пользователь
  // Используется для защиты роутов, доступных только авторизованным
  isAuthenticated: (req, res, next) => {
    // Проверяем, есть ли в сессии userId
    if (req.session && req.session.userId) {
      // Пользователь авторизован - пропускаем дальше
      return next();
    }
    // Пользователь не авторизован - отправляем на страницу входа
    res.redirect('/auth/login');
  },

  // Middleware для проверки, НЕ авторизован ли пользователь
  // Используется для страниц логина/регистрации
  isNotAuthenticated: (req, res, next) => {
    // Если пользователь уже авторизован
    if (req.session && req.session.userId) {
      // Отправляем его в меню
      return res.redirect('/menu');
    }
    // Пользователь не авторизован - можно показывать страницу входа
    next();
  },

  // Middleware для предотвращения кэширования страниц браузером
  // Это нужно, чтобы после выхода нельзя было нажать "Назад" и попасть в меню
  preventCache: (req, res, next) => {
    // Устанавливаем заголовки, запрещающие кэширование
    res.set({
      'Cache-Control': 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    next();
  }
};