interface UserData {
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
    readerLoginBtn?.addEventListener('click', () => {
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
        
        // Сохраняем пользователя в глобальный список
        const users: { phone: string; name: string }[] = JSON.parse(localStorage.getItem('library_users') || '[]');
        if (!users.find(u => u.phone === phone)) {
            users.push({ phone, name });
            localStorage.setItem('library_users', JSON.stringify(users));
        }
        
        const userData: UserData = {
            name: name,
            phone: phone,
            role: 'reader'
        };
        
        localStorage.setItem('library_user', JSON.stringify(userData));
        window.location.href = 'reader-cabinet.html';
    });

    // Вход библиотекаря
    librarianLoginBtn?.addEventListener('click', () => {
        const login = (document.getElementById('librarian-login') as HTMLInputElement).value;
        const password = (document.getElementById('librarian-password') as HTMLInputElement).value;
        
        if (login === 'admin' && password === 'admin') {
            const userData: UserData = {
                name: 'Библиотекарь',
                phone: '',
                role: 'librarian'
            };
            localStorage.setItem('library_user', JSON.stringify(userData));
            window.location.href = 'librarian-cabinet.html';
        } else {
            alert('Неверный логин или пароль');
        }
    });
});