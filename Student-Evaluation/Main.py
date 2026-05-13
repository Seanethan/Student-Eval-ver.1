import configparser
import json
import os
import sys
import subprocess
import webbrowser
import time
import oracledb
from getpass import getpass

# ─────────────────────────────────────────────
#  Config
# ─────────────────────────────────────────────
BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
CONFIG_FILE = os.path.join(BASE_DIR, "sql_queries.ini")
PAGES_DIR   = os.path.join(BASE_DIR, "pages")

config = configparser.ConfigParser()
config.read(CONFIG_FILE)

# Paths to compiled submodule executables
EVAL_EXE = os.path.join(BASE_DIR, "cli_modules", "EvaluationModule",
                        "bin", "Release", "net8.0", "win-x64", "publish", "EvaluationModule.exe")
REG_JAR  = os.path.join(BASE_DIR, "cli_modules", "RegisterModule",
                        "target", "RegisterModule.jar")

# ─────────────────────────────────────────────
#  DB helpers
# ─────────────────────────────────────────────
def get_connection():
    return oracledb.connect(
        user=config["DATABASE"]["user"],
        password=config["DATABASE"]["password"],
        dsn=config["DATABASE"]["connect_string"],
    )

def run_query(sql: str, params: dict = None, fetch: bool = True):
    sql = " ".join(sql.split())
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params or {})
            if fetch:
                cols = [d[0] for d in cur.description]
                return [dict(zip(cols, row)) for row in cur.fetchall()]
            conn.commit()
            return cur.rowcount

# ─────────────────────────────────────────────
#  UI helpers
# ─────────────────────────────────────────────
LINE = "─" * 60
THIN = "·" * 60

def banner():
    os.system("cls" if os.name == "nt" else "clear")
    print(LINE)
    print("  STUDENT EVALUATION SYSTEM".center(60))
    print(LINE)

def section(title: str):
    print(f"\n  ┌─ {title}")

def pause():
    input("\n  Press ENTER to continue...")

# ─────────────────────────────────────────────
#  Browser launcher
# ─────────────────────────────────────────────
def _inject_and_open(student_id: str, student_info: dict):
    info_json = json.dumps(student_info)
    html = f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Redirecting...</title></head>
<body>
<script>
  localStorage.setItem('studentNo', {json.dumps(student_id)});
  localStorage.setItem('studentInfo', {json.dumps(info_json)});
  window.location.replace('StudentDashboard.html');
</script>
<p>Redirecting to dashboard&hellip;</p>
</body>
</html>"""
    redirect_path = os.path.join(PAGES_DIR, "_cli_redirect.html")
    with open(redirect_path, "w", encoding="utf-8") as f:
        f.write(html)

    import urllib.request
    live_server_url = "http://localhost:5500/pages/_cli_redirect.html"
    try:
        urllib.request.urlopen(live_server_url, timeout=1)
        webbrowser.open(live_server_url)
    except Exception:
        file_url = "file:///" + redirect_path.replace("\\", "/")
        webbrowser.open(file_url)

# ═══════════════════════════════════════════════════════════════
#  STUDENT LOGIN  (Python)
#  DB: student_id, course_code, year_level, section
# ═══════════════════════════════════════════════════════════════
def student_login():
    banner()
    section("STUDENT LOG-IN")
    student_id = input("  Student ID : ").strip()

    if not student_id:
        print("\n  ✖  Student ID cannot be empty.")
        pause()
        return

    sql  = config["VERIFY_STUDENT"]["fetch_student"]
    rows = run_query(sql, {"student_id": student_id})

    if not rows:
        print("\n  ✖  Student not found. Please check your ID.")
        pause()
        return

    student = rows[0]
    # Aligned to actual DB columns
    student_info = {
        "studentId":  str(student.get("STUDENT_ID",  "")),
        "courseCode": str(student.get("COURSE_CODE", "")),
        "yearLevel":  str(student.get("YEAR_LEVEL",  "")),
        "section":    str(student.get("SECTION",     "")),
    }

    banner()
    print(f"\n  ✔  Login successful!\n")
    print(f"     Student ID  : {student_info['studentId']}")
    print(f"     Course      : {student_info['courseCode']}")
    print(f"     Year Level  : {student_info['yearLevel']}  |  Section {student_info['section']}")
    print(f"\n  Opening Student Dashboard in your browser...")
    time.sleep(1.2)

    _inject_and_open(student_id, student_info)
    print(f"\n  ✔  Browser opened.")
    pause()

# ═══════════════════════════════════════════════════════════════
#  ADMIN LOGIN  (Python — launches C# and Java submodules)
# ═══════════════════════════════════════════════════════════════
def admin_login():
    banner()
    section("ADMIN LOG-IN")
    username = input("  Username : ").strip()
    password = getpass("  Password : ")

    if (username != config["ADMIN"]["username"] or
            password != config["ADMIN"]["password"]):
        print("\n  ✖  Invalid credentials.")
        pause()
        return

    print("\n  ✔  Access granted.")
    time.sleep(0.6)
    admin_menu()

def admin_menu():
    while True:
        banner()
        section("ADMIN MENU")
        print("  [1] Evaluation for Teachers  (C#)")
        print("  [2] Register Students        (Java)")
        print("  [0] Logout")
        print()
        choice = input("  Select option : ").strip()

        if choice == "1":
            launch_evaluation_module()
        elif choice == "2":
            launch_register_module()
        elif choice == "0":
            break
        else:
            print("  ✖  Invalid option.")
            pause()

def launch_evaluation_module():
    if not os.path.exists(EVAL_EXE):
        print(f"\n  ✖  C# module not found. Build it first:")
        print(f"     cd cli_modules/EvaluationModule")
        print(f"     dotnet publish -c Release -r win-x64 --self-contained false")
        pause()
        return
    ini_path = os.path.join(BASE_DIR, "sql_queries.ini")
    print("\n  Launching Evaluation Module (C#)...\n")
    subprocess.run([EVAL_EXE, ini_path], cwd=BASE_DIR)

def launch_register_module():
    if not os.path.exists(REG_JAR):
        print(f"\n  ✖  Java module not found. Build it first:")
        print(f"     cd cli_modules/RegisterModule")
        print(f"     mvn package")
        pause()
        return
    ini_path = os.path.join(BASE_DIR, "sql_queries.ini")
    print("\n  Launching Register Module (Java)...\n")
    subprocess.run(["java", "-jar", REG_JAR, ini_path], cwd=BASE_DIR)

# ═══════════════════════════════════════════════════════════════
#  MAIN MENU
# ═══════════════════════════════════════════════════════════════
def main():
    while True:
        banner()
        print("  [1] Log in as Student")
        print("  [2] Log in as Admin")
        print("  [0] Exit")
        print()
        choice = input("  Select option : ").strip()

        if choice == "1":
            student_login()
        elif choice == "2":
            admin_login()
        elif choice == "0":
            print("\n  Goodbye!\n")
            sys.exit(0)
        else:
            print("  ✖  Invalid option.")
            pause()

if __name__ == "__main__":
    main()
