// public/js/auth.js
$(document).ready(function() {
    // Инициализация компонентов Materialize
    $('.tabs').tabs();
    $('.sidenav').sidenav();
    
    // Обработка формы входа
    $('#loginForm').on('submit', function(e) {
        e.preventDefault();
        
        $.ajax({
            url: '/auth/login',
            method: 'POST',
            data: $(this).serialize(),
            dataType: 'json',
            success: function(response) {
                showMessage(response.message, 'green');
            },
            error: function(xhr) {
                const response = xhr.responseJSON;
                showMessage(response?.message || 'Ошибка сервера', 'red');
            }
        });
    });

    // Обработка формы регистрации
    $('#registerForm').on('submit', function(e) {
        e.preventDefault();
        
        $.ajax({
            url: '/auth/register',
            method: 'POST',
            data: $(this).serialize(),
            dataType: 'json',
            success: function(response) {
                showMessage(response.message, 'green');
            },
            error: function(xhr) {
                const response = xhr.responseJSON;
                showMessage(response?.message || 'Ошибка сервера', 'red');
            }
        });
    });

    // Функция для показа сообщений
    function showMessage(message, color) {
        const $block = $('#messageBlock');
        $block.removeClass('hide').addClass(color).text(message);
        setTimeout(() => $block.addClass('hide'), 3000);
    }
});