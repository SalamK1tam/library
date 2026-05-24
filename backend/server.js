const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Подключение к PostgreSQL
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'library_db',
    password: '12345', 
    port: 5432,
});

// API: получить все книги
app.get('/api/books', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Books ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка загрузки книг' });
    }
});

// API: получить книгу по id
app.get('/api/books/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM Books WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Книга не найдена' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка загрузки книги' });
    }
});

// Проверка, забронирована ли книга пользователем
app.get('/api/users/:userId/reservations/:bookId', async (req, res) => {
    const { userId, bookId } = req.params;
    try {
        const result = await pool.query(
            'SELECT * FROM Reservations WHERE user_id = $1 AND book_id = $2',
            [userId, bookId]
        );
        res.json({ isReserved: result.rows.length > 0 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка проверки бронирования' });
    }
});

// Проверка, в избранном ли книга у пользователя
app.get('/api/users/:userId/favorites/:bookId', async (req, res) => {
    const { userId, bookId } = req.params;
    try {
        const result = await pool.query(
            'SELECT * FROM Favorites WHERE user_id = $1 AND book_id = $2',
            [userId, bookId]
        );
        res.json({ isFavorited: result.rows.length > 0 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка проверки избранного' });
    }
});

// API: найти или создать пользователя (читателя)
app.post('/api/users', async (req, res) => {
    const { name, phone, role } = req.body;
    
    try {
        // Проверяем, есть ли пользователь с таким телефоном
        let result = await pool.query('SELECT * FROM Users WHERE phone = $1', [phone]);
        
        if (result.rows.length > 0) {
            // Пользователь существует
            res.json(result.rows[0]);
        } else {
            // Создаём нового пользователя
            const insertResult = await pool.query(
                'INSERT INTO Users (name, phone, role) VALUES ($1, $2, $3) RETURNING *',
                [name, phone, role || 'reader']
            );
            res.json(insertResult.rows[0]);
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка при работе с пользователем' });
    }
});

// API: получить всех пользователей (для библиотекаря)
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, phone, role FROM Users ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка загрузки пользователей' });
    }
});

// API: получить пользователя по id
app.get('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT id, name, phone, role FROM Users WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка загрузки пользователя' });
    }
});

// API: вход библиотекаря
app.post('/api/librarian/login', async (req, res) => {
    const { login, password } = req.body;
    
    try {
        const result = await pool.query('SELECT * FROM Librarians WHERE login = $1', [login]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Неверный логин' });
        }
        
        const librarian = result.rows[0];
        
        if (librarian.password_hash !== password) {
            return res.status(401).json({ error: 'Неверный пароль' });
        }
        
        res.json({
            id: librarian.id,
            name: librarian.login, 
            role: 'librarian'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка входа' });
    }
});

// БРОНИРОВАНИЕ

// Получить бронирования пользователя
app.get('/api/users/:userId/reservations', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query(
            'SELECT book_id FROM Reservations WHERE user_id = $1',
            [userId]
        );
        res.json(result.rows.map(r => r.book_id));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка загрузки бронирований' });
    }
});

// Добавить бронирование
app.post('/api/reservations', async (req, res) => {
    const { userId, bookId } = req.body;
    try {
        await pool.query(
            'INSERT INTO Reservations (user_id, book_id) VALUES ($1, $2)',
            [userId, bookId]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка бронирования' });
    }
});

// Отменить бронирование
app.delete('/api/reservations', async (req, res) => {
    const { userId, bookId } = req.body;
    try {
        await pool.query(
            'DELETE FROM Reservations WHERE user_id = $1 AND book_id = $2',
            [userId, bookId]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка отмены бронирования' });
    }
});

// ИЗБРАННОЕ

// Получить избранное пользователя
app.get('/api/users/:userId/favorites', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query(
            'SELECT book_id FROM Favorites WHERE user_id = $1',
            [userId]
        );
        res.json(result.rows.map(r => r.book_id));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка загрузки избранного' });
    }
});

// Добавить в избранное
app.post('/api/favorites', async (req, res) => {
    const { userId, bookId } = req.body;
    try {
        await pool.query(
            'INSERT INTO Favorites (user_id, book_id) VALUES ($1, $2)',
            [userId, bookId]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка добавления в избранное' });
    }
});

// Удалить из избранного
app.delete('/api/favorites', async (req, res) => {
    const { userId, bookId } = req.body;
    try {
        await pool.query(
            'DELETE FROM Favorites WHERE user_id = $1 AND book_id = $2',
            [userId, bookId]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка удаления из избранного' });
    }
});

// ВЫДАЧА

// Получить выданные книги пользователя
app.get('/api/users/:userId/loans', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query(
            'SELECT book_id FROM Loans WHERE user_id = $1',
            [userId]
        );
        res.json(result.rows.map(r => r.book_id));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка загрузки выдач' });
    }
});

// Выдать книгу (из бронирования)
app.post('/api/loans', async (req, res) => {
    const { userId, bookId } = req.body;
    try {
        // Удаляем бронирование
        await pool.query(
            'DELETE FROM Reservations WHERE user_id = $1 AND book_id = $2',
            [userId, bookId]
        );
        
        // Уменьшаем количество
        await pool.query('UPDATE Books SET in_stock = in_stock - 1 WHERE id = $1', [bookId]);
        
        // Добавляем в выдачу
        await pool.query(
            'INSERT INTO Loans (user_id, book_id) VALUES ($1, $2)',
            [userId, bookId]
        );
        
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка выдачи книги' });
    }
});

// Вернуть книгу
app.delete('/api/loans', async (req, res) => {
    const { userId, bookId } = req.body;
    try {
        // Удаляем из выдачи
        await pool.query(
            'DELETE FROM Loans WHERE user_id = $1 AND book_id = $2',
            [userId, bookId]
        );
        
        // Увеличиваем количество
        await pool.query('UPDATE Books SET in_stock = in_stock + 1 WHERE id = $1', [bookId]);
        
        // Добавляем в историю
        await pool.query(
            'INSERT INTO History (user_id, book_id) VALUES ($1, $2)',
            [userId, bookId]
        );
        
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка возврата книги' });
    }
});

app.get('/api/users/:userId/history', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query(
            'SELECT book_id FROM History WHERE user_id = $1',
            [userId]
        );
        res.json(result.rows.map(r => r.book_id));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка загрузки истории' });
    }
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});