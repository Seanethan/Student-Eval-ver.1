console.log("EP.js loaded");


// ======================== STUDENT DATA ========================
const studentNo = localStorage.getItem("studentNo");
if (studentNo) {
    document.getElementById("studentDisplay").textContent = studentNo;
}

// LOGOUT
document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("studentNo");
    localStorage.removeItem("studentInfo");
    window.location.href = "../pages/Login.html";
});

// ======================== DATA MODELS ========================
const professorColors = [
    { bg: "from-indigo-500 to-purple-600", initials: "NB" },
    { bg: "from-emerald-500 to-teal-600", initials: "AB" },
    { bg: "from-rose-500 to-pink-600", initials: "RB" },
    { bg: "from-amber-500 to-orange-600", initials: "P4" },
    { bg: "from-cyan-500 to-blue-600", initials: "P5" }
];

let professors = [];
let questions = [];
let evaluationsStore = {};
let currentProfessorIndex = 0;
let currentProfessor = null;
let currentPage = 0;

// Fetch data from backend
async function fetchInitialData() {
    try {
        // Fetch professors
        const profResponse = await fetch('http://localhost:3000/api/professors/student-professors', {
            headers: { 'x-student-number': studentNo }
        });
        const profData = await profResponse.json();
        
        console.log("PROF DATA:", profData);

// After line 28 (after const profData = await profResponse.json();)
console.log("RAW PROF DATA FROM BACKEND:", JSON.stringify(profData, null, 2));


        if (profData.success && profData.professors.length > 0) {
            professors = profData.professors.map((prof, index) => {
    console.log("Mapping professor:", prof); // Debug log
    
    return {
        name: prof.NAME || prof.name || '',
        course: prof.SUBJECT_CODE || prof.subject_code || '',
        email: `${prof.NAME || ''}@qcu.edu`, // Generate email from name
        enrollmentId: prof.ENROLLMENT_ID || prof.enrollment_id, // Use UPPERCASE from Oracle
        classId: prof.CLASS_ID,
        subjectCode: prof.SUBJECT_CODE,
        colorIndex: index % professorColors.length,
        evaluated: prof.EVALUATED === 1 || prof.evaluated === 1
    };
});

console.log("MAPPED PROFESSORS:", professors); // Debug log
            console.log("PROFESSORS AFTER MAPPING:", professors);
        } else {
            console.log("USING FALLBACK PROFESSORS");
            professors = getFallbackProfessors();
        }

        // Fetch questions
        const questResponse = await fetch('http://localhost:3000/api/evaluations/questions');
        const questData = await questResponse.json();
        
        console.log("QUEST DATA:", questData);

        if (questData.success && questData.categories && questData.categories.length > 0) {
            questions = [];
            questData.categories.forEach(category => {
                category.questions.forEach(q => {
                    questions.push(q.questionText);
                });
            });
            console.log("QUESTIONS FROM DB:", questions.length);
        } else {
            console.log("USING FALLBACK QUESTIONS");
            questions = getStaticQuestions();
        }

        // Start with first unevaluated professor
        currentProfessorIndex = professors.findIndex(p => !p.evaluated);
        if (currentProfessorIndex === -1) currentProfessorIndex = 0;
        currentProfessor = professors[currentProfessorIndex];
        
        console.log("CURRENT PROFESSOR SET TO:", currentProfessor);
        
        init();
    } catch (error) {
        console.error('Error fetching data:', error);
        professors = getFallbackProfessors();
        questions = getStaticQuestions();
        currentProfessor = professors[0];
        console.log("FALLBACK PROFESSOR:", currentProfessor);
        init();
    }
}

function getFallbackProfessors() {
    return [
        { name: "Nicky Balew", course: "IM101", email: "nickybalew@gmail.com", enrollmentId: 1, colorIndex: 0, evaluated: false },
        { name: "Awee Balew", course: "CS 202", email: "awee.balew@qcu.edu", enrollmentId: 2, colorIndex: 1, evaluated: false },
        { name: "Redenton Balew", course: "IT 305", email: "redenton@qcu.edu", enrollmentId: 3, colorIndex: 2, evaluated: false },
        { name: "Professor 4", course: "DS 401", email: "prof4@qcu.edu", enrollmentId: 4, colorIndex: 3, evaluated: false },
        { name: "Professor 5", course: "AI 501", email: "prof5@qcu.edu", enrollmentId: 5, colorIndex: 4, evaluated: false }
    ];
}

