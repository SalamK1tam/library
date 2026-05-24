"use strict";
const bookContainer = document.getElementById('book-container');
const bookTemplate = document.getElementById('book-template');
const bookId = new URLSearchParams(window.location.search).get('id');
if (!bookContainer || !bookTemplate) {
    console.error('Container or template not found');
}
else if (!bookId) {
    bookContainer.innerHTML = '<p>Книга не найдена</p>';
}
else {
    loadBooks().then(async (books) => {
        const book = books.find(b => b.id === parseInt(bookId));
        if (!book) {
            bookContainer.innerHTML = '<p>Книга не найдена</p>';
            return;
        }
        const user = getCurrentUser();
        // Проверяем, забронирована ли книга уже пользователем
        let isReserved = false;
        let isFavorited = false;
        if (user) {
            try {
                const [reservedRes, favoritedRes] = await Promise.all([
                    fetch(`${API_URL}/users/${user.id}/reservations/${book.id}`),
                    fetch(`${API_URL}/users/${user.id}/favorites/${book.id}`)
                ]);
                const reservedData = await reservedRes.json();
                const favoritedData = await favoritedRes.json();
                isReserved = reservedData.isReserved;
                isFavorited = favoritedData.isFavorited;
            }
            catch (error) {
                console.error('Ошибка проверки статуса книги:', error);
            }
        }
        const clone = document.importNode(bookTemplate.content, true);
        const img = clone.querySelector('.book-page-cover img');
        const title = clone.querySelector('.book-page-title');
        const author = clone.querySelector('.book-page-author');
        const genresContainer = clone.querySelector('.book-page-genres');
        const starsContainer = clone.querySelector('.stars-container');
        const ratingValueSpan = clone.querySelector('.rating-value');
        const stockStatus = clone.querySelector('.book-page-stock-status');
        const button = clone.querySelector('.book-page-button');
        img.src = book.cover;
        img.alt = book.title;
        title.textContent = book.title;
        author.textContent = book.author;
        // Жанры
        genresContainer.innerHTML = book.genres.map(genre => `<span class="book-page-genre">${genre}</span>`).join('');
        // Рейтинг звёздами
        const rating = parseFloat(book.rating);
        const rounded = Math.round(rating * 2) / 2;
        const fullStars = Math.floor(rounded);
        const hasHalfStar = rounded % 1 !== 0;
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                starsHtml += '<span class="star filled">★</span>';
            }
            else if (i === fullStars + 1 && hasHalfStar) {
                starsHtml += '<span class="star half">⯪</span>';
            }
            else {
                starsHtml += '<span class="star">☆</span>';
            }
        }
        starsContainer.innerHTML = starsHtml;
        ratingValueSpan.textContent = `${book.rating}`;
        // Наличие и состояние кнопки
        const isAvailable = book.in_stock > 0;
        if (isAvailable) {
            stockStatus.textContent = `В наличии: ${book.in_stock} шт.`;
            stockStatus.className = 'book-page-stock-status in-stock';
            button.className = 'book-page-button in-stock';
            if (isReserved) {
                button.textContent = 'Забронировано';
                button.disabled = true;
            }
            else {
                button.textContent = 'Забронировать';
            }
        }
        else {
            stockStatus.textContent = 'Нет в наличии';
            stockStatus.className = 'book-page-stock-status out-of-stock';
            button.className = 'book-page-button out-of-stock';
            if (isFavorited) {
                button.textContent = 'В избранном';
                button.disabled = true;
            }
            else {
                button.textContent = 'В избранное';
            }
        }
        // Добавляем обработчик кнопки через API
        button.addEventListener('click', async (e) => {
            e.stopPropagation();
            const currentUser = getCurrentUser();
            if (!currentUser) {
                alert('Чтобы забронировать книгу или добавить её в избранное, нужно войти в аккаунт');
                window.location.href = 'login.html';
                return;
            }
            if (isAvailable && !isReserved) {
                // Бронирование через API
                try {
                    const response = await fetch(`${API_URL}/reservations`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: currentUser.id, bookId: book.id })
                    });
                    if (response.ok) {
                        button.textContent = 'Забронировано';
                        button.disabled = true;
                        alert(`Книга "${book.title}" забронирована!`);
                    }
                    else {
                        const error = await response.json();
                        alert(error.error || 'Ошибка бронирования');
                    }
                }
                catch (error) {
                    console.error('Ошибка бронирования:', error);
                    alert('Ошибка при бронировании');
                }
            }
            else if (!isAvailable && !isFavorited) {
                // Избранное через API
                try {
                    const response = await fetch(`${API_URL}/favorites`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: currentUser.id, bookId: book.id })
                    });
                    if (response.ok) {
                        button.textContent = 'В избранном';
                        button.disabled = true;
                        alert(`Книга "${book.title}" добавлена в избранное`);
                    }
                    else {
                        const error = await response.json();
                        alert(error.error || 'Ошибка добавления в избранное');
                    }
                }
                catch (error) {
                    console.error('Ошибка добавления в избранное:', error);
                    alert('Ошибка при добавлении в избранное');
                }
            }
        });
        bookContainer.appendChild(clone);
    });
}
//# sourceMappingURL=book.js.map