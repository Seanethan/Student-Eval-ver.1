
using System;
using System.IO;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using Oracle.ManagedDataAccess.Client;

// ═══════════════════════════════════════════════════════════════
//  EVALUATION MODULE  (C#)
//  Aligned to DB schema:
//    Professors, Classes, Subjects, Enrollments,
//    Evaluations, Responses, Questions, Categories, Remarks
// ═══════════════════════════════════════════════════════════════
class EvaluationModule
{
    static Dictionary<string, string> cfg = new();
    static string connStr = "";

    static readonly string LINE = new string('─', 60);
    static readonly string THIN = new string('·', 60);

    // ── Entry point ───────────────────────────────────────────
    static void Main(string[] args)
    {
        string? iniPath = args.Length > 0 ? args[0] : FindIni();

        if (iniPath == null || !File.Exists(iniPath))
        {
            Console.WriteLine("\n  ✖  Cannot find sql_queries.ini");
            Pause();
            return;
        }

        cfg = LoadIni(iniPath);

        connStr = $"User Id={cfg["DATABASE.user"]};" +
                  $"Password={cfg["DATABASE.password"]};" +
                  $"Data Source={cfg["DATABASE.connect_string"]}";

        EvaluationMenu();
    }

    // ── Menu ──────────────────────────────────────────────────
    static void EvaluationMenu()
    {
        while (true)
        {
            Banner();
            Console.WriteLine("  ┌─ EVALUATION FOR TEACHERS\n");
            Console.WriteLine("  [1] Summary — all professors");
            Console.WriteLine("  [2] Overall average ratings");
            Console.WriteLine("  [3] Detailed ratings by professor");
            Console.WriteLine("  [4] Remarks by professor");
            Console.WriteLine("  [0] Back to Main Menu");
            Console.WriteLine();
            Console.Write("  Select option : ");
            string choice = Console.ReadLine()?.Trim() ?? "";

            switch (choice)
            {
                case "1": ShowSummary();     break;
                case "2": ShowAvgRatings();  break;
                case "3": ShowDetailPrompt(); break;
                case "4": ShowRemarks();     break;
                case "0": return;
                default:
                    Console.WriteLine("  ✖  Invalid option.");
                    Pause();
                    break;
            }
        }
    }

    // ── [1] Summary ───────────────────────────────────────────
    static void ShowSummary()
    {
        Banner();
        Console.WriteLine("  ┌─ EVALUATION SUMMARY — ALL PROFESSORS\n");
        RunTable(
            Flat(cfg["EVALUATION.fetch_all_evaluations"]),
            null,
            new[] { "PROFESSOR_NAME", "SUBJECT_CODE", "SECTION", "EVAL_COUNT", "TOTAL_ENROLLED" },
            new[] { -28, -12, -8, 10, 7 }
        );

        Console.WriteLine();
        Console.Write("  Enter professor name to drill down (or ENTER to go back): ");
        string name = Console.ReadLine()?.Trim() ?? "";
        if (!string.IsNullOrEmpty(name)) ShowDetail(name);
    }

    // ── [2] Overall average ratings ───────────────────────────
    static void ShowAvgRatings()
    {
        Banner();
        Console.WriteLine("  ┌─ OVERALL AVERAGE RATINGS\n");
        Console.WriteLine($"  {"PROFESSOR",-30} {"AVG RATING",10} {"RESPONSES",10}");
        Console.WriteLine("  " + THIN);

        RunTable(
            Flat(cfg["EVALUATION.fetch_avg_ratings"]),
            null,
            new[] { "PROFESSOR_NAME", "AVG_RATING", "TOTAL_RESPONSES" },
            new[] { -30, 10, 10 }
        );
        Pause();
    }

    // ── [3] Detailed ratings ──────────────────────────────────
    static void ShowDetailPrompt()
    {
        Banner();
        Console.WriteLine("  ┌─ DETAILED RATINGS BY PROFESSOR\n");
        Console.Write("  Enter professor name : ");
        string name = Console.ReadLine()?.Trim() ?? "";
        if (!string.IsNullOrEmpty(name)) ShowDetail(name);
    }

