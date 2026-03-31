// Контейнер и шаблон (для главной страницы)
const container = document.getElementById('books-container') as HTMLDivElement | null;
const template = document.getElementById('book-template') as HTMLTemplateElement | null;

if (!container || !template) {
    console.error('Container or template not found');
} else {
    loadBooks().then(booksData => {
        // Сортировка по рейтингу
        const sortedBooks = [...booksData].sort((a, b) => {
            const ratingA = parseFloat(a.rating);
            const ratingB = parseFloat(b.rating);
            if (ratingA > ratingB) return -1;
            if (ratingA < ratingB) return 1;
            return Math.random() - 0.5;
        });
    
        // Ограничение количества (специфично для главной)
        const maxBooksAttr = container.dataset.maxBooks;
        let booksToShow = sortedBooks;
        
        if (maxBooksAttr && maxBooksAttr !== 'all') {
            const max = parseInt(maxBooksAttr, 10);
            booksToShow = sortedBooks.slice(0, max);
        }
        
        container.innerHTML = '';
        
        booksToShow.forEach(book => {
            const fragment = createBookCard(book, template);

            const card = fragment.firstElementChild as HTMLElement;
            if (card) {
                card.addEventListener('click', (e) => {
                    // Клик на кнопку не должен вызывать переход
                    if ((e.target as HTMLElement).closest('.book-button')) return;
                    window.location.href = `book.html?id=${book.id}`;
                });
                container.appendChild(card);
            }
        });
    });
}