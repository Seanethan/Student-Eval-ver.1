document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('submitLogin');
    const studentInput = document.getElementById('studentNumber');
    const errorMsg = document.getElementById('errorMessage');

    loginBtn.addEventListener('click', async () => {
        const studentNo = studentInput.value.trim();

        if (studentNo === "") {
            errorMsg.classList.remove('hidden');
            studentInput.classList.add('border-red-500');
            return;
        }

        try {
            // Call backend API
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ studentNumber: studentNo })
            });

            const data = await response.json();

            if (data.success) {
                // Store student info
                localStorage.setItem("studentNo", studentNo);
                localStorage.setItem("studentInfo", JSON.stringify(data.student));
                
                errorMsg.classList.add('hidden');
                studentInput.classList.remove('border-red-500');
                
                window.location.href = "StudentDashboard.html";
            } else {
                errorMsg.textContent = data.error || 'Student not found';
                errorMsg.classList.remove('hidden');
                studentInput.classList.add('border-red-500');
            }
        } catch (error) {
            console.error('Login error:', error);
            errorMsg.textContent = 'Connection error. Please try again.';
            errorMsg.classList.remove('hidden');
        }
    });

    studentInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            loginBtn.click();
        }
    });
});