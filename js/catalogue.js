"use strict";
// Показ жанров для дропдауна
document.addEventListener('DOMContentLoaded', () => {
    const dropdown = document.querySelector('.multi-select-dropdown');
    const trigger = dropdown?.querySelector('.dropdown-trigger');
    if (trigger && dropdown) {
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('open');
        });
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('open');
            }
        });
    }
});
// Показ книг в каталоге
const catalogueContainer = document.getElementById('books-container');
const catalogueTemplate = document.getElementById('book-template');
const loadMoreWrapper = document.getElementById('load-more-wrapper');
const loadMoreBtn = document.getElementById('load-more-btn');
let allBooks = [];
let filteredBooks = [];
let currentDisplayCount = 12;
const STEP = 12;
// Получение выбранных жанров
function getSelectedGenres() {
    const selected = [];
    const checkboxes = document.querySelectorAll('.genre-option input[type="checkbox"]:checked');
    checkboxes.forEach(cb => {
        selected.push(cb.value);
    });
    return selected;
}
// Проверка, соответствует ли книга выбранным жанрам
function matchesGenres(book, selectedGenres) {
    if (selectedGenres.length === 0)
        return true;
    return selectedGenres.every(genre => book.genres.includes(genre));
}
// Применение всех фильтров
function applyFilters() {
    const selectedGenres = getSelectedGenres();
    const isInStockOnly = document.querySelector('.in-stock-checkbox')?.checked || false;
    let result = [...allBooks];
    if (selectedGenres.length > 0) {
        result = result.filter(book => matchesGenres(book, selectedGenres));
    }
    if (isInStockOnly) {
        result = result.filter(book => book.inStock > 0);
    }
    return result;
}
// Отрисовка книг
function renderBooks() {
    if (!catalogueContainer || !catalogueTemplate)
        return;
    const booksToShow = filteredBooks.slice(0, currentDisplayCount);
    catalogueContainer.innerHTML = '';
    if (filteredBooks.length === 0) {
        const noBooksMessage = document.createElement('div');
        noBooksMessage.className = 'no-books-message';
        noBooksMessage.innerHTML = `
            <p>Книги не найдены.</p>
            <p>Попробуйте изменить условия поиска</p>
        `;
        catalogueContainer.appendChild(noBooksMessage);
        if (loadMoreWrapper) {
            loadMoreWrapper.style.display = 'none';
        }
        return;
    }
    booksToShow.forEach(book => {
        const card = createBookCard(book, catalogueTemplate);
        catalogueContainer.appendChild(card);
    });
    if (loadMoreWrapper) {
        if (currentDisplayCount >= filteredBooks.length) {
            loadMoreWrapper.style.display = 'none';
        }
        else {
            loadMoreWrapper.style.display = 'flex';
        }
    }
}
// Обновление фильтров
function updateFilters() {
    filteredBooks = applyFilters();
    currentDisplayCount = STEP;
    renderBooks();
}
// Загрузка больше книг
function loadMore() {
    currentDisplayCount += STEP;
    renderBooks();
}
// Заполнение списка жанров
function populateGenres(genres) {
    const genreOptions = document.querySelector('.genre-options');
    if (!genreOptions)
        return;
    genreOptions.innerHTML = '';
    genres.forEach(genre => {
        const label = document.createElement('label');
        label.className = 'genre-option';
        label.innerHTML = `
            <input type="checkbox" value="${genre}">
            ${genre}
        `;
        genreOptions.appendChild(label);
    });
    const newCheckboxes = document.querySelectorAll('.genre-option input[type="checkbox"]');
    newCheckboxes.forEach(cb => {
        cb.addEventListener('change', updateFilters);
    });
}
// Инициализация
if (!catalogueContainer || !catalogueTemplate) {
    console.error('Container or template not found');
}
else {
    loadBooks().then(booksData => {
        allBooks = [...booksData].sort((a, b) => {
            const ratingA = parseFloat(a.rating);
            const ratingB = parseFloat(b.rating);
            if (ratingA > ratingB)
                return -1;
            if (ratingA < ratingB)
                return 1;
            return Math.random() - 0.5;
        });
        const allGenres = getAllGenres(allBooks);
        populateGenres(allGenres);
        filteredBooks = [...allBooks];
        renderBooks();
        if (allBooks.length > currentDisplayCount && loadMoreWrapper) {
            loadMoreWrapper.style.display = 'flex';
        }
        const stockCheckbox = document.querySelector('.in-stock-checkbox');
        if (stockCheckbox) {
            stockCheckbox.addEventListener('change', updateFilters);
        }
    });
}
if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', loadMore);
}
//# sourceMappingURL=catalogue.js.map