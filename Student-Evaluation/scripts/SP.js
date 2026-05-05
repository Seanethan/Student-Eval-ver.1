// Function to initialize all page components
const initApp = () => {
    setupLoginHandler();
    checkScrollPosition();
};

// Method to handle login button click
// Method to handle login button click
const setupLoginHandler = () => {
    const loginBtn = document.getElementById('logInBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            // This will redirect the user to LoginPage.html
            window.location.href = "Login.html"; 
        });
    }
};

// Method to change header style on scroll
const checkScrollPosition = () => {
    window.addEventListener('scroll', () => {
        const header = document.querySelector('header');
        if (window.scrollY > 50) {
            header.classList.add('bg-indigo-700', 'py-2');
            header.classList.remove('py-4');
        } else {
            header.classList.remove('bg-indigo-700', 'py-2');
            header.classList.add('py-4');
        }
    });
};

// Start the app
document.addEventListener('DOMContentLoaded', initApp);