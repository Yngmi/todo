// config/database.js
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// Создаем пул соединений с базой данных
// Пул позволяет эффективно управлять множеством соединений
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Ждать свободное соединение, если все заняты
  waitForConnections: true,
  // Максимальное количество соединений в пуле
  connectionLimit: 10,
  // Максимальное количество запросов в очереди
  queueLimit: 0
});

// Функция для инициализации базы данных
// Создает таблицы, если их еще нет
async function initializeDatabase() {
  let connection;
  try {
    // Получаем соединение из пула
    connection = await pool.getConnection();
    console.log('✅ Успешно подключено к MySQL');

    // ============================================
    // СОЗДАНИЕ ТАБЛИЦЫ ПОЛЬЗОВАТЕЛЕЙ
    // ============================================
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        login VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Таблица users создана или уже существует');

    // ============================================
    // СОЗДАНИЕ ТАБЛИЦЫ ЗАДАЧ
    // ============================================
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        parent_id INT DEFAULT NULL,
        is_completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        -- Внешний ключ: задача привязана к пользователю
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        -- Внешний ключ для подзадач (ссылка на родительскую задачу)
        FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE CASCADE,
        -- Индексы для быстрого поиска
        INDEX idx_user (user_id),
        INDEX idx_parent (parent_id)
      )
    `);
    console.log('✅ Таблица tasks создана или уже существует');

    console.log('🎉 База данных успешно инициализирована!');
  } catch (error) {
    console.error('❌ Ошибка при инициализации базы данных:');
    console.error(error);
    // Завершаем процесс, так как без БД приложение работать не может
    process.exit(1);
  } finally {
    // Всегда освобождаем соединение, даже если была ошибка
    if (connection) connection.release();
  }
}

module.exports = { pool, initializeDatabase };