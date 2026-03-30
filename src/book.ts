const bookContainer = document.getElementById('book-container');
const bookTemplate = document.getElementById('book-template') as HTMLTemplateElement;
const bookId = new URLSearchParams(window.location.search).get('id');

if (!bookContainer || !bookTemplate) {
    console.error('Container or template not found');
} else if (!bookId) {
    bookContainer.innerHTML = '<p>Книга не найдена</p>';
} else {
    loadBooks().then(books => {
        const book = books.find(b => b.id === parseInt(bookId));
        
        if (!book) {
            bookContainer.innerHTML = '<p>Книга не найдена</p>';
            return;
        }
        
        const clone = document.importNode(bookTemplate.content, true);
        
        const img = clone.querySelector('.book-page-cover img') as HTMLImageElement;
        const title = clone.querySelector('.book-page-title') as HTMLHeadingElement;
        const author = clone.querySelector('.book-page-author') as HTMLParagraphElement;
        const genresContainer = clone.querySelector('.book-page-genres') as HTMLDivElement;
        const starsContainer = clone.querySelector('.stars-container') as HTMLSpanElement;
        const ratingValueSpan = clone.querySelector('.rating-value') as HTMLSpanElement;
        const stockStatus = clone.querySelector('.book-page-stock-status') as HTMLDivElement;
        const button = clone.querySelector('.book-page-button') as HTMLButtonElement;
        
        img.src = book.cover;
        img.alt = book.title;
        title.textContent = book.title;
        author.textContent = book.author;
        
        // Жанры
        genresContainer.innerHTML = book.genres.map(genre => 
            `<span class="book-page-genre">${genre}</span>`
        ).join('');
        
        // Рейтинг звёздами
        const rating = parseFloat(book.rating);
        const rounded = Math.round(rating * 2) / 2;

        const fullStars = Math.floor(rounded);
        const hasHalfStar = rounded % 1 !== 0;

        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                starsHtml += '<span class="star filled">★</span>';
            } else if (i === fullStars + 1 && hasHalfStar) {
                starsHtml += '<span class="star half">⯪</span>';
            } else {
                starsHtml += '<span class="star">☆</span>';
            }
        }
        starsContainer.innerHTML = starsHtml;
        ratingValueSpan.textContent = `${book.rating}`;
        
        // Наличие 
        if (book.inStock > 0) {
            stockStatus.textContent = `В наличии: ${book.inStock} шт.`;
            stockStatus.className = 'book-page-stock-status in-stock';
            button.className = 'book-page-button in-stock';
        } else {
            stockStatus.textContent = 'Нет в наличии';
            stockStatus.className = 'book-page-stock-status out-of-stock';
            button.className = 'book-page-button out-of-stock';
        }
        
        // Кнопка
        button.textContent = book.inStock > 0 ? 'Забронировать' : 'В избранное';
        
        bookContainer.appendChild(clone);
    });
}