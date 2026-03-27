"use strict";
// Контейнер и шаблон (специфичны для главной страницы)
const container = document.getElementById('books-container');
const template = document.getElementById('book-template');
if (!container || !template) {
    console.error('Container or template not found');
}
else {
    loadBooks().then(booksData => {
        // Сортировка по рейтингу
        const sortedBooks = [...booksData].sort((a, b) => {
            const ratingA = parseFloat(a.rating);
            const ratingB = parseFloat(b.rating);
            if (ratingA > ratingB)
                return -1;
            if (ratingA < ratingB)
                return 1;
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
            const card = createBookCard(book, template);
            container.appendChild(card);
        });
    });
}
//# sourceMappingURL=index.js.map