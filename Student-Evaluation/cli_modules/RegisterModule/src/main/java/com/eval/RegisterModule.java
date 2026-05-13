package com.eval;

import java.io.*;
import java.nio.file.*;
import java.sql.*;
import java.util.*;

public class RegisterModule {

    static Properties ini = new Properties();
    static String     connStr, dbUser, dbPass;

    static final String LINE = "─".repeat(60);
    static final Scanner sc = new Scanner(System.in);

    public static void main(String[] args) throws Exception {
        String iniPath = findIni();
        if (iniPath == null) {
            System.out.println("\n  ✖  Cannot find sql_queries.ini");
            pause();
            return;
        }
        loadIni(iniPath);

        dbUser  = ini.getProperty("DATABASE.user");
        dbPass  = ini.getProperty("DATABASE.password");
        String dsn = ini.getProperty("DATABASE.connect_string");
        connStr = "jdbc:oracle:thin:@" + dsn;

        Class.forName("oracle.jdbc.OracleDriver");
        registerMenu();
    }

    static void registerMenu() {
        while (true) {
            banner();
            System.out.println("  ┌─ REGISTER STUDENTS\n");
            System.out.println("  [1] Register a New Student");
            System.out.println("  [0] Back to Main Menu\n");
            System.out.print("  Select option : ");
            String choice = sc.nextLine().trim();

            switch (choice) {
                case "1" -> registerStudent();
                case "0" -> { return; }
                default -> {
                    System.out.println("  ✖  Invalid option.");
                    pause();
                }
            }
        }
    }

    static void registerStudent() {
        banner();
        System.out.println("  ┌─ REGISTER NEW STUDENT\n");

        String studentId   = prompt("  Student ID     : ");
        String courseCode  = prompt("  Course Code    : ");
        String yearLevelStr = prompt("  Year Level (1-4): ");
        String section     = prompt("  Section (1 char): ");

        // --- Validation ---
        List<String> errors = new ArrayList<>();
        if (studentId.isBlank()) errors.add("Student ID is required.");
        if (courseCode.isBlank()) errors.add("Course Code is required.");
        if (!yearLevelStr.matches("[1-4]")) errors.add("Year Level must be 1, 2, 3, or 4.");
        if (section.length() != 1) errors.add("Section must be a single character (e.g., A).");

        if (!errors.isEmpty()) {
            System.out.println("\n  ✖  Please fix the following errors:");
            for (String e : errors) System.out.println("     • " + e);
            pause();
            return;
        }

        int yearLevel = Integer.parseInt(yearLevelStr);

        // --- Duplicate check ---
        String checkSql = "SELECT COUNT(*) AS CNT FROM Students WHERE student_id = ?";
        try (Connection conn = DriverManager.getConnection(connStr, dbUser, dbPass);
             PreparedStatement ps = conn.prepareStatement(checkSql)) {
            ps.setString(1, studentId);
            ResultSet rs = ps.executeQuery();
            if (rs.next() && rs.getInt("CNT") > 0) {
                System.out.println("\n  ✖  Student ID '" + studentId + "' already exists.");
                pause();
                return;
            }
        } catch (SQLException e) {
            System.out.println("\n  ✖  DB Error (check): " + e.getMessage());
            pause();
            return;
        }

        // --- Confirmation ---
        System.out.println("\n  ── Review before saving ──────────────────────");
        System.out.println("     Student ID   : " + studentId);
        System.out.println("     Course Code  : " + courseCode);
        System.out.println("     Year Level   : " + yearLevel);
        System.out.println("     Section      : " + section);
        System.out.print("\n  Save this student? [y/N] : ");
        String confirm = sc.nextLine().trim().toLowerCase();

        if (!confirm.equals("y")) {
            System.out.println("  Cancelled.");
            pause();
            return;
        }

        // --- Insert ---
        String insertSql = "INSERT INTO Students (student_id, course_code, year_level, section) VALUES (?, ?, ?, ?)";
        try (Connection conn = DriverManager.getConnection(connStr, dbUser, dbPass);
             PreparedStatement ps = conn.prepareStatement(insertSql)) {

            ps.setString(1, studentId);
            ps.setString(2, courseCode);
            ps.setInt(3, yearLevel);
            ps.setString(4, section);
            ps.executeUpdate();
            System.out.println("\n  ✔  Student '" + studentId + "' registered successfully!");

        } catch (SQLException e) {
            System.out.println("\n  ✖  DB Error (insert): " + e.getMessage());
        }
        pause();
    }

    // ---------- Helper methods (unchanged from original) ----------
    static void banner() {
        System.out.print("\033[H\033[2J");
        System.out.flush();
        System.out.println(LINE);
        System.out.printf("%60s%n", "STUDENT EVALUATION SYSTEM — REGISTER MODULE (Java)");
        System.out.println(LINE);
    }

    static void pause() {
        System.out.print("\n  Press ENTER to continue...");
        sc.nextLine();
    }

    static String prompt(String label) {
        System.out.print(label);
        return sc.nextLine().trim();
    }

    static void loadIni(String path) throws IOException {
        String currentSection = "";
        String currentKey = "";
        StringBuilder currentVal = new StringBuilder();

        for (String raw : Files.readAllLines(Path.of(path))) {
            String line = raw;
            String trimmed = line.trim();

            if (trimmed.startsWith(";") || trimmed.isEmpty()) {
                if (!currentKey.isEmpty()) {
                    ini.setProperty(currentSection + "." + currentKey, currentVal.toString().trim());
                    currentKey = "";
                    currentVal.setLength(0);
                }
                continue;
            }

            if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                if (!currentKey.isEmpty()) {
                    ini.setProperty(currentSection + "." + currentKey, currentVal.toString().trim());
                    currentKey = "";
                    currentVal.setLength(0);
                }
                currentSection = trimmed.substring(1, trimmed.length() - 1).trim();
                continue;
            }

            if ((line.startsWith(" ") || line.startsWith("\t")) && !currentKey.isEmpty()) {
                currentVal.append(" ").append(trimmed);
                continue;
            }

            if (!currentKey.isEmpty()) {
                ini.setProperty(currentSection + "." + currentKey, currentVal.toString().trim());
                currentVal.setLength(0);
            }

            int eq = trimmed.indexOf('=');
            if (eq > 0) {
                currentKey = trimmed.substring(0, eq).trim();
                currentVal.append(trimmed.substring(eq + 1).trim());
            }
        }
        if (!currentKey.isEmpty())
            ini.setProperty(currentSection + "." + currentKey, currentVal.toString().trim());
    }

    static String findIni() {
        File dir = new File(System.getProperty("user.dir"));
        for (int i = 0; i < 8; i++) {
            if (dir == null) break;
            File candidate = new File(dir, "sql_queries.ini");
            if (candidate.exists()) return candidate.getAbsolutePath();
            dir = dir.getParentFile();
        }
        return null;
    }
}