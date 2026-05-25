document.body.classList.add('librarian');

interface UserData {
    id: number;
    name: string;
    phone: string;
    role: string;
}

interface BookData {
    id: number;
    title: string;
    author: string;
    cover: string;
    rating: string;
    in_stock: number;
    genres: string[];
}

declare function loadBooks(): Promise<BookData[]>;

// Получение всех пользователей из БД
async function getAllUsers() {
    try {
        const response = await fetch(`${API_URL}/users`);
        return await response.json();
    } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
        return [];
    }
}

// Выдать книгу
async function issueBook(userId: number, bookId: number): Promise<boolean> {
    try {
        const response = await fetch(`${API_URL}/loans`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, bookId })
        });
        return response.ok;
    } catch (error) {
        console.error('Ошибка выдачи книги:', error);
        return false;
    }
}

// Вернуть книгу
async function returnBook(userId: number, bookId: number): Promise<boolean> {
    try {
        const response = await fetch(`${API_URL}/loans`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, bookId })
        });
        return response.ok;
    } catch (error) {
        console.error('Ошибка возврата книги:', error);
        return false;
    }
}

// Добавить экземпляр (из избранного в бронирования)
async function addStockFromFavorite(userId: number, bookId: number): Promise<boolean> {
    try {
        const response = await fetch(`${API_URL}/favorites/add-stock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, bookId })
        });
        return response.ok;
    } catch (error) {
        console.error('Ошибка добавления экземпляра:', error);
        return false;
    }
}

async function renderUserList() {
    const container = document.getElementById('user-list');
    if (!container) return;
    
    const users = await getAllUsers();
    
    if (users.length === 0) {
        container.innerHTML = '<div class="no-items">Нет зарегистрированных пользователей</div>';
        return;
    }
    
    container.innerHTML = users.map((user: any) => `
        <div class="user-item" data-user-id="${user.id}">
            <div class="user-item-info">
                <div class="user-name">${user.name}</div>
                <div class="user-phone">${user.phone}</div>
            </div>
            <button class="user-select-btn" data-user-id="${user.id}">Выбрать</button>
        </div>
    `).join('');
    
    document.querySelectorAll('.user-select-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const userId = parseInt((btn as HTMLElement).getAttribute('data-user-id') || '0');
            
            document.querySelectorAll('.user-item').forEach(i => i.classList.remove('active'));
            document.querySelectorAll('.user-select-btn').forEach(b => b.classList.remove('active'));
            
            const userItem = (btn as HTMLElement).closest('.user-item');
            if (userItem) userItem.classList.add('active');
            (btn as HTMLElement).classList.add('active');
            
            if (userId) {
                await renderUserDetails(userId);
            }
        });
    });
}

async function renderUserDetails(userId: number) {
    const allBooks = await loadBooks();
    const reservations = await getUserReservations(userId);
    const loans = await getUserLoans(userId);
    const favorites = await getUserFavorites(userId);
    
    // Вкладка бронирования
    const reservationsContainer = document.getElementById('reservations-list');
    if (reservationsContainer) {
        const reservationBooks = allBooks.filter(book => reservations.includes(book.id));
        if (reservationBooks.length === 0) {
            reservationsContainer.innerHTML = '<div class="no-items">Нет забронированных книг</div>';
        } else {
            reservationsContainer.innerHTML = reservationBooks.map(book => `
                <div class="book-item" data-book-id="${book.id}">
                    <div class="book-info">
                        <div class="book-title">${book.title}</div>
                        <div class="book-author">${book.author}</div>
                        <div class="book-status">В наличии: ${book.in_stock} шт.</div>
                    </div>
                    <button class="issue-btn" data-book-id="${book.id}">Выдать</button>
                </div>
            `).join('');
            
            document.querySelectorAll('.issue-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const bookId = parseInt((btn as HTMLElement).dataset.bookId || '0');
                    
                    const success = await issueBook(userId, bookId);
                    if (success) {
                        await renderUserDetails(userId);
                        alert('Книга выдана');
                    } else {
                        alert('Ошибка выдачи книги');
                    }
                });
            });
        }
    }
    
    // Вкладка возврата
    const loansContainer = document.getElementById('loans-list');
    if (loansContainer) {
        const loanBooks = allBooks.filter(book => loans.includes(book.id));
        if (loanBooks.length === 0) {
            loansContainer.innerHTML = '<div class="no-items">Нет выданных книг</div>';
        } else {
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
                    const bookId = parseInt((btn as HTMLElement).dataset.bookId || '0');
                    
                    const success = await returnBook(userId, bookId);
                    if (success) {
                        await renderUserDetails(userId);
                        alert('Книга возвращена');
                    } else {
                        alert('Ошибка возврата книги');
                    }
                });
            });
        }
    }
    
    // Вкладка избранного
    const favoritesContainer = document.getElementById('favorites-list');
    if (favoritesContainer) {
        const favoriteBooks = allBooks.filter(book => favorites.includes(book.id));
        if (favoriteBooks.length === 0) {
            favoritesContainer.innerHTML = '<div class="no-items">Нет избранных книг</div>';
        } else {
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
                    const bookId = parseInt((btn as HTMLElement).dataset.bookId || '0');
                    
                    const success = await addStockFromFavorite(userId, bookId);
                    if (success) {
                        await renderUserDetails(userId);
                        alert('Экземпляр добавлен, книга перемещена в бронирования');
                    } else {
                        alert('Ошибка добавления экземпляра');
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
    
    const user: UserData = JSON.parse(savedUser);
    
    if (user.role !== 'librarian') {
        window.location.href = 'login.html';
        return;
    }
    
    const adminNameSpan = document.getElementById('admin-name');
    if (adminNameSpan) {
        adminNameSpan.textContent = user.name;
    }
    
    await renderUserList();
    
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