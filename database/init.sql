-- psql -U postgres -f database/init.sql для запуска
-- Структура БД библиотеки

-- Таблица librarians
CREATE TABLE librarians (
    id SERIAL PRIMARY KEY,
    login VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL
);

-- Таблица users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    role VARCHAR(20) NOT NULL
);

-- Таблица books
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    cover VARCHAR(500) NOT NULL,
    rating NUMERIC(3,1) NOT NULL,
    in_stock INTEGER NOT NULL,
    genres TEXT[] NOT NULL
);

-- Таблица favorites
CREATE TABLE favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    book_id INTEGER NOT NULL
);

-- Таблица reservations
CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    book_id INTEGER NOT NULL
);

-- Таблица loans
CREATE TABLE loans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    book_id INTEGER NOT NULL
);

-- Таблица history
CREATE TABLE history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    book_id INTEGER NOT NULL
);

-- Данные из JSON (20 книг) в бд
INSERT INTO books (id, title, author, cover, rating, in_stock, genres) VALUES
(1, 'Гордость и предубеждение', 'Джейн Остен', 'img/book1.jpg', 4.1, 2, ARRAY['Английская классика', 'Роман', 'Классика']),
(2, 'Стихотворения и поэмы', 'Александр Пушкин', 'img/book2.jpg', 4.7, 3, ARRAY['Русская классика (поэзия)', 'Поэзия', 'Классика', 'Русская литература']),
(3, 'Перекресток воронов', 'Анджей Сапковский', 'img/book3.jpg', 4.6, 5, ARRAY['Young adult литература', 'Фэнтези', 'Приключения']),
(4, 'Самый богатый человек в Вавилоне', 'Джордж Сэмюэль Клейсон', 'img/book4.jpg', 4.1, 1, ARRAY['Нон-фикшн', 'Саморазвитие', 'Бизнес']),
(5, 'Посторонний', 'Альбер Камю', 'img/book5.jpg', 4.0, 4, ARRAY['Философия', 'Роман', 'Классика']),
(6, '1984', 'Джордж Оруэлл', 'img/book6.jpg', 4.3, 5, ARRAY['Английская классика', 'Классика', 'Антиутопия']),
(7, 'Девочка с лисьим хвостом. Повесть', 'Сон Вон Пхён', 'img/book7.jpg', 3.9, 1, ARRAY['Детские (10-16)', 'Фэнтези', 'Детские']),
(8, 'Почтальонша', 'Франческа Джанноне', 'img/book8.jpg', 4.5, 2, ARRAY['Биографии', 'Роман', 'Биография']),
(9, 'Скорбь Сатаны', 'Мария Корелли', 'img/book9.jpg', 4.7, 5, ARRAY['Английская классика', 'Классика', 'Роман']),
(10, 'Коралина', 'Нил Гейман', 'img/book10.jpg', 4.3, 3, ARRAY['Детские (10-16)', 'Фэнтези', 'Детские']),
(11, 'Говори красиво и уверенно. Постановка голоса и речи', 'Евгения Шестакова', 'img/book11.jpg', 3.8, 1, ARRAY['Нон-фикшн', 'Филология', 'Саморазвитие']),
(12, 'Вечера на хуторе близ Диканьки', 'Николай Гоголь', 'img/book12.jpg', 5.0, 3, ARRAY['Русская классика (проза)', 'Классика', 'Русская литература', 'Мистика']),
(13, 'Сто лет недосказанности. Квантовая механика для всех в 25 эссе', 'Алексей Семихатов', 'img/book13.jpg', 4.8, 1, ARRAY['Нон-фикшн', 'Наука']),
(14, 'Морфий', 'Михаил Булгаков', 'img/book14.jpg', 4.4, 2, ARRAY['Русская классика (проза)', 'Классика', 'Русская литература']),
(15, 'Метро 2033', 'Дмитрий Глуховский', 'img/book15.jpg', 4.0, 2, ARRAY['Young adult литература', 'Русская литература', 'Антиутопия']),
(16, 'Убийство в "Восточном экспрессе"', 'Агата Кристи', 'img/book16.jpg', 4.5, 4, ARRAY['Английская классика', 'Детектив', 'Классика']),
(17, 'Синие бабочки', 'Джек Тодд', 'img/book17.jpg', 4.1, 1, ARRAY['Young adult литература', 'Роман']),
(18, 'Little Prince. A1 / Маленький принц', 'Антуан де Сент-Экзюпери', 'img/book18.jpg', 4.3, 2, ARRAY['На иностранных языках', 'Детские (10-16)', 'Детские', 'Саморазвитие']),
(19, 'Сумерки', 'Стефани Майер', 'img/book19.jpg', 4.0, 3, ARRAY['Young adult литература', 'Роман', 'Мистика']),
(20, 'Во весь голос', 'Владимир Маяковский', 'img/book20.jpg', 4.5, 4, ARRAY['Русская классика (поэзия)', 'Поэзия', 'Классика', 'Русская литература']);