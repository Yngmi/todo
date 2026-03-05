// public/js/tasks.js
$(document).ready(function() {
    // Инициализация компонентов Materialize
    $('.modal').modal();
    $('select').formSelect();
    $('.sidenav').sidenav();
    
    // Загрузка задач при открытии страницы
    loadTasks();
    
    // Функция загрузки задач (пока заглушка)
    function loadTasks() {
        $('#tasksList').html('<div class="center-align grey-text">Здесь будут ваши задачи</div>');
    }
});