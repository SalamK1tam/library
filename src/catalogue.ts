// Показ жанров для дропдауна
document.addEventListener('DOMContentLoaded', () => {
    const dropdown = document.querySelector('.multi-select-dropdown') as HTMLDivElement | null;
    const trigger = dropdown?.querySelector('.dropdown-trigger') as HTMLDivElement;
    
    if (trigger && dropdown) {
        trigger.addEventListener('click', (e: MouseEvent) => {
            e.stopPropagation();
            dropdown.classList.toggle('open');
        });
        
        document.addEventListener('click', (e: MouseEvent) => {
            if (!dropdown.contains(e.target as Node)) {
                dropdown.classList.remove('open');
            }
        });
    }
});

// Показ книг в каталоге
const catalogueContainer = document.getElementById('books-container') as HTMLDivElement | null;
const catalogueTemplate = document.getElementById('book-template') as HTMLTemplateElement | null;

const loadMoreWrapper = document.getElementById('load-more-wrapper');
const loadMoreBtn = document.getElementById('load-more-btn');

let allBooks: BookData[] = [];
let filteredBooks: BookData[] = [];
let currentDisplayCount = 12;
const STEP = 12;

// Получение выбранных жанров
function getSelectedGenres(): string[] {
    const selected: string[] = [];
    const checkboxes = document.querySelectorAll('.genre-option input[type="checkbox"]:checked');
    checkboxes.forEach(cb => {
        selected.push((cb as HTMLInputElement).value);
    });
    return selected;
}

// Проверка, соответствует ли книга выбранным жанрам
function matchesGenres(book: BookData, selectedGenres: string[]): boolean {
    if (selectedGenres.length === 0) return true;
    return selectedGenres.every(genre => book.genres.includes(genre));
}

// Применение всех фильтров
function applyFilters(): BookData[] {
    const selectedGenres = getSelectedGenres();
    const isInStockOnly = (document.querySelector('.in-stock-checkbox') as HTMLInputElement)?.checked || false;
    
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
    if (!catalogueContainer || !catalogueTemplate) return;
    
    const booksToShow = filteredBooks.slice(0, currentDisplayCount);
    catalogueContainer.innerHTML = '';
    
    if (filteredBooks.length === 0) {
        const noBooksMessage = document.createElement('div');
        noBooksMessage.className = 'no-books-message';
        noBooksMessage.innerHTML = `
            <p>Попробуйте изменить условия поиска</p>
        `;
        catalogueContainer.appendChild(noBooksMessage);
        
        if (loadMoreWrapper) {
            loadMoreWrapper.style.display = 'none';
        }
        return;
    }
    
    booksToShow.forEach(book => {
        const fragment = createBookCard(book, catalogueTemplate);
        // Получаем корневой элемент из фрагмента
        const card = fragment.firstElementChild as HTMLElement;
        
        if (card) {
            card.addEventListener('click', (e) => {
                // Клик на кнопку не должен вызывать переход
                if ((e.target as HTMLElement).closest('.book-button')) return;
                window.location.href = `book.html?id=${book.id}`;
            });
            catalogueContainer.appendChild(card);
        }
    });
    
    if (loadMoreWrapper) {
        if (currentDisplayCount >= filteredBooks.length) {
            loadMoreWrapper.style.display = 'none';
        } else {
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
function populateGenres(genres: string[]) {
    const genreOptions = document.querySelector('.genre-options');
    if (!genreOptions) return;
    
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
} else {
    loadBooks().then(booksData => {
        allBooks = [...booksData].sort((a, b) => {
            const ratingA = parseFloat(a.rating);
            const ratingB = parseFloat(b.rating);
            if (ratingA > ratingB) return -1;
            if (ratingA < ratingB) return 1;
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