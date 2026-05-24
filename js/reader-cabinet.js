"use strict";
document.body.classList.add('reader');
async function renderReservations() {
    const container = document.getElementById('reservations-list');
    if (!container)
        return;
    const user = getCurrentUser();
    if (!user)
        return;
    const reservationIds = await getUserReservations(user.id);
    if (reservationIds.length === 0) {
        container.innerHTML = '<div class="no-items">У вас пока нет активных бронирований</div>';
        return;
    }
    const allBooks = await loadBooks();
    const reservations = allBooks.filter(book => reservationIds.includes(book.id));
    container.innerHTML = '';
    reservations.forEach(book => {
        const template = document.getElementById('book-template-cabinet');
        const clone = document.importNode(template.content, true);
        const card = clone.querySelector('.book-card');
        const img = clone.querySelector('img');
        const ratingValue = clone.querySelector('.rating-value');
        const author = clone.querySelector('.book-author');
        const title = clone.querySelector('.book-title');
        const button = clone.querySelector('.cabinet-book-button');
        card.dataset.bookId = book.id.toString();
        img.src = book.cover;
        ratingValue.textContent = book.rating;
        author.textContent = book.author;
        title.textContent = book.title;
        button.textContent = 'Отменить бронь';
        button.classList.add('cancel-reservation-btn');
        button.addEventListener('click', async (e) => {
            e.stopPropagation();
            const success = await cancelReservation(user.id, book.id);
            if (success) {
                await renderReservations();
                alert('Бронирование отменено');
            }
            else {
                alert('Ошибка отмены бронирования');
            }
        });
        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('cancel-reservation-btn'))
                return;
            window.location.href = `book.html?id=${book.id}`;
        });
        container.appendChild(card);
    });
}
async function renderFavorites() {
    const container = document.getElementById('favorites-list');
    if (!container)
        return;
    const user = getCurrentUser();
    if (!user)
        return;
    const favoriteIds = await getUserFavorites(user.id);
    if (favoriteIds.length === 0) {
        container.innerHTML = '<div class="no-items">У вас пока нет избранных книг</div>';
        return;
    }
    const allBooks = await loadBooks();
    const favorites = allBooks.filter(book => favoriteIds.includes(book.id));
    container.innerHTML = '';
    favorites.forEach(book => {
        const template = document.getElementById('book-template-cabinet');
        const clone = document.importNode(template.content, true);
        const card = clone.querySelector('.book-card');
        const img = clone.querySelector('img');
        const ratingValue = clone.querySelector('.rating-value');
        const author = clone.querySelector('.book-author');
        const title = clone.querySelector('.book-title');
        const button = clone.querySelector('.cabinet-book-button');
        card.dataset.bookId = book.id.toString();
        img.src = book.cover;
        ratingValue.textContent = book.rating;
        author.textContent = book.author;
        title.textContent = book.title;
        button.textContent = 'Удалить из избранного';
        button.classList.add('remove-favorite-btn');
        button.addEventListener('click', async (e) => {
            e.stopPropagation();
            const success = await removeFromFavorites(user.id, book.id);
            if (success) {
                await renderFavorites();
                alert('Удалено из избранного');
            }
            else {
                alert('Ошибка удаления из избранного');
            }
        });
        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-favorite-btn'))
                return;
            window.location.href = `book.html?id=${book.id}`;
        });
        container.appendChild(card);
    });
}
async function renderHistory() {
    const container = document.getElementById('history-list');
    if (!container)
        return;
    const user = getCurrentUser();
    if (!user)
        return;
    try {
        // Получаем активные выдачи (Loans) и историю (History)
        const [activeLoansRes, historyRes] = await Promise.all([
            fetch(`${API_URL}/users/${user.id}/loans`),
            fetch(`${API_URL}/users/${user.id}/history`)
        ]);
        const activeLoanIds = await activeLoansRes.json();
        const historyIds = await historyRes.json();
        if (activeLoanIds.length === 0 && historyIds.length === 0) {
            container.innerHTML = '<div class="no-items">У вас пока нет истории выдач</div>';
            return;
        }
        const allBooks = await loadBooks();
        // Собираем все книги с их статусами
        const activeBooks = activeLoanIds.map((id) => ({
            ...allBooks.find(b => b.id === id),
            status: 'Выдана'
        }));
        const historyBooks = historyIds.map((id) => ({
            ...allBooks.find(b => b.id === id),
            status: 'Возвращена'
        }));
        const allItems = [...activeBooks, ...historyBooks];
        container.innerHTML = allItems.map(book => `
            <div class="book-item" data-book-id="${book.id}">
                <div class="book-info">
                    <div class="book-title">${book.title}</div>
                    <div class="book-author">${book.author}</div>
                </div>
                <div class="history-status ${book.status === 'Выдана' ? 'active' : 'returned'}">${book.status}</div>
            </div>
        `).join('');
        document.querySelectorAll('.book-item').forEach(item => {
            item.addEventListener('click', () => {
                const bookId = item.dataset.bookId;
                window.location.href = `book.html?id=${bookId}`;
            });
        });
    }
    catch (error) {
        console.error('Ошибка загрузки истории:', error);
        container.innerHTML = '<div class="no-items">Ошибка загрузки истории</div>';
    }
}
document.addEventListener('DOMContentLoaded', async () => {
    const user = getCurrentUser();
    if (!user || user.role !== 'reader') {
        window.location.href = 'login.html';
        return;
    }
    const userNameSpan = document.getElementById('user-name');
    const userPhoneSpan = document.getElementById('user-phone');
    if (userNameSpan)
        userNameSpan.textContent = user.name;
    if (userPhoneSpan)
        userPhoneSpan.textContent = user.phone;
    await renderReservations();
    await renderFavorites();
    await renderHistory();
    const navBtns = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    navBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const tabId = btn.getAttribute('data-tab');
            navBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`${tabId}-tab`)?.classList.add('active');
            if (tabId === 'reservations')
                await renderReservations();
            if (tabId === 'favorites')
                await renderFavorites();
            if (tabId === 'history')
                await renderHistory();
        });
    });
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('library_user');
            window.location.href = 'login.html';
        });
    }
});
//# sourceMappingURL=reader-cabinet.js.map