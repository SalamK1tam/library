interface UserData {
    id: number;
    name: string;
    phone: string;
    role: string;
}

document.addEventListener('DOMContentLoaded', () => {
    // Проверяем, есть ли сохраненный вход
    const savedUser = localStorage.getItem('library_user');
    if (savedUser) {
        const user: UserData = JSON.parse(savedUser);
        if (user.role === 'reader') {
            window.location.href = 'reader-cabinet.html';
        } else if (user.role === 'librarian') {
            window.location.href = 'librarian-cabinet.html';
        }
    }

    const readerTab = document.querySelector('[data-role="reader"]') as HTMLButtonElement;
    const librarianTab = document.querySelector('[data-role="librarian"]') as HTMLButtonElement;
    const readerForm = document.getElementById('reader-form') as HTMLDivElement;
    const librarianForm = document.getElementById('librarian-form') as HTMLDivElement;
    const readerLoginBtn = document.getElementById('reader-login-btn') as HTMLButtonElement;
    const librarianLoginBtn = document.getElementById('librarian-login-btn') as HTMLButtonElement;

    if (readerTab && librarianTab && readerForm && librarianForm) {
        readerTab.addEventListener('click', () => {
            readerTab.classList.add('active');
            librarianTab.classList.remove('active');
            readerForm.style.display = 'block';
            librarianForm.style.display = 'none';
        });

        librarianTab.addEventListener('click', () => {
            librarianTab.classList.add('active');
            readerTab.classList.remove('active');
            readerForm.style.display = 'none';
            librarianForm.style.display = 'block';
        });
    }

    // Вход читателя
    readerLoginBtn?.addEventListener('click', async () => {
        const name = (document.getElementById('reader-name') as HTMLInputElement).value.trim();
        const phone = (document.getElementById('reader-phone') as HTMLInputElement).value.trim();
        
        if (!name) {
            alert('Введите ваше имя');
            return;
        }
        if (!phone) {
            alert('Введите номер телефона');
            return;
        }
        
        // Сохраняем читателя
        try {
            const response = await fetch(`${API_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone, role: 'reader' })
            });
            
            const user = await response.json();
            
            localStorage.setItem('library_user', JSON.stringify({
                id: user.id,
                name: user.name,
                phone: user.phone,
                role: user.role
            }));
            
            window.location.href = 'reader-cabinet.html';
        } catch (error) {
            console.error('Ошибка входа:', error);
            alert('Ошибка при входе. Попробуйте позже.');
        }
    });

    // Вход библиотекаря
    librarianLoginBtn?.addEventListener('click', async () => {
        const login = (document.getElementById('librarian-login') as HTMLInputElement).value;
        const password = (document.getElementById('librarian-password') as HTMLInputElement).value;
        
        try {
            const response = await fetch(`${API_URL}/librarian/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login, password })
            });
            
            if (!response.ok) {
                const error = await response.json();
                alert(error.error || 'Ошибка входа');
                return;
            }
            
            const librarian = await response.json();
            
            const userData: UserData = {
                id: librarian.id,
                name: librarian.name,
                phone: '',
                role: 'librarian'
            };
            
            localStorage.setItem('library_user', JSON.stringify(userData));
            window.location.href = 'librarian-cabinet.html';
        } catch (error) {
            console.error('Ошибка входа:', error);
            alert('Ошибка при входе');
        }
    });
});