function getStaticQuestions() {
    return [
        "The professor demonstrates thorough knowledge of the subject matter and explains concepts clearly.",
        "The professor uses effective teaching methods and engages students in learning.",
        "The professor provides clear explanations and examples.",
        "The professor encourages active participation in class.",
        "The professor relates the subject matter to real-world applications.",
        "The professor is punctual, prepared, and organized for each class session.",
        "The professor treats students with respect and fairness at all times.",
        "The professor follows the prescribed course syllabus.",
        "The professor returns graded assignments and exams promptly.",
        "The professor manages class time effectively.",
        "The professor is approachable and responsive to student concerns and questions.",
        "The professor exhibits a positive and encouraging attitude toward student learning.",
        "The professor inspires students to do their best work.",
        "The professor maintains a professional demeanor at all times.",
        "The professor is open to feedback and suggestions from students.",
        "The professor maintains a professional appearance appropriate for an academic setting.",
        "The professor projects a confident and professional image.",
        "The professor observes proper grooming and dress code.",
        "The professor's appearance commands respect in the classroom.",
        "The professor sets a good example through professional posture and poise."
    ];
}

function getCurrentAnswers() {
    if (!currentProfessor) return [];
    if (!evaluationsStore[currentProfessor.name]) {
        evaluationsStore[currentProfessor.name] = { answers: new Array(questions.length).fill(null) };
    }
    return evaluationsStore[currentProfessor.name].answers;
}

function setAnswer(questionIdx, rating) {
    const answers = getCurrentAnswers();
    answers[questionIdx] = rating;
    evaluationsStore[currentProfessor.name].answers = answers;
    renderCurrentPageQuestions();
    updateProgressBarColors();
    updateSubmitButtonState();
    updatePageWarnings();
}

function isPageComplete(pageNum) {
    const answers = getCurrentAnswers();
    const start = pageNum * 5;
    const end = start + 5;
    const pageAnswers = answers.slice(start, end);
    return pageAnswers.length === 5 && pageAnswers.every(a => a !== null);
}

function isAllQuestionsComplete() {
    const answers = getCurrentAnswers();
    return answers.length > 0 && answers.every(a => a !== null);
}

function isRemarksComplete() {
    const remarks = document.getElementById('remarksInput');
    return remarks && remarks.value.trim().length > 0;
}

function updateSubmitButtonState() {
    const submitBtn = document.getElementById('submitEvalBtn');
    const questionsDone = isAllQuestionsComplete();
    const remarksDone = isRemarksComplete();

    if (submitBtn) {
        if (questionsDone && remarksDone) {
            submitBtn.disabled = false;
            submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            document.getElementById('submitEnableBadge').innerHTML = '<span class="text-green-600 text-xs font-semibold">Ready to submit!</span>';
        } else {
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
            
            if (!questionsDone) {
                const answeredCount = getCurrentAnswers().filter(a => a !== null).length;
                document.getElementById('submitEnableBadge').innerHTML = `<span class="text-orange-500 text-xs">${answeredCount}/${questions.length} answered.</span>`;
            } else {
                document.getElementById('submitEnableBadge').innerHTML = '<span class="text-orange-500 text-xs font-semibold">Please add your remarks.</span>';
            }
        }
    }
}

function updatePageWarnings() {
    for (let i = 0; i <= 4; i++) {
        const warningEl = document.getElementById(`page${i}Warning`);
        if (warningEl) {
            warningEl.classList.toggle('hidden', i !== currentPage);
            
            const isComplete = (i === 4) ? isRemarksComplete() : isPageComplete(i);

            if (isComplete) {
                warningEl.classList.remove('warning-badge');
                warningEl.classList.add('bg-green-100', 'text-green-700', 'px-3', 'py-1', 'rounded-full');
                warningEl.textContent = "Section Complete";
            } else {
                warningEl.classList.add('warning-badge');
                warningEl.classList.remove('bg-green-100', 'text-green-700', 'px-3', 'py-1', 'rounded-full');
                warningEl.textContent = (i === 4) ? "Please write your remarks" : "Please answer all 5 questions";
            }
        }
    }
}

