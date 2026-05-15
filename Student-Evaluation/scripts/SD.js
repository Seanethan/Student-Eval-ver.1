const studentNo = localStorage.getItem("studentNo");
const studentInfo = JSON.parse(localStorage.getItem("studentInfo") || "{}");

if (studentNo) {
    document.getElementById("studentDisplay").textContent = studentNo;
}

// LOGOUT
document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("studentNo");
    localStorage.removeItem("studentInfo");
    window.location.href = "../pages/Login.html";
});

// START BUTTON
document.getElementById("startBtn").addEventListener("click", () => {
    window.location.href = "../pages/EvalPage.html";
});

// ======================== PROFESSOR COLORS ========================
const professorColors = [
    { bg: "from-indigo-500 to-purple-600", initials: "NB" },
    { bg: "from-emerald-500 to-teal-600", initials: "AB" },
    { bg: "from-rose-500 to-pink-600", initials: "RB" },
    { bg: "from-amber-500 to-orange-600", initials: "P4" },
    { bg: "from-cyan-500 to-blue-600", initials: "P5" }
];

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

// Fetch professors from backend
async function fetchProfessors() {
    try {
        const response = await fetch('http://localhost:3000/api/professors/student-professors', {
            headers: {
                'x-student-number': studentNo
            }
        });
        const data = await response.json();
        
        if (data.success) {
            renderProfessorsList(data.professors);
        } else {
            // Fallback to static data if API fails
            renderProfessorsList(getStaticProfessors());
        }
    } catch (error) {
        console.error('Error fetching professors:', error);
        // Fallback to static data
        renderProfessorsList(getStaticProfessors());
    }
}

function getStaticProfessors() {
    return [
        { name: "Professor 1", course: "IM101", email: "prof1@qcu.edu", colorIndex: 0, evaluated: false },
        { name: "Professor 2", course: "CS 202", email: "prof2@qcu.edu", colorIndex: 1, evaluated: false },
        { name: "Professor 3", course: "IT 305", email: "prof3@qcu.edu", colorIndex: 2, evaluated: false },
        { name: "Professor 4", course: "DS 401", email: "prof4@qcu.edu", colorIndex: 3, evaluated: false },
        { name: "Professor 5", course: "AI 501", email: "prof5@qcu.edu", colorIndex: 4, evaluated: false }
    ];
}

function renderProfessorsList(professors) {
    const container = document.getElementById('professorsListContainer');
    if (!container) return;
    container.innerHTML = '';
    
    professors.forEach((prof, index) => {
        const colorIndex = index % professorColors.length;
        const colorData = professorColors[colorIndex];
        const initials = getInitials(prof.name);
        
        const div = document.createElement('div');
        div.className = `w-full text-left px-3 py-2 rounded-xl mb-2 flex items-center gap-3 bg-gray-100 text-gray-700`;
        div.innerHTML = `
            <div class="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br ${colorData.bg} flex items-center justify-center text-white font-bold shadow-sm text-xs">${initials}</div>
            <div class="flex-1 min-w-0">
                <div class="flex justify-between items-center">
                    <span class="font-semibold text-sm">${prof.name}</span>
                    <span class="text-xs text-gray-500">${prof.course}</span>
                </div>
                ${prof.email ? `<div class="text-xs text-gray-400 truncate">${prof.email}</div>` : ''}
                ${prof.evaluated ? '<span class="text-xs text-green-500">✓ Evaluated</span>' : ''}
            </div>
        `;
        container.appendChild(div);
    });
}

// DATE AND TIME
function updateDateTime() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const year = now.getFullYear();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const header = document.getElementById('dateTimeDisplayHeader');
    if (header) header.textContent = `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
}

// INITIALIZE
fetchProfessors();
updateDateTime();
setInterval(updateDateTime, 1000);

// Check if returning from evaluation completion
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('completed') === 'true') {
    // Refresh professor list to show updated evaluation status
    setTimeout(fetchProfessors, 500);
}