    static void ShowDetail(string name)
    {
        Banner();
        Console.WriteLine($"  ┌─ DETAILED RATINGS — {name.ToUpper()}\n");

        string sql = Flat(cfg["EVALUATION.fetch_professor_detail"]);

        try
        {
            using var conn = new OracleConnection(connStr);
            conn.Open();
            using var cmd = new OracleCommand(sql, conn);
            cmd.Parameters.Add(":professor_name", OracleDbType.Varchar2).Value = $"%{name}%";
            using var rdr = cmd.ExecuteReader();

            string currentCat = "";
            bool   any        = false;

            while (rdr.Read())
            {
                any = true;
                string cat = rdr["CATEGORY_NAME"].ToString()!;
                if (cat != currentCat)
                {
                    currentCat = cat;
                    Console.WriteLine($"\n  ▸ {cat}");
                    Console.WriteLine("  " + THIN);
                }
                Console.WriteLine(
                    $"    {rdr["QUESTION_TEXT"],-52}  " +
                    $"Avg: {rdr["AVG_RATING"],5}  " +
                    $"(n={rdr["RESPONSE_COUNT"]})");
            }

            if (!any)
                Console.WriteLine($"  No responses found for '{name}'.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"\n  ✖  DB Error: {ex.Message}");
        }
        Pause();
    }

    // ── [4] Remarks ───────────────────────────────────────────
    static void ShowRemarks()
    {
        Banner();
        Console.WriteLine("  ┌─ REMARKS BY PROFESSOR\n");
        Console.Write("  Enter professor name : ");
        string name = Console.ReadLine()?.Trim() ?? "";
        if (string.IsNullOrEmpty(name)) return;

        string sql = Flat(cfg["EVALUATION.fetch_remarks"]);

        try
        {
            using var conn = new OracleConnection(connStr);
            conn.Open();
            using var cmd = new OracleCommand(sql, conn);
            cmd.Parameters.Add(":professor_name", OracleDbType.Varchar2).Value = $"%{name}%";
            using var rdr = cmd.ExecuteReader();

            bool any = false;
            while (rdr.Read())
            {
                any = true;
                Console.WriteLine($"\n  Professor : {rdr["PROFESSOR_NAME"]}");
                Console.WriteLine($"  Subject   : {rdr["SUBJECT_CODE"]}");
                Console.WriteLine($"  Submitted : {rdr["DATE_SUBMITTED"]}");
                string remarks = rdr["REMARKS_TEXT"]?.ToString() ?? "(no remarks)";
                Console.WriteLine($"  Remarks   : {remarks}");
                Console.WriteLine("  " + THIN);
            }

            if (!any)
                Console.WriteLine($"  No remarks found for '{name}'.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"\n  ✖  DB Error: {ex.Message}");
        }
        Pause();
    }

    // ── Generic table printer ─────────────────────────────────
    static void RunTable(string sql, OracleParameter[]? parameters,
                         string[] cols, int[] widths)
    {
        try
        {
            using var conn = new OracleConnection(connStr);
            conn.Open();
            using var cmd = new OracleCommand(sql, conn);
            if (parameters != null)
                foreach (var p in parameters) cmd.Parameters.Add(p);
            using var rdr = cmd.ExecuteReader();

            bool any = false;
            while (rdr.Read())
            {
                any = true;
                var parts = new List<string>();
                for (int i = 0; i < cols.Length; i++)
                {
                    string val  = rdr[cols[i]]?.ToString() ?? "";
                    int    w    = widths[i];
                    parts.Add(w < 0
                        ? val.PadRight(-w)
                        : val.PadLeft(w));
                }
                Console.WriteLine("  " + string.Join(" ", parts));
            }

            if (!any)
                Console.WriteLine("  No data found.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"\n  ✖  DB Error: {ex.Message}");
        }
    }

    // ── Custom INI parser ─────────────────────────────────────
    static Dictionary<string, string> LoadIni(string path)
    {
        var    result  = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        string section = "";
        string key     = "";
        var    valBuf  = new System.Text.StringBuilder();

        void Flush()
        {
            if (key != "")
            {
                result[$"{section}.{key}"] = valBuf.ToString().Trim();
                key = ""; valBuf.Clear();
            }
        }

        foreach (string raw in File.ReadAllLines(path))
        {
            string trimmed = raw.Trim();

            if (trimmed == "" || trimmed.StartsWith(";"))
            { Flush(); continue; }

            if (trimmed.StartsWith("[") && trimmed.EndsWith("]"))
            { Flush(); section = trimmed[1..^1].Trim(); continue; }

            if (raw.Length > 0 && (raw[0] == ' ' || raw[0] == '\t') && key != "")
            { valBuf.Append(' ').Append(trimmed); continue; }

            int eq = trimmed.IndexOf('=');
            if (eq > 0)
            {
                Flush();
                key = trimmed[..eq].Trim();
                valBuf.Append(trimmed[(eq + 1)..].Trim());
            }
        }
        Flush();
        return result;
    }

    // ── Helpers ───────────────────────────────────────────────
    static string Flat(string s) =>
        Regex.Replace(s?.Trim() ?? "", @"\s+", " ");

    static void Banner()
    {
        Console.Clear();
        Console.WriteLine(LINE);
        Console.WriteLine("  STUDENT EVALUATION SYSTEM — EVALUATION MODULE (C#)".PadLeft(55));
        Console.WriteLine(LINE);
    }

    static void Pause()
    {
        Console.Write("\n  Press ENTER to continue...");
        Console.ReadLine();
    }

    static string? FindIni()
    {
        string? dir = AppContext.BaseDirectory;
        for (int i = 0; i < 8; i++)
        {
            if (dir == null) break;
            string c = Path.Combine(dir, "sql_queries.ini");
            if (File.Exists(c)) return c;
            dir = Path.GetDirectoryName(dir);
        }
        return null;
    }
}