function updateProgressBarColors() {
    for (let i = 0; i <= 4; i++) {
        const tab = document.getElementById(`tabPage${i}`);
        const connector = document.getElementById(`connector${i-1}`);
        if (tab) {
            tab.classList.remove('green', 'red', 'white');
            if (i === currentPage) {
                tab.classList.add('white');
            } else {
                const isComplete = (i === 4) ? isRemarksComplete() : isPageComplete(i);
                tab.classList.add(isComplete ? 'green' : 'red');
            }
        }
        if (connector && i > 0) {
            connector.classList.remove('green', 'red', 'white');
            let allPrevComplete = true;
            for (let j = 0; j < i; j++) {
                const prevStepDone = (j === 4) ? isRemarksComplete() : isPageComplete(j);
                if (!prevStepDone) allPrevComplete = false;
            }
            if (allPrevComplete && currentPage >= i) {
                connector.classList.add('green');
            } else if (currentPage >= i) {
                connector.classList.add('white');
            } else {
                connector.classList.add('red');
            }
        }
    }
}

function renderCurrentPageQuestions() {
    const answers = getCurrentAnswers();
    const page0Container = document.getElementById('questionsPage0');
    const page1Container = document.getElementById('questionsPage1');
    const page2Container = document.getElementById('questionsPage2');
    const page3Container = document.getElementById('questionsPage3');
    
    if (page0Container) page0Container.innerHTML = renderQuestionsForIndices([0, 1, 2, 3, 4], answers);
    if (page1Container) page1Container.innerHTML = renderQuestionsForIndices([5, 6, 7, 8, 9], answers);
    if (page2Container) page2Container.innerHTML = renderQuestionsForIndices([10, 11, 12, 13, 14], answers);
    if (page3Container) page3Container.innerHTML = renderQuestionsForIndices([15, 16, 17, 18, 19], answers);
    
    attachRatingEvents();
    updatePageWarnings();
    updateSubmitButtonState();
}

function renderQuestionsForIndices(indices, answers) {
    let html = '';
    for (let idx of indices) {
        const currentRating = answers[idx];
        let ratingHtml = '';
        for (let rate = 1; rate <= 5; rate++) {
            const isSelected = (currentRating === rate);
            const selectedClass = isSelected ? 'selected bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200';
            ratingHtml += `
                <label class="rating-option inline-flex items-center justify-center w-10 h-10 rounded-full border cursor-pointer transition ${selectedClass}" data-qidx="${idx}" data-rate="${rate}">
                    <input type="radio" name="q${idx}" value="${rate}" ${isSelected ? 'checked' : ''} class="hidden">
                    <span class="text-sm font-bold">${rate}</span>
                </label>
            `;
        }
        const questionText = questions[idx] || '';
        html += `
            <div class="question-card bg-white rounded-xl p-6 border border-gray-200 flex justify-between items-center gap-4 shadow-sm">
                <p class="text-gray-800 text-base flex-1"><span class="font-bold mr-2 text-indigo-600">${idx+1}.</span> ${escapeHtml(questionText)}</p>
                <div class="flex items-center gap-3 shrink-0">
                    <span class="text-[10px] font-bold text-gray-400 uppercase">Poor</span>
                    <div class="flex gap-2">
                        ${ratingHtml}
                    </div>
                    <span class="text-[10px] font-bold text-gray-400 uppercase">Excellent</span>
                </div>
            </div>
        `;
    }
    return html;
}

function attachRatingEvents() {
    document.querySelectorAll('.rating-option').forEach(label => {
        label.removeEventListener('click', ratingClickHandler);
        label.addEventListener('click', ratingClickHandler);
    });
}

function ratingClickHandler() {
    const rate = parseInt(this.getAttribute('data-rate'));
    const qidx = parseInt(this.getAttribute('data-qidx'));
    setAnswer(qidx, rate);
    const parent = this.parentElement;
    parent.querySelectorAll('.rating-option').forEach(lbl => {
        lbl.classList.remove('selected', 'bg-indigo-600', 'text-white', 'border-indigo-600');
        lbl.classList.add('bg-gray-100', 'text-gray-700', 'border-gray-200');
    });
    this.classList.add('selected', 'bg-indigo-600', 'text-white', 'border-indigo-600');
}

