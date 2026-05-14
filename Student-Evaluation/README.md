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
│  │  ├─ functionRoutes.js
│  │  └─ professorRoutes.js
│  └─ server.js
├─ build
│  └─ Main
│     ├─ Analysis-00.toc
│     ├─ base_library.zip
│     ├─ EXE-00.toc
│     ├─ localpycs
│     │  ├─ pyimod01_archive.pyc
│     │  ├─ pyimod02_importers.pyc
│     │  ├─ pyimod03_ctypes.pyc
│     │  ├─ pyimod04_pywin32.pyc
│     │  └─ struct.pyc
│     ├─ Main.pkg
│     ├─ PKG-00.toc
│     ├─ PYZ-00.pyz
│     ├─ PYZ-00.toc
│     ├─ warn-Main.txt
│     └─ xref-Main.html
├─ cli_modules
│  ├─ EvaluationModule
│  │  ├─ bin
│  │  │  ├─ Debug
│  │  │  │  └─ net8.0
│  │  │  │     ├─ EvaluationModule.deps.json
│  │  │  │     ├─ EvaluationModule.dll
│  │  │  │     ├─ EvaluationModule.exe
│  │  │  │     ├─ EvaluationModule.pdb
│  │  │  │     ├─ EvaluationModule.runtimeconfig.json
│  │  │  │     ├─ INIFileParser.dll
│  │  │  │     ├─ Oracle.ManagedDataAccess.dll
│  │  │  │     ├─ runtimes
│  │  │  │     │  ├─ linux
│  │  │  │     │  │  └─ lib
│  │  │  │     │  │     └─ net8.0
│  │  │  │     │  │        └─ System.DirectoryServices.Protocols.dll
│  │  │  │     │  ├─ osx
│  │  │  │     │  │  └─ lib
│  │  │  │     │  │     └─ net8.0
│  │  │  │     │  │        └─ System.DirectoryServices.Protocols.dll
│  │  │  │     │  └─ win
│  │  │  │     │     └─ lib
│  │  │  │     │        └─ net8.0
│  │  │  │     │           ├─ System.Diagnostics.EventLog.dll
│  │  │  │     │           ├─ System.Diagnostics.EventLog.Messages.dll
│  │  │  │     │           ├─ System.Diagnostics.PerformanceCounter.dll
│  │  │  │     │           ├─ System.DirectoryServices.Protocols.dll
│  │  │  │     │           └─ System.Security.Cryptography.Pkcs.dll
│  │  │  │     ├─ System.Configuration.ConfigurationManager.dll
│  │  │  │     ├─ System.Diagnostics.EventLog.dll
│  │  │  │     ├─ System.Diagnostics.PerformanceCounter.dll
│  │  │  │     ├─ System.DirectoryServices.Protocols.dll
│  │  │  │     ├─ System.Security.Cryptography.Pkcs.dll
│  │  │  │     └─ System.Security.Cryptography.ProtectedData.dll
│  │  │  └─ Release
│  │  │     └─ net8.0
│  │  │        ├─ EvaluationModule.deps.json
│  │  │        ├─ EvaluationModule.dll
│  │  │        ├─ EvaluationModule.exe
│  │  │        ├─ EvaluationModule.pdb
│  │  │        ├─ EvaluationModule.runtimeconfig.json
│  │  │        ├─ INIFileParser.dll
│  │  │        ├─ Oracle.ManagedDataAccess.dll
│  │  │        ├─ runtimes
│  │  │        │  ├─ linux
│  │  │        │  │  └─ lib
│  │  │        │  │     └─ net8.0
│  │  │        │  │        └─ System.DirectoryServices.Protocols.dll
│  │  │        │  ├─ osx
│  │  │        │  │  └─ lib
│  │  │        │  │     └─ net8.0
│  │  │        │  │        └─ System.DirectoryServices.Protocols.dll
│  │  │        │  └─ win
│  │  │        │     └─ lib
│  │  │        │        └─ net8.0
│  │  │        │           ├─ System.Diagnostics.EventLog.dll
│  │  │        │           ├─ System.Diagnostics.EventLog.Messages.dll
│  │  │        │           ├─ System.Diagnostics.PerformanceCounter.dll
│  │  │        │           ├─ System.DirectoryServices.Protocols.dll
│  │  │        │           └─ System.Security.Cryptography.Pkcs.dll
│  │  │        ├─ System.Configuration.ConfigurationManager.dll
│  │  │        ├─ System.Diagnostics.EventLog.dll
│  │  │        ├─ System.Diagnostics.PerformanceCounter.dll
│  │  │        ├─ System.DirectoryServices.Protocols.dll
│  │  │        ├─ System.Security.Cryptography.Pkcs.dll
│  │  │        ├─ System.Security.Cryptography.ProtectedData.dll
│  │  │        └─ win-x64
│  │  │           ├─ EvaluationModule.deps.json
│  │  │           ├─ EvaluationModule.dll
│  │  │           ├─ EvaluationModule.exe
│  │  │           ├─ EvaluationModule.pdb
│  │  │           ├─ EvaluationModule.runtimeconfig.json
│  │  │           ├─ INIFileParser.dll
│  │  │           ├─ Oracle.ManagedDataAccess.dll
│  │  │           ├─ publish
│  │  │           │  ├─ EvaluationModule.deps.json
│  │  │           │  ├─ EvaluationModule.dll
│  │  │           │  ├─ EvaluationModule.exe
│  │  │           │  ├─ EvaluationModule.pdb
│  │  │           │  ├─ EvaluationModule.runtimeconfig.json
│  │  │           │  ├─ INIFileParser.dll
│  │  │           │  ├─ Oracle.ManagedDataAccess.dll
│  │  │           │  ├─ System.Configuration.ConfigurationManager.dll
│  │  │           │  ├─ System.Diagnostics.EventLog.dll
│  │  │           │  ├─ System.Diagnostics.EventLog.Messages.dll
│  │  │           │  ├─ System.Diagnostics.PerformanceCounter.dll
│  │  │           │  ├─ System.DirectoryServices.Protocols.dll
│  │  │           │  ├─ System.Security.Cryptography.Pkcs.dll
│  │  │           │  └─ System.Security.Cryptography.ProtectedData.dll
│  │  │           ├─ System.Configuration.ConfigurationManager.dll
│  │  │           ├─ System.Diagnostics.EventLog.dll
│  │  │           ├─ System.Diagnostics.EventLog.Messages.dll
│  │  │           ├─ System.Diagnostics.PerformanceCounter.dll
│  │  │           ├─ System.DirectoryServices.Protocols.dll
│  │  │           ├─ System.Security.Cryptography.Pkcs.dll
│  │  │           └─ System.Security.Cryptography.ProtectedData.dll
│  │  ├─ EvaluationModule.csproj
│  │  ├─ obj
│  │  │  ├─ Debug
│  │  │  │  └─ net8.0
│  │  │  │     ├─ .NETCoreApp,Version=v8.0.AssemblyAttributes.cs
│  │  │  │     ├─ apphost.exe
│  │  │  │     ├─ Evaluati.908D574C.Up2Date
│  │  │  │     ├─ EvaluationModule.AssemblyInfo.cs
│  │  │  │     ├─ EvaluationModule.AssemblyInfoInputs.cache
│  │  │  │     ├─ EvaluationModule.assets.cache
│  │  │  │     ├─ EvaluationModule.csproj.AssemblyReference.cache
│  │  │  │     ├─ EvaluationModule.csproj.CoreCompileInputs.cache
│  │  │  │     ├─ EvaluationModule.csproj.FileListAbsolute.txt
│  │  │  │     ├─ EvaluationModule.dll
│  │  │  │     ├─ EvaluationModule.GeneratedMSBuildEditorConfig.editorconfig
│  │  │  │     ├─ EvaluationModule.genruntimeconfig.cache
│  │  │  │     ├─ EvaluationModule.GlobalUsings.g.cs
│  │  │  │     ├─ EvaluationModule.pdb
│  │  │  │     ├─ EvaluationModule.sourcelink.json
│  │  │  │     ├─ ref
│  │  │  │     │  └─ EvaluationModule.dll
│  │  │  │     └─ refint
│  │  │  │        └─ EvaluationModule.dll
│  │  │  ├─ EvaluationModule.csproj.nuget.dgspec.json
│  │  │  ├─ EvaluationModule.csproj.nuget.g.props
│  │  │  ├─ EvaluationModule.csproj.nuget.g.targets
│  │  │  ├─ project.assets.json
│  │  │  ├─ project.nuget.cache
│  │  │  └─ Release
│  │  │     └─ net8.0
│  │  │        ├─ .NETCoreApp,Version=v8.0.AssemblyAttributes.cs
│  │  │        ├─ apphost.exe
│  │  │        ├─ Evaluati.908D574C.Up2Date
│  │  │        ├─ EvaluationModule.AssemblyInfo.cs
│  │  │        ├─ EvaluationModule.AssemblyInfoInputs.cache
│  │  │        ├─ EvaluationModule.assets.cache
│  │  │        ├─ EvaluationModule.csproj.AssemblyReference.cache
│  │  │        ├─ EvaluationModule.csproj.CoreCompileInputs.cache
│  │  │        ├─ EvaluationModule.csproj.FileListAbsolute.txt
│  │  │        ├─ EvaluationModule.dll
│  │  │        ├─ EvaluationModule.GeneratedMSBuildEditorConfig.editorconfig
│  │  │        ├─ EvaluationModule.genruntimeconfig.cache
│  │  │        ├─ EvaluationModule.GlobalUsings.g.cs
│  │  │        ├─ EvaluationModule.pdb
│  │  │        ├─ EvaluationModule.sourcelink.json
│  │  │        ├─ ref
│  │  │        │  └─ EvaluationModule.dll
│  │  │        ├─ refint
│  │  │        │  └─ EvaluationModule.dll
│  │  │        └─ win-x64
│  │  │           ├─ .NETCoreApp,Version=v8.0.AssemblyAttributes.cs
│  │  │           ├─ apphost.exe
│  │  │           ├─ Evaluati.908D574C.Up2Date
│  │  │           ├─ EvaluationModule.AssemblyInfo.cs
│  │  │           ├─ EvaluationModule.AssemblyInfoInputs.cache
│  │  │           ├─ EvaluationModule.assets.cache
│  │  │           ├─ EvaluationModule.csproj.AssemblyReference.cache
│  │  │           ├─ EvaluationModule.csproj.CoreCompileInputs.cache
│  │  │           ├─ EvaluationModule.csproj.FileListAbsolute.txt
│  │  │           ├─ EvaluationModule.dll
│  │  │           ├─ EvaluationModule.GeneratedMSBuildEditorConfig.editorconfig
│  │  │           ├─ EvaluationModule.genruntimeconfig.cache
│  │  │           ├─ EvaluationModule.GlobalUsings.g.cs
│  │  │           ├─ EvaluationModule.pdb
│  │  │           ├─ EvaluationModule.sourcelink.json
│  │  │           ├─ PublishOutputs.6377a17dd4.txt
│  │  │           ├─ PublishOutputs.e7db22bae7.txt
│  │  │           ├─ ref
│  │  │           │  └─ EvaluationModule.dll
│  │  │           └─ refint
│  │  │              └─ EvaluationModule.dll
│  │  └─ Program.cs
│  └─ RegisterModule
│     ├─ pom.xml
│     ├─ src
│     │  └─ main
│     │     └─ java
│     │        └─ com
│     │           └─ eval
│     │              └─ RegisterModule.java
│     └─ target
│        ├─ classes
│        │  └─ com
│        │     └─ eval
│        │        └─ RegisterModule.class
│        ├─ maven-archiver
│        │  └─ pom.properties
│        ├─ maven-status
│        │  └─ maven-compiler-plugin
│        │     └─ compile
│        │        └─ default-compile
│        │           ├─ createdFiles.lst
│        │           └─ inputFiles.lst
│        ├─ RegisterModule-1.0.jar
│        └─ RegisterModule.jar
├─ database.sql
├─ dist
│  ├─ Main.exe
│  └─ sql_queries.ini
├─ images
│  ├─ avatar.png
│  ├─ bscs.png
│  ├─ ched.png
│  ├─ qcu.png
│  └─ qculogo.png
├─ Main.py
├─ Main.spec
├─ package-lock.json
├─ package.json
├─ pages
│  ├─ EvalPage.html
│  ├─ Login.html
│  ├─ StartingPage.html
│  ├─ StudentDashboard.html
│  ├─ StudentLogin.html
│  └─ _cli_redirect.html
├─ README.md
├─ scripts
│  ├─ EP.js
│  ├─ Login.js
│  ├─ SD.js
│  ├─ SL.js
│  └─ SP.js
├─ sql_queries.ini
└─ styles
   ├─ EvalPage.css
   ├─ input.css
   └─ output.css

```