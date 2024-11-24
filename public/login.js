const loginForm = document.getElementById('login-form');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const response = await fetch('http://localhost:4000/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
        const data = await response.json();
        if (data.token) {
            localStorage.setItem('token', data.token);  // Store JWT in localStorage
            window.location.href = 'index.html';  // Redirect to the main page after login
        } else {
            alert('Login failed. No token received.');
        }
    } else {
        alert('Login failed. Please check your credentials.');
    }

});