function goToPage(pageNum) {
    if (pageNum < 0 || pageNum > 4) return;
    
    document.querySelectorAll('.page-content').forEach(page => page.classList.add('hidden'));
    document.getElementById(`page${pageNum}`).classList.remove('hidden');
    
    currentPage = pageNum;

    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitEvalBtn');
    const prevBtn = document.getElementById('prevBtn');

    if (pageNum === 4) {
        nextBtn.classList.add('hidden');
        submitBtn.classList.remove('hidden');
    } else {
        nextBtn.classList.remove('hidden');
        submitBtn.classList.add('hidden');
    }

    prevBtn.disabled = (pageNum === 0);

    updateProgressBarColors();
    updatePageWarnings();
    document.getElementById('mainContentArea').scrollTop = 0;
}

async function submitAndContinue() {
    if (!isAllQuestionsComplete() || !isRemarksComplete()) {
        showToast("Cannot submit! Please answer all questions first.");
        return;
    }

    if (!currentProfessor || !currentProfessor.enrollmentId) {
        console.error("Missing enrollmentId:", currentProfessor);
        showToast("Enrollment ID missing. Cannot submit.");
        return;
    }

    const responses = getCurrentAnswers().map((rating, index) => ({
        questionId: index + 1,
        rating
    }));

    const body = {
        enrollmentId: currentProfessor.enrollmentId,
        responses,
        remarks: document.getElementById('remarksInput')?.value || ""
    };

    console.log("SUBMIT PAYLOAD:", body);

    try {
        const res = await fetch('http://localhost:3000/api/evaluations/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-student-number': studentNo
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("Backend error:", errorText);
            showToast("Submission failed. Check console.");
            return;
        }

        const data = await res.json();
        console.log("SUBMIT RESPONSE:", data);

        professors[currentProfessorIndex].evaluated = true;

        showToast(`Evaluation completed for ${currentProfessor.name}!`);

        // Move to next professor
        let nextIndex = professors.findIndex(p => !p.evaluated);

        if (nextIndex !== -1) {
            currentProfessorIndex = nextIndex;
            currentProfessor = professors[currentProfessorIndex];
            currentPage = 0;

            document.getElementById('remarksInput').value = "";

            document.getElementById('currentProfNameDisplay').innerText = currentProfessor.name;
            document.getElementById('currentCourseDisplay').innerText = `Course Code: ${currentProfessor.course}`;
            document.getElementById('currentEmailDisplay').innerText = currentProfessor.email || '';

            updateProfessorAvatar(currentProfessor);

            evaluationsStore[currentProfessor.name] = {
                answers: new Array(questions.length).fill(null)
            };

            goToPage(0);
            renderCurrentPageQuestions();
            updateSubmitButtonState();
            renderProfessorsList();

        } else {
            showToast("All professors evaluated. Thank you!");
            setTimeout(() => {
                window.location.href = "StudentDashboard.html?completed=true";
            }, 1500);
        }

    } catch (error) {
        console.error("Submit error:", error);
        showToast("Network error. Try again.");
    }
}

