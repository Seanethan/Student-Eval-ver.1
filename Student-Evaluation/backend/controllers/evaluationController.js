const submitEvaluation = async (req, res) => {
  let connection;

  try {
    console.log("SUBMIT CONTROLLER HIT");
    console.log("BODY:", req.body);
    console.log("STUDENT:", req.studentId);

    const { enrollmentId, responses, remarks } = req.body;

    // 🔥 VALIDATION FIX
    if (!enrollmentId || !Array.isArray(responses)) {
      return res.status(400).json({
        error: "Invalid evaluation data"
      });
    }

    connection = await oracledb.getConnection();

    // =========================
    // 1. INSERT EVALUATION
    // =========================
    const evalResult = await connection.execute(
      `
      INSERT INTO system.evaluations (enrollment_id, date_submitted)
      VALUES (:enrollmentId, CURRENT_TIMESTAMP)
      RETURNING evaluation_id INTO :id
      `,
      {
        enrollmentId,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );

    const evaluationId = evalResult.outBinds.id[0];

    // =========================
    // 2. INSERT RESPONSES
    // =========================
    for (const r of responses) {
      await connection.execute(
        `
        INSERT INTO system.responses (evaluation_id, question_id, rating)
        VALUES (:evaluationId, :questionId, :rating)
        `,
        {
          evaluationId,
          questionId: r.questionId,
          rating: r.rating
        }
      );
    }

    // =========================
    // 3. INSERT REMARKS
    // =========================
    await connection.execute(
      `
      INSERT INTO system.remarks (evaluation_id, remarks_text)
      VALUES (:evaluationId, :remarksText)
      `,
      {
        evaluationId,
        remarksText: remarks ? String(remarks) : ""
      }
    );

    await connection.commit();

    return res.json({
      success: true,
      evaluationId
    });

  } catch (err) {
    console.error("SUBMIT ERROR:", err);

    if (connection) await connection.rollback();

    return res.status(500).json({
      error: err.message
    });

  } finally {
    if (connection) await connection.close();
  }
};