"use strict";
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем, есть ли сохраненный вход
    const savedUser = localStorage.getItem('library_user');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        if (user.role === 'reader') {
            window.location.href = 'reader-cabinet.html';
        }
        else if (user.role === 'librarian') {
            window.location.href = 'librarian-cabinet.html';
        }
    }
    const readerTab = document.querySelector('[data-role="reader"]');
    const librarianTab = document.querySelector('[data-role="librarian"]');
    const readerForm = document.getElementById('reader-form');
    const librarianForm = document.getElementById('librarian-form');
    const readerLoginBtn = document.getElementById('reader-login-btn');
    const librarianLoginBtn = document.getElementById('librarian-login-btn');
    if (readerTab && librarianTab && readerForm && librarianForm) {
        readerTab.addEventListener('click', () => {
            readerTab.classList.add('active');
            librarianTab.classList.remove('active');
            readerForm.style.display = 'block';
            librarianForm.style.display = 'none';
        });
        librarianTab.addEventListener('click', () => {
            librarianTab.classList.add('active');
            readerTab.classList.remove('active');
            readerForm.style.display = 'none';
            librarianForm.style.display = 'block';
        });
    }
    // Вход читателя
    readerLoginBtn?.addEventListener('click', async () => {
        const name = document.getElementById('reader-name').value.trim();
        const phone = document.getElementById('reader-phone').value.trim();
        if (!name) {
            alert('Введите ваше имя');
            return;
        }
        if (!phone) {
            alert('Введите номер телефона');
            return;
        }
        // Сохраняем читателя
        try {
            const response = await fetch(`${API_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone, role: 'reader' })
            });
            const user = await response.json();
            localStorage.setItem('library_user', JSON.stringify({
                id: user.id,
                name: user.name,
                phone: user.phone,
                role: user.role
            }));
            window.location.href = 'reader-cabinet.html';
        }
        catch (error) {
            console.error('Ошибка входа:', error);
            alert('Ошибка при входе. Попробуйте позже.');
        }
    });
    // Вход библиотекаря
    librarianLoginBtn?.addEventListener('click', async () => {
        const login = document.getElementById('librarian-login').value;
        const password = document.getElementById('librarian-password').value;
        try {
            const response = await fetch(`${API_URL}/librarian/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login, password })
            });
            if (!response.ok) {
                const error = await response.json();
                alert(error.error || 'Ошибка входа');
                return;
            }
            const librarian = await response.json();
            const userData = {
                id: librarian.id,
                name: librarian.name,
                phone: '',
                role: 'librarian'
            };
            localStorage.setItem('library_user', JSON.stringify(userData));
            window.location.href = 'librarian-cabinet.html';
        }
        catch (error) {
            console.error('Ошибка входа:', error);
            alert('Ошибка при входе');
        }
    });
});
//# sourceMappingURL=login.js.map