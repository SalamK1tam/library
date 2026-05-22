"use strict";
class LibraryMap {
    svgDocument = null;
    svgObject = null;
    allBooks = [];
    shelfBooksSection = null;
    shelfTitle = null;
    booksContainer = null;
    closeBtn = null;
    template = null;
    shelves = [
        { id: 'shelf-1', genre: 'Художественная литература' },
        { id: 'shelf-2', genre: 'Художественная литература' },
        { id: 'shelf-3', genre: 'Художественная литература' },
        { id: 'shelf-4', genre: 'Научная литература' },
        { id: 'shelf-5', genre: 'Научная литература' },
        { id: 'shelf-6', genre: 'Научная литература' },
        { id: 'shelf-7', genre: 'Детская литература' },
        { id: 'shelf-8', genre: 'Детская литература' },
        { id: 'shelf-9', genre: 'Детская литература' },
        { id: 'shelf-10', genre: 'Историческая литература' },
        { id: 'shelf-11', genre: 'Историческая литература' },
        { id: 'shelf-12', genre: 'Историческая литература' },
        { id: 'shelf-13', genre: 'Фантастика' },
        { id: 'shelf-14', genre: 'Фантастика' },
        { id: 'shelf-15', genre: 'Фантастика' },
        { id: 'shelf-16', genre: 'Классика' },
        { id: 'shelf-17', genre: 'Классика' },
        { id: 'shelf-18', genre: 'Классика' },
        { id: 'shelf-19', genre: 'Поэзия' },
        { id: 'shelf-20', genre: 'Поэзия' },
        { id: 'shelf-21', genre: 'Поэзия' },
        { id: 'shelf-22', genre: 'Драматургия' },
        { id: 'shelf-23', genre: 'Драматургия' },
        { id: 'shelf-24', genre: 'Драматургия' },
        { id: 'shelf-25', genre: 'Философия' },
        { id: 'shelf-26', genre: 'Философия' },
        { id: 'shelf-27', genre: 'Философия' },
        { id: 'shelf-28', genre: 'Современная проза' },
        { id: 'shelf-29', genre: 'Современная проза' },
        { id: 'shelf-30', genre: 'Современная проза' }
    ];
    constructor() {
        this.shelfBooksSection = document.getElementById('shelf-books-section');
        this.shelfTitle = document.getElementById('shelf-title');
        this.booksContainer = document.getElementById('shelf-books-container');
        this.closeBtn = document.getElementById('close-shelf-btn');
        this.template = document.getElementById('book-template');
        this.init();
    }
    async init() {
        await this.loadBooksData();
        await this.loadSVG();
        setTimeout(() => {
            this.addShelfNumbers();
            this.makeShelvesClickable();
        }, 500);
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => {
                if (this.shelfBooksSection) {
                    this.shelfBooksSection.style.display = 'none';
                }
            });
        }
    }
    async loadBooksData() {
        try {
            this.allBooks = await loadBooks();
        }
        catch (error) {
            this.allBooks = [];
        }
    }
    getBooksByGenre(genre) {
        return this.allBooks.filter(book => book.genres.some(g => g.toLowerCase().includes(genre.toLowerCase())));
    }
    async loadSVG() {
        return new Promise((resolve) => {
            this.svgObject = document.getElementById('library-map');
            if (!this.svgObject) {
                resolve();
                return;
            }
            const handleLoad = () => {
                try {
                    this.svgDocument = this.svgObject?.contentDocument ?? null;
                    resolve();
                }
                catch (error) {
                    resolve();
                }
            };
            this.svgObject.addEventListener('load', handleLoad);
            if (this.svgObject.contentDocument) {
                handleLoad();
            }
        });
    }
    addShelfNumbers() {
        if (!this.svgDocument)
            return;
        for (let i = 1; i <= 30; i++) {
            const shelfId = `shelf-${i}`;
            const shelfElement = this.svgDocument.getElementById(shelfId);
            if (shelfElement) {
                const svgElement = shelfElement;
                const bbox = svgElement.getBBox();
                const group = this.svgDocument.createElementNS('http://www.w3.org/2000/svg', 'g');
                const circle = this.svgDocument.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', (bbox.x + bbox.width / 2).toString());
                circle.setAttribute('cy', (bbox.y + bbox.height / 2).toString());
                circle.setAttribute('r', '12');
                circle.setAttribute('fill', '#000000');
                circle.setAttribute('pointer-events', 'none');
                circle.style.transition = 'all 0.3s ease';
                const text = this.svgDocument.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', (bbox.x + bbox.width / 2).toString());
                text.setAttribute('y', (bbox.y + bbox.height / 2).toString());
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('dominant-baseline', 'middle');
                text.setAttribute('font-size', '16');
                text.setAttribute('dy', '0.1em');
                text.setAttribute('font-family', 'Arial');
                text.setAttribute('font-weight', 'semi-bold');
                text.setAttribute('fill', '#ffffff');
                text.setAttribute('pointer-events', 'none');
                text.style.transition = 'all 0.3s ease';
                text.textContent = i.toString();
                group.appendChild(circle);
                group.appendChild(text);
                shelfElement.addEventListener('mouseenter', () => {
                    circle.setAttribute('fill', '#F5B342');
                    text.setAttribute('fill', '#56463E');
                });
                shelfElement.addEventListener('mouseleave', () => {
                    circle.setAttribute('fill', '#000000');
                    text.setAttribute('fill', '#ffffff');
                });
                shelfElement.appendChild(group);
            }
        }
    }
    makeShelvesClickable() {
        if (!this.svgDocument)
            return;
        this.shelves.forEach(shelf => {
            const element = this.svgDocument.getElementById(shelf.id);
            if (element) {
                element.setAttribute('style', 'cursor: pointer; pointer-events: bounding-box;');
                element.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    this.showShelfBooks(shelf.genre);
                });
            }
        });
    }
    showShelfBooks(genre) {
        if (!this.shelfTitle || !this.shelfBooksSection || !this.booksContainer || !this.template)
            return;
        const books = this.getBooksByGenre(genre);
        this.shelfTitle.textContent = `Книги на полке (${books.length})`;
        this.shelfBooksSection.style.display = 'block';
        this.booksContainer.innerHTML = '';
        if (books.length === 0) {
            this.booksContainer.innerHTML = '<div class="no-books">📚 На этой полке пока нет книг</div>';
            return;
        }
        const sortedBooks = [...books].sort((a, b) => {
            const ratingA = parseFloat(a.rating);
            const ratingB = parseFloat(b.rating);
            return ratingB - ratingA;
        });
        sortedBooks.forEach(book => {
            const fragment = createBookCard(book, this.template);
            const card = fragment.firstElementChild;
            if (card) {
                card.addEventListener('click', (e) => {
                    if (e.target.closest('.book-button'))
                        return;
                    window.location.href = `book.html?id=${book.id}`;
                });
                const button = card.querySelector('.book-button');
                if (button) {
                    button.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (book.inStock > 0) {
                            alert(`Книга "${book.title}" забронирована!`);
                        }
                        else {
                            alert(`Книга "${book.title}" добавлена в избранное!`);
                        }
                    });
                }
                this.booksContainer?.appendChild(card);
            }
        });
        setTimeout(() => {
            this.shelfBooksSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
}
document.addEventListener('DOMContentLoaded', () => {
    new LibraryMap();
});
//# sourceMappingURL=map.js.map