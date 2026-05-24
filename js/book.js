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
    loadBooks().then(books => {
        const book = books.find(b => b.id === parseInt(bookId));
        if (!book) {
            bookContainer.innerHTML = '<p>Книга не найдена</p>';
            return;
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
        // Наличие 
        const isAvailable = book.inStock > 0;
        if (isAvailable) {
            stockStatus.textContent = `В наличии: ${book.inStock} шт.`;
            stockStatus.className = 'book-page-stock-status in-stock';
            button.className = 'book-page-button in-stock';
        }
        else {
            stockStatus.textContent = 'Нет в наличии';
            stockStatus.className = 'book-page-stock-status out-of-stock';
            button.className = 'book-page-button out-of-stock';
        }
        button.textContent = isAvailable ? 'Забронировать' : 'В избранное';
        // Добавляем обработчик кнопки
        button.addEventListener('click', async (e) => {
            e.stopPropagation();
            const user = getCurrentUser();
            if (!user) {
                alert('Чтобы забронировать книгу или добавить её в избранное, нужно войти в аккаунт');
                window.location.href = 'login.html';
                return;
            }
            if (isAvailable) {
                // Бронирование
                const key = `reservations_${user.phone}`;
                const reservations = JSON.parse(localStorage.getItem(key) || '[]');
                reservations.push(book.id);
                localStorage.setItem(key, JSON.stringify(reservations));
                book.inStock--;
                await updateBookStock(book.id, book.inStock);
                alert(`Книга "${book.title}" забронирована!`);
                button.textContent = 'Забронировано';
                button.disabled = true;
                stockStatus.textContent = `В наличии: ${book.inStock} шт.`;
            }
            else {
                // Избранное
                const key = `favorites_${user.phone}`;
                const favorites = JSON.parse(localStorage.getItem(key) || '[]');
                if (!favorites.includes(book.id)) {
                    favorites.push(book.id);
                    localStorage.setItem(key, JSON.stringify(favorites));
                    alert(`Книга "${book.title}" добавлена в избранное`);
                    button.textContent = 'В избранном';
                    button.disabled = true;
                }
                else {
                    alert('Книга уже в избранном');
                }
            }
        });
        bookContainer.appendChild(clone);
    });
}
//# sourceMappingURL=book.js.map