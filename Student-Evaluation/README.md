# Student-Evaluation
goofy ahh pl I wanna die
i was here



need niyo muna ichange yunvg .env into what youve set up in your oracle for example 1234 yung password change the .env either inside the terminal or in powershell then reconnect ctr + c and then cd backend then npm start
to actually see if gumagana run a api connection test run


ALWAY CHECK IF THE BACKEND IS RUNNING DO NOT EXIT ITS TERMINAL

Invoke-RestMethod -Uri http://localhost:3000/api/auth/login -Method Post -Body '{"studentNumber":"24-1234"}' -ContentType "application/json"

 Invoke-RestMethod -Uri http://localhost:3000/api/professors/student-professors -Headers @{"x-student-number"="24-1234"}                                    

 https://chat.deepseek.com/share/z9glqy0hlxcdqq9rsj    this is the chat ive used read it 



```
Student-Evaluation
├─ backend
│  ├─ .env
│  ├─ config
│  │  └─ database.js
│  ├─ controllers
│  │  ├─ authController.js
│  │  ├─ evaluationController.js
│  │  └─ professorController.js
│  ├─ middleware
│  │  └─ auth.js
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ routes
│  │  ├─ authRoutes.js
│  │  ├─ evaluationRoutes.js
│  │  └─ professorRoutes.js
│  └─ server.js
├─ database.sql
├─ images
│  ├─ avatar.png
│  ├─ bscs.png
│  ├─ ched.png
│  ├─ qcu.png
│  └─ qculogo.png
├─ package-lock.json
├─ package.json
├─ pages
│  ├─ EvalPage.html
│  ├─ Login.html
│  ├─ StartingPage.html
│  ├─ StudentDashboard.html
│  └─ StudentLogin.html
├─ README.md
├─ scripts
│  ├─ EP.js
│  ├─ Login.js
│  ├─ SD.js
│  ├─ SL.js
│  └─ SP.js
└─ styles
   ├─ EvalPage.css
   ├─ input.css
   └─ output.css

```