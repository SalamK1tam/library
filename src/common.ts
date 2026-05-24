// Интерфейсы 
interface BookData {
    id: number;
    title: string;
    author: string;
    cover: string;
    rating: string;
    in_stock: number;
    genres: string[];
}

interface BooksResponse {
    books: BookData[];
}

interface UserData {
    id: number;
    name: string;
    phone: string;
    role: string;
}

const API_URL = 'http://localhost:3000/api';

async function loadBooks(): Promise<BookData[]> {
    try {
        const response = await fetch(`${API_URL}/books`);
        if (!response.ok) throw new Error('Ошибка загрузки');
        return await response.json();
    } catch (error) {
        console.error('Ошибка загрузки книг:', error);
        return [];
    }
}


// Получение текущего пользователя
function getCurrentUser(): UserData | null {
    const savedUser = localStorage.getItem('library_user');
    if (!savedUser) return null;
    return JSON.parse(savedUser);
}

// Обновление количества книг в кэше
async function updateBookStock(bookId: number, newStock: number): Promise<void> {
    const allBooks = await loadBooks();
    const book = allBooks.find(b => b.id === bookId);
    if (book) {
        book.in_stock = newStock;
        localStorage.setItem('books_cache', JSON.stringify(allBooks));
    }
}

// Создание карточки книги с обработчиком 
function createBookCard(book: BookData, template: HTMLTemplateElement): DocumentFragment {
    const clone = document.importNode(template.content, true);
    
    const card = clone.querySelector('.book-card') as HTMLDivElement;
    const img = clone.querySelector('img') as HTMLImageElement;
    const ratingValue = clone.querySelector('.rating-value') as HTMLSpanElement;
    const author = clone.querySelector('.book-author') as HTMLParagraphElement;
    const title = clone.querySelector('.book-title') as HTMLParagraphElement;
    const button = clone.querySelector('.book-button') as HTMLButtonElement;
    
    card.dataset.bookId = book.id.toString();
    card.dataset.inStock = book.in_stock.toString();
    
    img.src = book.cover;
    img.alt = `Обложка ${book.title}`;
    ratingValue.textContent = book.rating;
    author.textContent = book.author;
    title.textContent = book.title;
    
    const isAvailable = book.in_stock > 0;
    button.textContent = isAvailable ? 'Забронировать' : 'В избранное';
    button.classList.add(isAvailable ? 'in-stock' : 'out-of-stock');
    
    // Обработчик кнопки через API
    button.addEventListener('click', async (e) => {
        e.stopPropagation();
        
        const user = getCurrentUser();
        if (!user) {
            alert('Чтобы забронировать книгу, нужно войти в аккаунт');
            window.location.href = 'login.html';
            return;
        }
        
        if (book.in_stock > 0) {
            // Бронирование через API
            try {
                const response = await fetch(`${API_URL}/reservations`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id, bookId: book.id })
                });
                
                if (response.ok) {
                    // Обновляем локальные данные
                    book.in_stock--;
                    button.textContent = 'Забронировано';
                    button.disabled = true;
                    button.classList.add('disabled');
                    alert(`Книга "${book.title}" забронирована!`);
                } else {
                    const error = await response.json();
                    alert(error.error || 'Ошибка бронирования');
                }
            } catch (error) {
                console.error('Ошибка бронирования:', error);
                alert('Ошибка при бронировании');
            }
        } else {
            // Избранное через API
            try {
                const response = await fetch(`${API_URL}/favorites`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id, bookId: book.id })
                });
                
                if (response.ok) {
                    button.textContent = 'В избранном';
                    button.disabled = true;
                    button.classList.add('disabled');
                    alert(`Книга "${book.title}" добавлена в избранное`);
                } else {
                    const error = await response.json();
                    alert(error.error || 'Ошибка добавления в избранное');
                }
            } catch (error) {
                console.error('Ошибка добавления в избранное:', error);
                alert('Ошибка при добавлении в избранное');
            }
        }
    });
    
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
        
        return words.every(word => {
            const titleMatch = titleLower.split(/\s+/).some(bookWord => 
                bookWord.startsWith(word)
            );
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
        
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target as Node) && !searchDropdown.contains(e.target as Node)) {
                searchDropdown.style.display = 'none';
            }
        });
    }
    
    updateAuthButton();
    document.body.style.display = 'block';
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

function updateAuthButton() {
    const authLinkElement = document.querySelector('.auth-link');
    
    const savedUser = localStorage.getItem('library_user');
    
    if (authLinkElement) {
        // Если элемент уже существует, просто обновляем его
        const link = authLinkElement as HTMLAnchorElement;
        if (savedUser) {
            link.textContent = 'Аккаунт';
            link.href = 'reader-cabinet.html';
        } else {
            link.textContent = 'Вход';
            link.href = 'login.html';
        }
    } else {
        // Если элемента нет, создаем новый
        const navContainer = document.querySelector('.main-nav');
        if (!navContainer) return;
        
        const authLink = document.createElement('a');
        authLink.className = 'auth-link';
        
        // Ищем ссылку "Вход" или "Аккаунт" чтобы заменить
        const existingLoginLink = Array.from(navContainer.querySelectorAll('a')).find(
            a => a.textContent === 'Вход' || a.textContent === 'Аккаунт'
        );
        
        if (existingLoginLink) {
            // Заменяем существующую ссылку
            (existingLoginLink as HTMLAnchorElement).replaceWith(authLink);
        } else {
            // Если нет ссылки для замены, добавляем в конец
            navContainer.appendChild(authLink);
        }
        
        if (savedUser) {
            authLink.textContent = 'Аккаунт';
            authLink.href = 'reader-cabinet.html';
        } else {
            authLink.textContent = 'Вход';
            authLink.href = 'login.html';
        }
    }
}

// Получение бронирований пользователя
async function getUserReservations(userId: number): Promise<number[]> {
    try {
        const response = await fetch(`${API_URL}/users/${userId}/reservations`);
        return await response.json();
    } catch (error) {
        console.error('Ошибка загрузки бронирований:', error);
        return [];
    }
}

// Получение выданных книг пользователя
async function getUserLoans(userId: number): Promise<number[]> {
    try {
        const response = await fetch(`${API_URL}/users/${userId}/loans`);
        return await response.json();
    } catch (error) {
        console.error('Ошибка загрузки выдач:', error);
        return [];
    }
}

// Получение избранного пользователя
async function getUserFavorites(userId: number): Promise<number[]> {
    try {
        const response = await fetch(`${API_URL}/users/${userId}/favorites`);
        return await response.json();
    } catch (error) {
        console.error('Ошибка загрузки избранного:', error);
        return [];
    }
}

// Отменить бронирование
async function cancelReservation(userId: number, bookId: number): Promise<boolean> {
    try {
        const response = await fetch(`${API_URL}/reservations`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, bookId })
        });
        return response.ok;
    } catch (error) {
        console.error('Ошибка отмены бронирования:', error);
        return false;
    }
}

// Удалить из избранного
async function removeFromFavorites(userId: number, bookId: number): Promise<boolean> {
    try {
        const response = await fetch(`${API_URL}/favorites`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, bookId })
        });
        return response.ok;
    } catch (error) {
        console.error('Ошибка удаления из избранного:', error);
        return false;
    }
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