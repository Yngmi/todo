// test-models.js
const { User, Task } = require('./models');
const { initializeDatabase } = require('./config/database');

async function testModels() {
    try {
        // Инициализируем БД
        await initializeDatabase();
        
        // Создаем тестового пользователя
        const userId = await User.create({
            login: 'testuser',
            password: '123456',
            full_name: 'Тестовый Пользователь',
            phone: '+1234567890'
        });
        console.log('Создан пользователь с ID:', userId);
        
        // Проверяем вход
        const user = await User.checkPassword('testuser', '123456');
        console.log('Проверка пароля:', user ? 'успешно' : 'неудачно');
        
        // Создаем тестовые задачи
        const task1Id = await Task.create({
            user_id: userId,
            title: 'Сварить суп',
            description: 'Приготовить вкусный суп'
        });
        
        const task2Id = await Task.create({
            user_id: userId,
            title: 'Приготовить продукты',
            parent_id: task1Id
        });
        
        await Task.create({
            user_id: userId,
            title: 'Помыть овощи',
            parent_id: task2Id
        });
        
        await Task.create({
            user_id: userId,
            title: 'Нарезать овощи',
            parent_id: task2Id
        });
        
        await Task.create({
            user_id: userId,
            title: 'Разогреть воду',
            parent_id: task1Id
        });
        
        // Получаем дерево задач
        const tasks = await Task.getUserTasks(userId);
        console.log('Дерево задач:', JSON.stringify(tasks, null, 2));
        
        // Получаем статистику
        const stats = await Task.getStats(userId);
        console.log('Статистика:', stats);
        
    } catch (error) {
        console.error('Ошибка тестирования:', error);
    }
}

testModels();