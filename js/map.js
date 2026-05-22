"use strict";
class LibraryMap {
    svgDocument = null;
    svgObject = null;
    allBooks = [];
    shelfBooksSection = null;
    shelfTitle = null;
    booksContainer = null;
    locationSection = null;
    closeBtn = null;
    shelves = [
        { id: 'shelf-1', genre: 'Английская классика' },
        { id: 'shelf-2', genre: 'Английская классика' },
        { id: 'shelf-3', genre: 'Немецкая классика' },
        { id: 'shelf-4', genre: 'Французская классика' },
        { id: 'shelf-5', genre: 'Классика других стран' },
        { id: 'shelf-6', genre: 'Классика других стран' },
        { id: 'shelf-7', genre: 'Русская классика (проза)' },
        { id: 'shelf-8', genre: 'Русская классика (проза)' },
        { id: 'shelf-9', genre: 'Русская классика (поэзия)' },
        { id: 'shelf-10', genre: 'Русская классика (поэзия)' },
        { id: 'shelf-11', genre: 'На иностранных языках' },
        { id: 'shelf-12', genre: 'Биографии' },
        { id: 'shelf-13', genre: 'Нон-фикшн' },
        { id: 'shelf-14', genre: 'Наука' },
        { id: 'shelf-15', genre: 'Манга/комиксы' },
        { id: 'shelf-16', genre: 'Young adult литература' },
        { id: 'shelf-17', genre: 'Young adult литература' },
        { id: 'shelf-18', genre: 'Young adult литература' },
        { id: 'shelf-19', genre: 'Young adult литература' },
        { id: 'shelf-20', genre: 'Young adult литература' },
        { id: 'shelf-21', genre: 'Детские (0-3)' },
        { id: 'shelf-22', genre: 'Детские (3-10)' },
        { id: 'shelf-23', genre: 'Детские (10-16)' },
        { id: 'shelf-24', genre: 'Детские (10-16)' },
        { id: 'shelf-25', genre: 'Популярные' },
        { id: 'shelf-26', genre: 'Новинки' },
        { id: 'shelf-27', genre: 'Архив' },
        { id: 'shelf-28', genre: 'Архив' },
        { id: 'shelf-29', genre: 'Архив' },
        { id: 'shelf-30', genre: 'Архив' }
    ];
    shelfBooksMap = new Map();
    activeShelfId = null;
    shelfCircles = new Map();
    shelfTexts = new Map();
    isInitialized = false;
    constructor() {
        this.shelfBooksSection = document.getElementById('shelf-books-section');
        this.shelfTitle = document.getElementById('shelf-title');
        this.booksContainer = document.getElementById('shelf-books-container');
        this.locationSection = document.querySelector('.location-section');
        this.closeBtn = document.getElementById('close-shelf-btn');
        this.init();
        // Восстановление при возврате на страницу
        window.addEventListener('pageshow', (event) => {
            if (event.persisted || !this.isInitialized) {
                this.reinit();
            }
        });
    }
    async reinit() {
        // Очищаем старые данные
        this.shelfBooksMap.clear();
        this.shelfCircles.clear();
        this.shelfTexts.clear();
        this.activeShelfId = null;
        this.svgDocument = null;
        this.allBooks = [];
        this.isInitialized = false;
        // Прячем секцию с книгами, показываем расположение
        if (this.shelfBooksSection) {
            this.shelfBooksSection.style.display = 'none';
        }
        if (this.locationSection) {
            this.locationSection.style.display = 'block';
        }
        // Заново инициализируем
        await this.init();
    }
    async init() {
        if (this.isInitialized)
            return;
        await this.loadBooksData();
        this.distributeBooksToShelves();
        await this.loadSVG();
        setTimeout(() => {
            this.addShelfNumbers();
            this.makeShelvesClickable();
            this.isInitialized = true;
        }, 100);
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => {
                this.hideShelfBooks();
            });
        }
    }
    distributeBooksToShelves() {
        const shelvesByGenre = new Map();
        this.shelves.forEach(shelf => {
            if (!shelvesByGenre.has(shelf.genre)) {
                shelvesByGenre.set(shelf.genre, []);
            }
            const ids = shelvesByGenre.get(shelf.genre);
            if (ids) {
                ids.push(shelf.id);
            }
        });
        const specialGenres = new Set(['Архив', 'Популярные', 'Новинки']);
        const distributedBooks = new Set();
        for (const [genre, shelfIds] of shelvesByGenre.entries()) {
            if (specialGenres.has(genre))
                continue;
            const genreBooks = this.allBooks
                .filter(book => book.genres.includes(genre) && book.inStock > 0)
                .sort((a, b) => a.author.localeCompare(b.author));
            genreBooks.forEach(book => distributedBooks.add(book.id));
            const booksPerShelf = Math.ceil(genreBooks.length / shelfIds.length);
            shelfIds.forEach((shelfId, index) => {
                const start = index * booksPerShelf;
                const end = start + booksPerShelf;
                const shelfBooks = genreBooks.slice(start, end);
                this.shelfBooksMap.set(shelfId, shelfBooks);
            });
        }
        const popularBooks = this.allBooks
            .filter(book => book.inStock >= 5)
            .sort((a, b) => a.author.localeCompare(b.author));
        const popularShelves = shelvesByGenre.get('Популярные') || [];
        popularShelves.forEach(shelfId => {
            this.shelfBooksMap.set(shelfId, [...popularBooks]);
        });
        popularBooks.forEach(book => distributedBooks.add(book.id));
        const newBooks = [...this.allBooks]
            .filter(book => book.inStock > 0)
            .sort((a, b) => b.id - a.id)
            .slice(0, 5);
        const newShelves = shelvesByGenre.get('Новинки') || [];
        newShelves.forEach(shelfId => {
            this.shelfBooksMap.set(shelfId, [...newBooks]);
        });
        newBooks.forEach(book => distributedBooks.add(book.id));
        const archiveBooks = this.allBooks.filter(book => !distributedBooks.has(book.id) && book.inStock > 0);
        const archiveShelves = shelvesByGenre.get('Архив') || [];
        archiveShelves.forEach(shelfId => {
            this.shelfBooksMap.set(shelfId, [...archiveBooks]);
        });
    }
    async loadBooksData() {
        try {
            this.allBooks = await loadBooks();
        }
        catch (error) {
            this.allBooks = [];
        }
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
                circle.setAttribute('r', '9');
                circle.setAttribute('fill', '#000000');
                circle.setAttribute('pointer-events', 'none');
                const text = this.svgDocument.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', (bbox.x + bbox.width / 2).toString());
                text.setAttribute('y', (bbox.y + bbox.height / 2).toString());
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('dy', '0.35em');
                text.setAttribute('font-size', '12');
                text.setAttribute('font-family', 'Arial');
                text.setAttribute('font-weight', 'bold');
                text.setAttribute('fill', '#ffffff');
                text.setAttribute('pointer-events', 'none');
                text.textContent = i.toString();
                group.appendChild(circle);
                group.appendChild(text);
                this.shelfCircles.set(shelfId, circle);
                this.shelfTexts.set(shelfId, text);
                shelfElement.addEventListener('mouseenter', () => {
                    if (this.activeShelfId !== shelfId) {
                        circle.setAttribute('fill', '#F5B342');
                        text.setAttribute('fill', '#56463E');
                    }
                });
                shelfElement.addEventListener('mouseleave', () => {
                    if (this.activeShelfId !== shelfId) {
                        circle.setAttribute('fill', '#000000');
                        text.setAttribute('fill', '#ffffff');
                    }
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
                    this.showShelfBooks(shelf.id, shelf.genre);
                });
            }
        });
        this.makeLocationClickable();
    }
    makeLocationClickable() {
        const locationItems = document.querySelectorAll('.location-item');
        locationItems.forEach(item => {
            item.style.cursor = 'pointer';
            item.addEventListener('click', () => {
                const genreSpan = item.querySelector('.location-genre');
                const genreText = genreSpan?.textContent || '';
                const match = genreText.match(/^(\d+(?:-\d+)?)\./);
                if (match && match[1]) {
                    let shelfNumber;
                    if (match[1].includes('-')) {
                        const parts = match[1].split('-');
                        shelfNumber = parts[0] || '';
                    }
                    else {
                        shelfNumber = match[1];
                    }
                    if (shelfNumber) {
                        const shelfId = `shelf-${shelfNumber}`;
                        const shelf = this.shelves.find(s => s.id === shelfId);
                        if (shelf) {
                            this.showShelfBooks(shelf.id, shelf.genre);
                        }
                    }
                }
            });
        });
    }
    showShelfBooks(shelfId, genre) {
        if (!this.shelfTitle || !this.shelfBooksSection || !this.booksContainer)
            return;
        if (this.activeShelfId) {
            const prevCircle = this.shelfCircles.get(this.activeShelfId);
            const prevText = this.shelfTexts.get(this.activeShelfId);
            if (prevCircle)
                prevCircle.setAttribute('fill', '#000000');
            if (prevText)
                prevText.setAttribute('fill', '#ffffff');
        }
        this.activeShelfId = shelfId;
        const activeCircle = this.shelfCircles.get(shelfId);
        const activeText = this.shelfTexts.get(shelfId);
        if (activeCircle)
            activeCircle.setAttribute('fill', '#F5B342');
        if (activeText)
            activeText.setAttribute('fill', '#56463E');
        const books = this.shelfBooksMap.get(shelfId) || [];
        const shelfNumber = shelfId.replace('shelf-', '');
        if (genre === 'Архив') {
            this.shelfTitle.textContent = `КНИГИ В РАЗДЕЛЕ АРХИВ (ПОЛКИ 27-30)`;
        }
        else {
            this.shelfTitle.textContent = `КНИГИ В РАЗДЕЛЕ ${genre.toUpperCase()} (ПОЛКА ${shelfNumber})`;
        }
        this.booksContainer.innerHTML = '';
        if (books.length === 0) {
            this.booksContainer.innerHTML = '<div class="no-books-message">На этой полке пока нет книг</div>';
        }
        else {
            books.forEach((book, index) => {
                const bookItem = document.createElement('div');
                bookItem.className = 'book-list-item';
                bookItem.innerHTML = `
                    <span class="book-list-number">${index + 1}.</span>
                    <span class="book-list-title">${this.escapeHtml(book.title)}. ${this.escapeHtml(book.author)}</span>
                `;
                bookItem.addEventListener('click', () => {
                    window.location.href = `book.html?id=${book.id}`;
                });
                this.booksContainer?.appendChild(bookItem);
            });
        }
        if (this.locationSection) {
            this.locationSection.style.display = 'none';
        }
        this.shelfBooksSection.style.display = 'block';
    }
    hideShelfBooks() {
        if (this.shelfBooksSection) {
            this.shelfBooksSection.style.display = 'none';
        }
        if (this.locationSection) {
            this.locationSection.style.display = 'block';
        }
        if (this.activeShelfId) {
            const prevCircle = this.shelfCircles.get(this.activeShelfId);
            const prevText = this.shelfTexts.get(this.activeShelfId);
            if (prevCircle)
                prevCircle.setAttribute('fill', '#000000');
            if (prevText)
                prevText.setAttribute('fill', '#ffffff');
            this.activeShelfId = null;
        }
    }
    escapeHtml(str) {
        return str.replace(/[&<>]/g, function (m) {
            if (m === '&')
                return '&amp;';
            if (m === '<')
                return '&lt;';
            if (m === '>')
                return '&gt;';
            return m;
        });
    }
}
document.addEventListener('DOMContentLoaded', () => {
    new LibraryMap();
});
//# sourceMappingURL=map.js.map