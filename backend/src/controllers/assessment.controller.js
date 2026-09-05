import pool from '../db/pool.js'

/**
 * GET /students/me/assessments
 * Returns all active assessments with latest attempt for the student
 */
export async function listAssessments(req, res) {
  try {
    const studentRow = await pool.query('SELECT id FROM students WHERE user_id = $1', [req.user.id])
    if (!studentRow.rows.length) return res.status(404).json({ success: false, message: 'Student not found' })
    const studentId = studentRow.rows[0].id

    const { rows } = await pool.query(`
      SELECT
        a.id, a.title, a.description, a.difficulty, a.time_limit, a.passing_score,
        s.name AS skill_name,
        (SELECT COUNT(*) FROM assessment_questions aq WHERE aq.assessment_id = a.id) AS question_count,
        -- Latest attempt for this student
        la.id AS attempt_id, la.status AS attempt_status, la.score AS attempt_score,
        la.completed_at AS attempt_completed_at
      FROM assessments a
      LEFT JOIN skills s ON s.id = a.skill_id
      LEFT JOIN LATERAL (
        SELECT id, status, score, completed_at
        FROM assessment_attempts
        WHERE assessment_id = a.id AND student_id = $1
        ORDER BY started_at DESC
        LIMIT 1
      ) la ON true
      WHERE a.status = 'ACTIVE'
      ORDER BY a.created_at DESC
    `, [studentId])

    const assessments = rows.map(r => ({
      id: r.id, title: r.title, description: r.description,
      difficulty: r.difficulty, time_limit: r.time_limit, passing_score: r.passing_score,
      skill_name: r.skill_name, question_count: parseInt(r.question_count) || 0,
      latest_attempt: r.attempt_id ? {
        id: r.attempt_id, status: r.attempt_status,
        score: r.attempt_score, completed_at: r.attempt_completed_at,
      } : null,
    }))

    return res.json({ success: true, data: { assessments } })
  } catch (err) {
    console.error('[listAssessments]', err)
    return res.status(500).json({ success: false, message: 'Failed to load assessments' })
  }
}

/**
 * GET /students/me/assessments/:id
 * Returns assessment with questions (options only, no correct_answer)
 */
export async function getAssessment(req, res) {
  try {
    const { id } = req.params
    const assessmentRes = await pool.query(`
      SELECT a.*, s.name AS skill_name
      FROM assessments a
      LEFT JOIN skills s ON s.id = a.skill_id
      WHERE a.id = $1 AND a.status = 'ACTIVE'
    `, [id])

    if (!assessmentRes.rows.length) return res.status(404).json({ success: false, message: 'Assessment not found' })
    const assessment = assessmentRes.rows[0]

    const questionsRes = await pool.query(`
      SELECT id, question, options, order_index, points
      FROM assessment_questions
      WHERE assessment_id = $1
      ORDER BY order_index ASC
    `, [id])

    return res.json({
      success: true,
      data: {
        id: assessment.id, title: assessment.title, description: assessment.description,
        difficulty: assessment.difficulty, time_limit: assessment.time_limit,
        passing_score: assessment.passing_score, skill_name: assessment.skill_name,
        question_count: questionsRes.rows.length,
        questions: questionsRes.rows.map(q => ({
          id: q.id, question: q.question, options: q.options, points: q.points,
        })),
      },
    })
  } catch (err) {
    console.error('[getAssessment]', err)
    return res.status(500).json({ success: false, message: 'Failed to load assessment' })
  }
}

/**
 * POST /students/me/assessments/:id/submit
 * Body: { answers: { [questionId]: selectedAnswer } }
 * Calculates score, creates attempt, optionally updates skill level
 */