function getInitials(name) {
    if (!name) return "??";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

function updateProfessorAvatar(prof) {
    if (!prof) return;
    const avatarDiv = document.getElementById('currentProfAvatar');
    const colorData = professorColors[prof.colorIndex % professorColors.length];
    const initials = getInitials(prof.name);
    if (avatarDiv) {
        avatarDiv.className = `prof-avatar-large bg-gradient-to-br ${colorData.bg} shadow-lg mb-4`;
        avatarDiv.textContent = initials;
    }
}

function switchProfessor(prof, index) {
    if (prof.evaluated) {
        showToast(`${prof.name} has already been evaluated.`);
        return;
    }
    currentProfessorIndex = index;
    currentProfessor = prof;
    currentPage = 0;
    
    document.getElementById('currentProfNameDisplay').innerText = prof.name;
    document.getElementById('currentCourseDisplay').innerText = `Course Code: ${prof.course}`;
    document.getElementById('currentEmailDisplay').innerText = prof.email || '';
    updateProfessorAvatar(prof);
    
    const remarksBox = document.getElementById('remarksInput');
    if (remarksBox) {
        remarksBox.value = "";
    }

    if (!evaluationsStore[currentProfessor.name]) {
        evaluationsStore[currentProfessor.name] = { answers: new Array(questions.length).fill(null) };
    }
    
    goToPage(0);
    renderCurrentPageQuestions();
    updateProgressBarColors();
    updateSubmitButtonState();
    updatePageWarnings();
    renderProfessorsList();
    showToast(`Switched to ${prof.name}`);
}

function renderProfessorsList() {
    const container = document.getElementById('professorsListContainer');
    if (!container) return;
    container.innerHTML = '';
    
    professors.forEach((prof, idx) => {
        const colorData = professorColors[prof.colorIndex % professorColors.length];
        const initials = getInitials(prof.name);
        const isActive = currentProfessor && currentProfessor.name === prof.name;
        const isEvaluated = prof.evaluated;
        
        const btn = document.createElement('button');
        btn.className = `w-full text-left px-3 py-2 rounded-xl mb-2 transition flex items-center gap-3 ${
            isActive ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        } ${isEvaluated ? 'opacity-60' : ''}`;
        btn.innerHTML = `
            <div class="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br ${colorData.bg} flex items-center justify-center text-white font-bold shadow-md">${initials}</div>
            <div class="flex-1 min-w-0">
                <div class="flex justify-between items-center">
                    <span class="font-semibold text-sm">${prof.name}</span>
                    <span class="text-xs ${isActive ? 'text-indigo-200' : 'text-gray-500'}">${prof.course}</span>
                </div>
                ${isEvaluated ? '<span class="text-xs text-green-500 mt-1 inline-block">✓ Evaluated</span>' : `<div class="text-xs ${isActive ? 'text-indigo-200' : 'text-gray-400'} truncate">${prof.email || ''}</div>`}
            </div>
        `;
        if (!isEvaluated) {
            btn.addEventListener('click', () => switchProfessor(prof, idx));
        } else {
            btn.style.cursor = 'not-allowed';
            btn.title = 'Already evaluated';
        }
        container.appendChild(btn);
    });
}

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

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

function showToast(msg) {
    let toast = document.getElementById('dynamicToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'dynamicToast';
        toast.className = 'fixed bottom-5 right-5 bg-gray-800 text-white px-5 py-2 rounded-full text-sm shadow-lg z-50 transition-opacity duration-300 opacity-0';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(() => toast.style.opacity = '0', 2000);
}

function init() {
    if (!currentProfessor) {
        console.error("No current professor - cannot initialize");
        return;
    }
    
    if (!evaluationsStore[currentProfessor.name]) {
        evaluationsStore[currentProfessor.name] = { answers: new Array(questions.length).fill(null) };
    }
    
    document.getElementById('currentProfNameDisplay').innerText = currentProfessor.name;
    document.getElementById('currentCourseDisplay').innerText = `Course Code: ${currentProfessor.course || ''}`;
    document.getElementById('currentEmailDisplay').innerText = currentProfessor.email || '';
    
    renderProfessorsList();
    updateDateTime();
    setInterval(updateDateTime, 1000);
    updateProfessorAvatar(currentProfessor);
    renderCurrentPageQuestions();

    const remarksBox = document.getElementById('remarksInput');
    if (remarksBox) {
        remarksBox.addEventListener('input', () => {
            updateProgressBarColors();
            updatePageWarnings();
            updateSubmitButtonState();
        });
    }
    
    document.getElementById('nextBtn')?.addEventListener('click', () => goToPage(currentPage + 1));
    document.getElementById('prevBtn')?.addEventListener('click', () => goToPage(currentPage - 1));
    document.getElementById('submitEvalBtn')?.addEventListener('click', submitAndContinue);
    
    for (let i = 0; i <= 3; i++) {
        document.getElementById(`tabPage${i}`)?.addEventListener('click', () => goToPage(i));
    }

    goToPage(0);
}

// Start the application
fetchInitialData();