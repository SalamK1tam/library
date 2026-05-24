document.body.classList.add('reader');

interface UserData {
    name: string;
    phone: string;
    role: string;
}

declare function loadBooks(): Promise<BookData[]>;

async function renderReservations() {
    const container = document.getElementById('reservations-list');
    if (!container) return;
    
    const user = getCurrentUser();
    if (!user) return
    
    const reservationIds: number[] = JSON.parse(localStorage.getItem(`reservations_${user.phone}`) || '[]');
    
    if (reservationIds.length === 0) {
        container.innerHTML = '<div class="no-items">У вас пока нет активных бронирований</div>';
        return;
    }
    
    const allBooks = await loadBooks();
    const reservations = allBooks.filter(book => reservationIds.includes(book.id));
    
    container.innerHTML = '';
    
    reservations.forEach(book => {
        const template = document.getElementById('book-template-cabinet') as HTMLTemplateElement;
        const clone = document.importNode(template.content, true);
        
        const card = clone.querySelector('.book-card') as HTMLDivElement;
        const img = clone.querySelector('img') as HTMLImageElement;
        const ratingValue = clone.querySelector('.rating-value') as HTMLSpanElement;
        const author = clone.querySelector('.book-author') as HTMLParagraphElement;
        const title = clone.querySelector('.book-title') as HTMLParagraphElement;
        const button = clone.querySelector('.cabinet-book-button') as HTMLButtonElement;
        
        card.dataset.bookId = book.id.toString();
        img.src = book.cover;
        ratingValue.textContent = book.rating;
        author.textContent = book.author;
        title.textContent = book.title;
        
        button.textContent = 'Отменить бронь';
        button.classList.add('cancel-reservation-btn');
        
        button.addEventListener('click', async (e) => {
            e.stopPropagation();
            
            let ids: number[] = JSON.parse(localStorage.getItem(`reservations_${user.phone}`) || '[]');
            ids = ids.filter(id => id !== book.id);
            localStorage.setItem(`reservations_${user.phone}`, JSON.stringify(ids));
            
            const allBooks = await loadBooks();
            const targetBook = allBooks.find(b => b.id === book.id);
            if (targetBook) {
                targetBook.inStock++;
                localStorage.setItem('books_cache', JSON.stringify(allBooks));
            }
            
            await renderReservations();
            alert('Бронирование отменено');
        });
        
        card.addEventListener('click', (e) => {
            if ((e.target as HTMLElement).classList.contains('cancel-reservation-btn')) return;
            window.location.href = `book.html?id=${book.id}`;
        });
        
        container.appendChild(card);
    });
}

async function renderFavorites() {
    const container = document.getElementById('favorites-list');
    if (!container) return;
    
    const user = getCurrentUser();
    if (!user) return;
    
    const favoriteIds: number[] = JSON.parse(localStorage.getItem(`favorites_${user.phone}`) || '[]');
    
    if (favoriteIds.length === 0) {
        container.innerHTML = '<div class="no-items">У вас пока нет избранных книг</div>';
        return;
    }
    
    const allBooks = await loadBooks();
    const favorites = allBooks.filter(book => favoriteIds.includes(book.id));
    
    container.innerHTML = '';
    
    favorites.forEach(book => {
        const template = document.getElementById('book-template-cabinet') as HTMLTemplateElement;
        const clone = document.importNode(template.content, true);
        
        const card = clone.querySelector('.book-card') as HTMLDivElement;
        const img = clone.querySelector('img') as HTMLImageElement;
        const ratingValue = clone.querySelector('.rating-value') as HTMLSpanElement;
        const author = clone.querySelector('.book-author') as HTMLParagraphElement;
        const title = clone.querySelector('.book-title') as HTMLParagraphElement;
        const button = clone.querySelector('.cabinet-book-button') as HTMLButtonElement;
        
        card.dataset.bookId = book.id.toString();
        img.src = book.cover;
        ratingValue.textContent = book.rating;
        author.textContent = book.author;
        title.textContent = book.title;
        
        button.textContent = 'Удалить из избранного';
        button.classList.add('remove-favorite-btn');
        
        button.addEventListener('click', async (e) => {
            e.stopPropagation();
            
            let ids: number[] = JSON.parse(localStorage.getItem(`favorites_${user.phone}`) || '[]');
            ids = ids.filter(id => id !== book.id);
            localStorage.setItem(`favorites_${user.phone}`, JSON.stringify(ids));
            
            await renderFavorites();
            alert('Удалено из избранного');
        });
        
        card.addEventListener('click', (e) => {
            if ((e.target as HTMLElement).classList.contains('remove-favorite-btn')) return;
            window.location.href = `book.html?id=${book.id}`;
        });
        
        container.appendChild(card);
    });
}

async function renderHistory() {
    const container = document.getElementById('history-list');
    if (!container) return;
    
    const user = getCurrentUser();
    if (!user) return;
    
    // Здесь потом будет реальная история выдач из БД
    const history: any[] = []; // Пока пустой массив
    
    if (history.length === 0) {
        container.innerHTML = '<div class="no-items">У вас пока нет выдач</div>';
        return;
    }
    
    // container.innerHTML = history.map(item => `
    //     <div class="book-list-item">
    //         <span class="book-list-number">${item.id}.</span>
    //         <span class="book-list-title">${escapeHtml(item.title)}</span>
    //         <span class="book-list-author">${escapeHtml(item.author)}</span>
    //         <span class="history-date">Выдана: ${item.loanDate}</span>
    //         <span class="history-date">Возвращена: ${item.returnDate || 'не возвращена'}</span>
    //     </div>
    // `).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
    const user = getCurrentUser();
    if (!user || user.role !== 'reader') {
        window.location.href = 'login.html';
        return;
    }
    
    const userNameSpan = document.getElementById('user-name');
    const userPhoneSpan = document.getElementById('user-phone');
    if (userNameSpan) userNameSpan.textContent = user.name;
    if (userPhoneSpan) userPhoneSpan.textContent = user.phone;
    
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
            
            if (tabId === 'reservations') await renderReservations();
            if (tabId === 'favorites') await renderFavorites();
            if (tabId === 'history') await renderHistory();
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