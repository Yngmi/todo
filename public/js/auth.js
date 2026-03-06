// public/js/auth.js
$(document).ready(function() {
    // Инициализация компонентов Materialize
    $('.tabs').tabs();
    $('.sidenav').sidenav();
    
    // Обработка формы входа
    $('#loginForm').on('submit', function(e) {
        e.preventDefault();
        
        // Показываем индикатор загрузки
        const $submitBtn = $(this).find('button[type="submit"]');
        const originalText = $submitBtn.html();
        $submitBtn.html('<i class="material-icons right">hourglass_empty</i> Вход...').prop('disabled', true);
        
        $.ajax({
            url: '/auth/login',
            method: 'POST',
            data: $(this).serialize(),
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    showMessage(response.message, 'green');
                    // Перенаправляем после успешного входа
                    setTimeout(() => {
                        window.location.href = response.redirect;
                    }, 1000);
                } else {
                    showMessage(response.message, 'red');
                    $submitBtn.html(originalText).prop('disabled', false);
                }
            },
            error: function(xhr) {
                const response = xhr.responseJSON;
                showMessage(response?.message || 'Ошибка сервера', 'red');
                $submitBtn.html(originalText).prop('disabled', false);
            }
        });
    });

    // Обработка формы регистрации
    $('#registerForm').on('submit', function(e) {
        e.preventDefault();
        
        // Проверка совпадения паролей (если добавить поле подтверждения)
        const password = $('#reg_password').val();
        // const confirmPassword = $('#reg_confirm_password').val(); // если добавите такое поле
        
        // if (password !== confirmPassword) {
        //     showMessage('Пароли не совпадают', 'red');
        //     return;
        // }
        
        // Проверка длины пароля
        if (password.length < 6) {
            showMessage('Пароль должен быть не менее 6 символов', 'red');
            return;
        }
        
        // Показываем индикатор загрузки
        const $submitBtn = $(this).find('button[type="submit"]');
        const originalText = $submitBtn.html();
        $submitBtn.html('<i class="material-icons right">hourglass_empty</i> Регистрация...').prop('disabled', true);
        
        $.ajax({
            url: '/auth/register',
            method: 'POST',
            data: $(this).serialize(),
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    showMessage(response.message, 'green');
                    // Перенаправляем после успешной регистрации
                    setTimeout(() => {
                        window.location.href = response.redirect;
                    }, 1000);
                } else {
                    showMessage(response.message, 'red');
                    $submitBtn.html(originalText).prop('disabled', false);
                }
            },
            error: function(xhr) {
                const response = xhr.responseJSON;
                showMessage(response?.message || 'Ошибка сервера', 'red');
                $submitBtn.html(originalText).prop('disabled', false);
            }
        });
    });

    // Функция для показа сообщений
    function showMessage(message, color) {
        const $block = $('#messageBlock');
        $block.removeClass('hide red green').addClass(color).text(message);
        
        // Показываем блок
        $block.removeClass('hide');
        
        // Автоматически скрываем через 3 секунды
        setTimeout(() => {
            $block.addClass('hide');
        }, 3000);
    }

    // Если есть параметры в URL (например, после выхода)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('registered') === 'success') {
        showMessage('Регистрация успешна! Теперь вы можете войти.', 'green');
    }
});