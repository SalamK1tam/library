"use strict";
document.body.classList.add('librarian');
// Получение всех уникальных пользователей из localStorage
function getAllUsers() {
    return JSON.parse(localStorage.getItem('library_users') || '[]');
}
// Получение данных пользователя по телефону
function getUserBooks(phone) {
    const reservations = JSON.parse(localStorage.getItem(`reservations_${phone}`) || '[]');
    const favorites = JSON.parse(localStorage.getItem(`favorites_${phone}`) || '[]');
    const activeLoans = JSON.parse(localStorage.getItem(`loans_${phone}`) || '[]');
    return { reservations, favorites, activeLoans };
}
// Сохранение данных пользователя
function saveUserBooks(phone, type, data) {
    localStorage.setItem(`${type}_${phone}`, JSON.stringify(data));
}
async function renderUserList() {
    const container = document.getElementById('user-list');
    if (!container)
        return;
    const users = getAllUsers();
    if (users.length === 0) {
        container.innerHTML = '<div class="no-items">Нет зарегистрированных пользователей</div>';
        return;
    }
    container.innerHTML = users.map(user => `
        <div class="user-item" data-phone="${user.phone}">
            <div class="user-item-info">
                <div class="user-name">${user.name}</div>
                <div class="user-phone">${user.phone}</div>
            </div>
            <button class="user-select-btn" data-phone="${user.phone}">Выбрать</button>
        </div>
    `).join('');
    // Обработчики только на кнопки
    document.querySelectorAll('.user-select-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const phone = btn.getAttribute('data-phone');
            document.querySelectorAll('.user-item').forEach(i => i.classList.remove('active'));
            document.querySelectorAll('.user-select-btn').forEach(b => b.classList.remove('active'));
            // Добавляем активный класс выбранной кнопке и её родителю
            const userItem = btn.closest('.user-item');
            if (userItem)
                userItem.classList.add('active');
            btn.classList.add('active');
            if (phone) {
                await renderUserDetails(phone);
            }
        });
    });
}
async function renderUserDetails(phone) {
    const allBooks = await loadBooks();
    const userBooks = getUserBooks(phone);
    // Вкладка бронирования
    const reservationsContainer = document.getElementById('reservations-list');
    if (reservationsContainer) {
        const reservationBooks = allBooks.filter(book => userBooks.reservations.includes(book.id));
        if (reservationBooks.length === 0) {
            reservationsContainer.innerHTML = '<div class="no-items">Нет забронированных книг</div>';
        }
        else {
            reservationsContainer.innerHTML = reservationBooks.map(book => `
                <div class="book-item" data-book-id="${book.id}">
                    <div class="book-info">
                        <div class="book-title">${book.title}</div>
                        <div class="book-author">${book.author}</div>
                        <div class="book-status">В наличии: ${book.inStock} шт.</div>
                    </div>
                    <button class="issue-btn" data-book-id="${book.id}">Выдать</button>
                </div>
            `).join('');
            document.querySelectorAll('.issue-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const bookId = parseInt(btn.dataset.bookId || '0');
                    // Перемещаем из бронирований в выданные
                    let reservations = [...userBooks.reservations];
                    let activeLoans = [...userBooks.activeLoans];
                    reservations = reservations.filter(id => id !== bookId);
                    activeLoans.push(bookId);
                    saveUserBooks(phone, 'reservations', reservations);
                    saveUserBooks(phone, 'loans', activeLoans);
                    // Обновляем количество книг
                    const allBooks = await loadBooks();
                    const targetBook = allBooks.find(b => b.id === bookId);
                    if (targetBook && targetBook.inStock > 0) {
                        targetBook.inStock--;
                        localStorage.setItem('books_cache', JSON.stringify(allBooks));
                    }
                    await renderUserDetails(phone);
                    alert('Книга выдана');
                });
            });
        }
    }
    // Вкладка возврата
    const loansContainer = document.getElementById('loans-list');
    if (loansContainer) {
        const loanBooks = allBooks.filter(book => userBooks.activeLoans.includes(book.id));
        if (loanBooks.length === 0) {
            loansContainer.innerHTML = '<div class="no-items">Нет выданных книг</div>';
        }
        else {
            loansContainer.innerHTML = loanBooks.map(book => `
                <div class="book-item" data-book-id="${book.id}">
                    <div class="book-info">
                        <div class="book-title">${book.title}</div>
                        <div class="book-author">${book.author}</div>
                    </div>
                    <button class="return-btn" data-book-id="${book.id}">Вернуть</button>
                </div>
            `).join('');
            document.querySelectorAll('.return-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const bookId = parseInt(btn.dataset.bookId || '0');
                    // Удаляем из выданных
                    let activeLoans = [...userBooks.activeLoans];
                    activeLoans = activeLoans.filter(id => id !== bookId);
                    saveUserBooks(phone, 'loans', activeLoans);
                    // Увеличиваем количество книг
                    const allBooks = await loadBooks();
                    const targetBook = allBooks.find(b => b.id === bookId);
                    if (targetBook) {
                        targetBook.inStock++;
                        localStorage.setItem('books_cache', JSON.stringify(allBooks));
                    }
                    await renderUserDetails(phone);
                    alert('Книга возвращена');
                });
            });
        }
    }
    // Вкладка избранного
    const favoritesContainer = document.getElementById('favorites-list');
    if (favoritesContainer) {
        const favoriteBooks = allBooks.filter(book => userBooks.favorites.includes(book.id));
        if (favoriteBooks.length === 0) {
            favoritesContainer.innerHTML = '<div class="no-items">Нет избранных книг</div>';
        }
        else {
            favoritesContainer.innerHTML = favoriteBooks.map(book => `
                <div class="book-item" data-book-id="${book.id}">
                    <div class="book-info">
                        <div class="book-title">${book.title}</div>
                        <div class="book-author">${book.author}</div>
                        <div class="book-status">Нет в наличии (0 шт.)</div>
                    </div>
                    <button class="add-stock-btn" data-book-id="${book.id}">Добавить экземпляр</button>
                </div>
            `).join('');
            document.querySelectorAll('.add-stock-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const bookId = parseInt(btn.dataset.bookId || '0');
                    // Увеличиваем количество книг до 1
                    const allBooks = await loadBooks();
                    const targetBook = allBooks.find(b => b.id === bookId);
                    if (targetBook && targetBook.inStock === 0) {
                        targetBook.inStock = 1;
                        localStorage.setItem('books_cache', JSON.stringify(allBooks));
                        // Перемещаем из избранного в бронирования
                        let favorites = [...userBooks.favorites];
                        let reservations = [...userBooks.reservations];
                        favorites = favorites.filter(id => id !== bookId);
                        reservations.push(bookId);
                        saveUserBooks(phone, 'favorites', favorites);
                        saveUserBooks(phone, 'reservations', reservations);
                        await renderUserDetails(phone);
                        alert('Экземпляр добавлен, книга перемещена в бронирования');
                    }
                });
            });
        }
    }
}
document.addEventListener('DOMContentLoaded', async () => {
    const savedUser = localStorage.getItem('library_user');
    if (!savedUser) {
        window.location.href = 'login.html';
        return;
    }
    const user = JSON.parse(savedUser);
    if (user.role !== 'librarian') {
        window.location.href = 'login.html';
        return;
    }
    const adminNameSpan = document.getElementById('admin-name');
    if (adminNameSpan) {
        adminNameSpan.textContent = user.name;
    }
    await renderUserList();
    // Переключение вкладок
    const navBtns = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            navBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const activeTab = document.getElementById(`${tabId}-tab`);
            if (activeTab) {
                activeTab.classList.add('active');
            }
        });
    });
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn?.addEventListener('click', () => {
        localStorage.removeItem('library_user');
        window.location.href = 'login.html';
    });
});
//# sourceMappingURL=librarian-cabinet.js.map