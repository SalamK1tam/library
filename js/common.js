"use strict";
// Загрузка книг 
async function loadBooks() {
    try {
        const response = await fetch('books.json');
        const data = await response.json();
        return data.books;
    }
    catch (error) {
        console.error('Ошибка загрузки JSON:', error);
        return [];
    }
}
// Получение текущего пользователя
function getCurrentUser() {
    const savedUser = localStorage.getItem('library_user');
    if (!savedUser)
        return null;
    return JSON.parse(savedUser);
}
// Обновление количества книг в кэше
async function updateBookStock(bookId, newStock) {
    const allBooks = await loadBooks();
    const book = allBooks.find(b => b.id === bookId);
    if (book) {
        book.inStock = newStock;
        localStorage.setItem('books_cache', JSON.stringify(allBooks));
    }
}
// Создание карточки книги с обработчиком
function createBookCard(book, template) {
    const clone = document.importNode(template.content, true);
    const card = clone.querySelector('.book-card');
    const img = clone.querySelector('img');
    const ratingValue = clone.querySelector('.rating-value');
    const author = clone.querySelector('.book-author');
    const title = clone.querySelector('.book-title');
    const button = clone.querySelector('.book-button');
    card.dataset.bookId = book.id.toString();
    card.dataset.inStock = book.inStock.toString();
    img.src = book.cover;
    img.alt = `Обложка ${book.title}`;
    ratingValue.textContent = book.rating;
    author.textContent = book.author;
    title.textContent = book.title;
    const isAvailable = book.inStock > 0;
    button.textContent = isAvailable ? 'Забронировать' : 'В избранное';
    button.classList.add(isAvailable ? 'in-stock' : 'out-of-stock');
    // Обработчик кнопки
    button.addEventListener('click', async (e) => {
        e.stopPropagation();
        const user = getCurrentUser();
        if (!user) {
            alert('Чтобы забронировать книгу, нужно войти в аккаунт');
            window.location.href = 'login.html';
            return;
        }
        if (book.inStock > 0) {
            // Бронирование
            const key = `reservations_${user.phone}`;
            const reservations = JSON.parse(localStorage.getItem(key) || '[]');
            reservations.push(book.id);
            localStorage.setItem(key, JSON.stringify(reservations));
            // Уменьшаем количество доступных книг
            book.inStock--;
            await updateBookStock(book.id, book.inStock);
            alert(`Книга "${book.title}" забронирована!`);
            button.textContent = 'Забронировано';
            button.disabled = true;
            button.classList.add('disabled');
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
                button.classList.add('disabled');
            }
            else {
                alert('Книга уже в избранном');
            }
        }
    });
    return clone;
}
// Получение всех уникальных жанров из книг
function getAllGenres(books) {
    const genresSet = new Set();
    books.forEach(book => {
        book.genres.forEach(genre => {
            genresSet.add(genre);
        });
    });
    return Array.from(genresSet).sort((a, b) => a.localeCompare(b));
}
// Поиск по названию/автору
function searchBooks(books, query) {
    if (!query.trim())
        return books;
    const lowerQuery = query.toLowerCase().trim();
    const words = lowerQuery.split(/\s+/);
    return books.filter(book => {
        const titleLower = book.title.toLowerCase();
        const authorLower = book.author.toLowerCase();
        return words.every(word => {
            const titleMatch = titleLower.split(/\s+/).some(bookWord => bookWord.startsWith(word));
            const authorMatch = authorLower.split(/\s+/).some(authorWord => authorWord.startsWith(word));
            return titleMatch || authorMatch;
        });
    });
}
// Работа поиска (серчбар)
let allBooksForSearch = [];
function initGlobalSearch() {
    const searchInput = document.querySelector('.main-search');
    const searchDropdown = document.getElementById('search-dropdown');
    if (searchInput && searchDropdown) {
        loadBooks().then(books => {
            allBooksForSearch = books;
        });
        searchInput.addEventListener('focus', () => {
            if (allBooksForSearch.length > 0) {
                renderSearchDropdown(allBooksForSearch.slice(0, 10), searchDropdown);
                searchDropdown.style.display = 'block';
            }
        });
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (query.length === 0) {
                renderSearchDropdown(allBooksForSearch.slice(0, 10), searchDropdown);
                searchDropdown.style.display = 'block';
                return;
            }
            const results = searchBooks(allBooksForSearch, query);
            renderSearchDropdown(results.slice(0, 10), searchDropdown);
            searchDropdown.style.display = results.length > 0 ? 'block' : 'block';
        });
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
                searchDropdown.style.display = 'none';
            }
        });
    }
    updateAuthButton();
    document.body.style.display = 'block';
}
function renderSearchDropdown(books, dropdown) {
    if (books.length === 0) {
        dropdown.innerHTML = '<div class="search-no-results">Ничего не найдено</div>';
        return;
    }
    dropdown.innerHTML = books.slice(0, 10).map(book => `
        <div class="search-result-item" data-book-id="${book.id}">
            <img class="search-result-cover" src="${book.cover}" alt="${book.title}" onerror="this.src='img/placeholder.jpg'">
            <div class="search-result-info">
                <div class="search-result-title">${escapeHtml(book.title)}</div>
                <div class="search-result-author">${escapeHtml(book.author)}</div>
            </div>
        </div>
    `).join('');
    dropdown.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
            const bookId = item.dataset.bookId;
            window.location.href = `book.html?id=${bookId}`;
            dropdown.style.display = 'none';
            document.querySelector('.main-search').value = '';
        });
    });
}
function updateAuthButton() {
    const authLinkElement = document.querySelector('.auth-link');
    const savedUser = localStorage.getItem('library_user');
    if (authLinkElement) {
        // Если элемент уже существует, просто обновляем его
        const link = authLinkElement;
        if (savedUser) {
            link.textContent = 'Аккаунт';
            link.href = 'reader-cabinet.html';
        }
        else {
            link.textContent = 'Вход';
            link.href = 'login.html';
        }
    }
    else {
        // Если элемента нет, создаем новый
        const navContainer = document.querySelector('.main-nav');
        if (!navContainer)
            return;
        const authLink = document.createElement('a');
        authLink.className = 'auth-link';
        // Ищем ссылку "Вход" или "Аккаунт" чтобы заменить
        const existingLoginLink = Array.from(navContainer.querySelectorAll('a')).find(a => a.textContent === 'Вход' || a.textContent === 'Аккаунт');
        if (existingLoginLink) {
            // Заменяем существующую ссылку
            existingLoginLink.replaceWith(authLink);
        }
        else {
            // Если нет ссылки для замены, добавляем в конец
            navContainer.appendChild(authLink);
        }
        if (savedUser) {
            authLink.textContent = 'Аккаунт';
            authLink.href = 'reader-cabinet.html';
        }
        else {
            authLink.textContent = 'Вход';
            authLink.href = 'login.html';
        }
    }
}
function escapeHtml(str) {
    return str.replace(/[&<>]/g, function (m) {
        if (m === '&')
            return '&amp;';
        if (m === '<')
            return '&lt;';
        if (m === '>')
            return '&gt;';
        return m;
    });
}
document.addEventListener('DOMContentLoaded', initGlobalSearch);
//# sourceMappingURL=common.js.map