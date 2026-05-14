using System;
using System.IO;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using System.Data;
using Oracle.ManagedDataAccess.Client;
using Oracle.ManagedDataAccess.Types;

// ═══════════════════════════════════════════════════════════════
//  EVALUATION MODULE  (C#)
//  Now uses PL/SQL procedures (evaluation_pkg) for all reports
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
                case "1": ShowSummary(); break;
                case "2": ShowAvgRatings(); break;
                case "3": ShowDetailPrompt(); break;
                case "4": ShowRemarks(); break;
                case "0": return;
                default:
                    Console.WriteLine("  ✖  Invalid option.");
                    Pause();
                    break;
            }
        }
    }

    // ──────────────────────────────────────────────────────────
    //  Helper: Execute a stored procedure that returns a REF CURSOR
    //  Parameters must be added in the exact order as in the procedure signature.
    //  The last parameter is always the output REF CURSOR.
    // ──────────────────────────────────────────────────────────
    static void RunStoredProcedure(string procName,
                                   OracleParameter[]? inputParams,
                                   Action<OracleDataReader> processReader)
    {
        try
        {
            using var conn = new OracleConnection(connStr);
            conn.Open();
            using var cmd = new OracleCommand(procName, conn);
            cmd.CommandType = CommandType.StoredProcedure;

            // Add input parameters in the order they appear
            if (inputParams != null)
            {
                foreach (var p in inputParams)
                    cmd.Parameters.Add(p);
            }

            // Add the output REF CURSOR parameter (must be last)
            var cursorParam = new OracleParameter("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            cmd.Parameters.Add(cursorParam);

            cmd.ExecuteNonQuery();

            using var reader = ((OracleRefCursor)cursorParam.Value).GetDataReader();
            processReader(reader);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"\n  ✖  DB Error: {ex.Message}");
        }
    }

    // Overload for procedures with no input parameters
    static void RunStoredProcedure(string procName, Action<OracleDataReader> processReader)
    {
        RunStoredProcedure(procName, null, processReader);
    }

    // ── [1] Summary ───────────────────────────────────────────
    static void ShowSummary()
    {
        Banner();
        Console.WriteLine("  ┌─ EVALUATION SUMMARY — ALL PROFESSORS\n");
        Console.WriteLine($"  {"PROFESSOR",-28} {"SUBJECT",-12} {"SEC",-8} {"EVALS",10} {"ENROLLED",7}");
        Console.WriteLine("  " + THIN);

        RunStoredProcedure("evaluation_pkg.get_summary", reader =>
        {
            bool any = false;
            while (reader.Read())
            {
                any = true;
                Console.WriteLine($"  {reader["PROFESSOR_NAME"],-28} {reader["SUBJECT_CODE"],-12} {reader["SECTION"],-8} {reader["EVAL_COUNT"],10} {reader["TOTAL_ENROLLED"],7}");
            }
            if (!any) Console.WriteLine("  No data found.");
        });

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

        RunStoredProcedure("evaluation_pkg.get_avg_ratings", reader =>
        {
            bool any = false;
            while (reader.Read())
            {
                any = true;
                Console.WriteLine($"  {reader["PROFESSOR_NAME"],-30} {reader["AVG_RATING"],10} {reader["TOTAL_RESPONSES"],10}");
            }
            if (!any) Console.WriteLine("  No data found.");
        });
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

        // Create input parameter with explicit size and direction
        var param = new OracleParameter("p_professor_name", OracleDbType.Varchar2, ParameterDirection.Input);
        param.Value = name;
        param.Size = name.Length;  // important for VARCHAR2 binding

        RunStoredProcedure("evaluation_pkg.get_professor_detail",
            new OracleParameter[] { param },
            reader =>
            {
                string currentCat = "";
                bool any = false;

                while (reader.Read())
                {
                    any = true;
                    string cat = reader["CATEGORY_NAME"].ToString()!;
                    if (cat != currentCat)
                    {
                        currentCat = cat;
                        Console.WriteLine($"\n  ▸ {cat}");
                        Console.WriteLine("  " + THIN);
                    }
                    Console.WriteLine(
                        $"    {reader["QUESTION_TEXT"],-52}  " +
                        $"Avg: {reader["AVG_RATING"],5}  " +
                        $"(n={reader["RESPONSE_COUNT"]})");
                }
                if (!any) Console.WriteLine($"  No responses found for '{name}'.");
            });
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

        var param = new OracleParameter("p_professor_name", OracleDbType.Varchar2, ParameterDirection.Input);
        param.Value = name;
        param.Size = name.Length;

        RunStoredProcedure("evaluation_pkg.get_remarks",
            new OracleParameter[] { param },
            reader =>
            {
                bool any = false;
                while (reader.Read())
                {
                    any = true;
                    Console.WriteLine($"\n  Professor : {reader["PROFESSOR_NAME"]}");
                    Console.WriteLine($"  Subject   : {reader["SUBJECT_CODE"]}");
                    Console.WriteLine($"  Submitted : {reader["DATE_SUBMITTED"]}");
                    string remarks = reader["REMARKS_TEXT"]?.ToString() ?? "(no remarks)";
                    Console.WriteLine($"  Remarks   : {remarks}");
                    Console.WriteLine("  " + THIN);
                }
                if (!any) Console.WriteLine($"  No remarks found for '{name}'.");
            });
        Pause();
    }

    // ── Custom INI parser (unchanged) ─────────────────────────
    static Dictionary<string, string> LoadIni(string path)
    {
        var result = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        string section = "";
        string key = "";
        var valBuf = new System.Text.StringBuilder();

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