export async function submitAssessment(req, res) {
  const client = await pool.connect()
  try {
    const { id: assessmentId } = req.params
    const { answers } = req.body

    const studentRes = await client.query('SELECT id FROM students WHERE user_id = $1', [req.user.id])
    if (!studentRes.rows.length) return res.status(404).json({ success: false, message: 'Student not found' })
    const studentId = studentRes.rows[0].id

    // Load assessment with correct answers
    const assessmentRes = await client.query(
      'SELECT * FROM assessments WHERE id = $1 AND status = $2',
      [assessmentId, 'ACTIVE']
    )
    if (!assessmentRes.rows.length) return res.status(404).json({ success: false, message: 'Assessment not found' })
    const assessment = assessmentRes.rows[0]

    const questionsRes = await client.query(
      'SELECT * FROM assessment_questions WHERE assessment_id = $1 ORDER BY order_index ASC',
      [assessmentId]
    )
    const questions = questionsRes.rows

    await client.query('BEGIN')

    // Create attempt record
    const attemptRes = await client.query(`
      INSERT INTO assessment_attempts (assessment_id, student_id, status, total_questions)
      VALUES ($1, $2, 'IN_PROGRESS', $3)
      RETURNING id
    `, [assessmentId, studentId, questions.length])
    const attemptId = attemptRes.rows[0].id

    // Score answers
    let correct = 0
    let totalPoints = 0
    const breakdown = []
    for (const q of questions) {
      const selected = answers?.[q.id] || null
      const isCorrect = selected && selected.trim() === q.correct_answer.trim()
      if (isCorrect) { correct++; totalPoints += q.points }
      await client.query(`
        INSERT INTO assessment_answers (attempt_id, question_id, selected_answer, is_correct, points_earned)
        VALUES ($1, $2, $3, $4, $5)
      `, [attemptId, q.id, selected, isCorrect, isCorrect ? q.points : 0])
      breakdown.push({ question: q.question, isCorrect, correctAnswer: !isCorrect ? q.correct_answer : null })
    }

    const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0
    const passed = score >= assessment.passing_score
    const wrong = questions.length - correct

    // Determine new skill level
    let newLevel = null
    if (passed && assessment.skill_id) {
      newLevel = score >= 90 ? 'EXPERT' : score >= 75 ? 'ADVANCED' : score >= 60 ? 'INTERMEDIATE' : 'BASIC'
      // Update student skill
      const existingSkill = await client.query(
        'SELECT id FROM student_skills WHERE student_id = $1 AND skill_id = $2',
        [studentId, assessment.skill_id]
      )
      if (existingSkill.rows.length) {
        await client.query(
          'UPDATE student_skills SET verified_level = $1, updated_at = NOW() WHERE student_id = $2 AND skill_id = $3',
          [newLevel, studentId, assessment.skill_id]
        )
      }
    }

    // Complete attempt
    await client.query(`
      UPDATE assessment_attempts
      SET status = 'COMPLETED', score = $1, correct_answers = $2, wrong_answers = $3,
          new_level = $4, completed_at = NOW()
      WHERE id = $5
    `, [score, correct, wrong, newLevel, attemptId])

    await client.query('COMMIT')

    return res.json({
      success: true,
      data: {
        score, passed, correctAnswers: correct, wrongAnswers: wrong,
        totalQuestions: questions.length, newLevel, breakdown,
      },
    })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[submitAssessment]', err)
    return res.status(500).json({ success: false, message: 'Failed to submit assessment' })
  } finally {
    client.release()
  }
}

/**
 * POST /assessments  (admin/academia)
 */
export async function createAssessment(req, res) {
  try {
    const { title, description, skillId, difficulty, timeLimit, passingScore } = req.body
    const { rows } = await pool.query(`
      INSERT INTO assessments (title, description, skill_id, difficulty, time_limit, passing_score, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [title, description, skillId || null, difficulty || 'MEDIUM', timeLimit || 30, passingScore || 60, req.user.id])
    return res.status(201).json({ success: true, data: { assessment: rows[0] } })
  } catch (err) {
    console.error('[createAssessment]', err)
    return res.status(500).json({ success: false, message: 'Failed to create assessment' })
  }
}

/**
 * POST /assessments/:id/questions  (admin/academia)
 */
export async function addQuestion(req, res) {
  try {
    const { id: assessmentId } = req.params
    const { question, options, correctAnswer, explanation, points, orderIndex } = req.body
    const { rows } = await pool.query(`
      INSERT INTO assessment_questions (assessment_id, question, options, correct_answer, explanation, points, order_index)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [assessmentId, question, JSON.stringify(options), correctAnswer, explanation || null, points || 1, orderIndex || 0])
    return res.status(201).json({ success: true, data: { questionId: rows[0].id } })
  } catch (err) {
    console.error('[addQuestion]', err)
    return res.status(500).json({ success: false, message: 'Failed to add question' })
  }
}
