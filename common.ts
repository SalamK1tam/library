// Интерфейсы 
interface BookData {
    id: number;
    title: string;
    author: string;
    cover: string;
    rating: string;
    inStock: number;
    genres: string[];
}

interface BooksResponse {
    books: BookData[];
}

// Загрузка книг 
async function loadBooks() {
    try {
        const response = await fetch('books.json');
        const data: BooksResponse = await response.json();
        return data.books;
    } catch (error) {
        console.error('Ошибка загрузки JSON:', error);
        return [];
    }
}

// Создание карточки книги 
function createBookCard(book: BookData, template: HTMLTemplateElement): DocumentFragment {
    const clone = document.importNode(template.content, true);
    
    const card = clone.querySelector('.book-card') as HTMLDivElement;
    const img = clone.querySelector('img') as HTMLImageElement;
    const ratingValue = clone.querySelector('.rating-value') as HTMLSpanElement;
    const author = clone.querySelector('.book-author') as HTMLParagraphElement;
    const title = clone.querySelector('.book-title') as HTMLParagraphElement;
    const button = clone.querySelector('.book-button') as HTMLButtonElement;
    
    card.dataset.bookId = book.id.toString();
    card.dataset.inStock = book.inStock.toString();
    
    img.src = book.cover;
    img.alt = `Обложка ${book.title}`;
    ratingValue.textContent = book.rating;
    author.textContent = book.author;
    title.textContent = book.title;
    
    const isAvailable = book.inStock > 0;
    button.textContent = isAvailable ? 'Забронировать' : 'В избранное';
    button.classList.add(isAvailable ? 'in-stock' : 'favorite');
    
    return clone;
}

// Получение всех уникальных жанров из книг
function getAllGenres(books: BookData[]): string[] {
    const genresSet = new Set<string>();
    books.forEach(book => {
        book.genres.forEach(genre => {
            genresSet.add(genre);
        });
    });
    return Array.from(genresSet).sort((a, b) => a.localeCompare(b));
}

// Поиск по названию/автору
function searchBooks(books: BookData[], query: string): BookData[] {
    if (!query.trim()) return books;
    
    const lowerQuery = query.toLowerCase().trim();
    const words = lowerQuery.split(/\s+/);
    
    return books.filter(book => {
        const titleLower = book.title.toLowerCase();
        const authorLower = book.author.toLowerCase();
        
        // Проверяем, что ВСЕ слова из запроса встречаются в названии ИЛИ в имени автора
        return words.every(word => {
            // Проверка по названию
            const titleMatch = titleLower.split(/\s+/).some(bookWord => 
                bookWord.startsWith(word)
            );
            // Проверка по автору
            const authorMatch = authorLower.split(/\s+/).some(authorWord => 
                authorWord.startsWith(word)
            );
            return titleMatch || authorMatch;
        });
    });
}

// Работа поиска (серчбар)
let allBooksForSearch: BookData[] = [];

function initGlobalSearch() {
    const searchInput = document.querySelector('.main-search') as HTMLInputElement | null;
    const searchDropdown = document.getElementById('search-dropdown') as HTMLDivElement | null;
    
    if (!searchInput || !searchDropdown) return;
    
    // Загружаем книги для поиска
    loadBooks().then(books => {
        allBooksForSearch = books;
    });
    
    // При фокусе — показываем все книги
    searchInput.addEventListener('focus', () => {
        if (allBooksForSearch.length > 0) {
            renderSearchDropdown(allBooksForSearch.slice(0, 10), searchDropdown);
            searchDropdown.style.display = 'block';
        }
    });
    
    // Обработка ввода
    searchInput.addEventListener('input', (e) => {
        const query = (e.target as HTMLInputElement).value.trim();
        
        if (query.length === 0) {
            renderSearchDropdown(allBooksForSearch.slice(0, 10), searchDropdown);
            searchDropdown.style.display = 'block';
            return;
        }
        
        const results = searchBooks(allBooksForSearch, query);
        renderSearchDropdown(results.slice(0, 10), searchDropdown);
        searchDropdown.style.display = results.length > 0 ? 'block' : 'block';
    });
    
    // Закрытие при клике вне
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target as Node) && !searchDropdown.contains(e.target as Node)) {
            searchDropdown.style.display = 'none';
        }
    });
}

function renderSearchDropdown(books: BookData[], dropdown: HTMLDivElement) {
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
            const bookId = (item as HTMLElement).dataset.bookId;
            window.location.href = `book.html?id=${bookId}`;
            dropdown.style.display = 'none';
            (document.querySelector('.main-search') as HTMLInputElement).value = '';
        });
    });
}

function escapeHtml(str: string): string {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

document.addEventListener('DOMContentLoaded', initGlobalSearch);