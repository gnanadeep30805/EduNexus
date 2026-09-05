import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../../services/api'
import { Card, Button, Progress, Badge, ProgressRing, ErrorState, InlineLoading, Alert } from '../../components/ui/index.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { Clock, ChevronLeft, ChevronRight, CheckCircle, X, ArrowRight } from 'lucide-react'

function useAssessmentDetail(id) {
  return useQuery({
    queryKey: ['assessment', id],
    queryFn: () => api.get(`/students/me/assessments/${id}`).then(r => r.data.data),
    enabled: !!id,
  })
}

function useTimer(seconds, onExpire) {
  const [remaining, setRemaining] = useState(seconds)
  const ref = useRef()
  useEffect(() => {
    ref.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) { clearInterval(ref.current); onExpire?.(); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(ref.current)
  }, [])
  return remaining
}

function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

// ── Intro screen ──────────────────────────────────────────────────
function IntroScreen({ assessment, onStart }) {
  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <Link to="/student/assessments" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', textDecoration: 'none' }}>
        <ChevronLeft size={15} /> All Assessments
      </Link>
      <Card className="card-padded">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📋</div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800, marginBottom: 4 }}>{assessment.title}</h1>
          {assessment.skill_name && <p style={{ color: 'var(--text-secondary)' }}>Skill: <strong>{assessment.skill_name}</strong></p>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', textAlign: 'center', marginBottom: '1.5rem' }}>
          {[
            { label: 'Questions', val: assessment.question_count || '—' },
            { label: 'Time limit', val: assessment.time_limit ? `${assessment.time_limit} min` : 'No limit' },
            { label: 'Difficulty', val: assessment.difficulty },
          ].map(({ label, val }) => (
            <div key={label} style={{ padding: '0.875rem', background: 'var(--bg-overlay)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontWeight: 800, fontSize: '1.125rem' }}>{val}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{label}</div>
            </div>
          ))}
        </div>
        {assessment.description && (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.7 }}>
            {assessment.description}
          </p>
        )}
        <Alert variant="info" style={{ marginBottom: '1.25rem' }}>
          Your score will be used to update your verified skill level in your passport.
        </Alert>
        <Button style={{ width: '100%', justifyContent: 'center' }} onClick={onStart}>
          Start Assessment <ArrowRight size={14} />
        </Button>
      </Card>
    </div>
  )
}

// ── Quiz screen ───────────────────────────────────────────────────
function QuizScreen({ assessment, onComplete }) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers]       = useState({})
  const questions = assessment.questions || []
  const totalSecs = (assessment.time_limit || 30) * 60

  const timeLeft = useTimer(totalSecs, () => onComplete(answers))

  function select(questionId, option) {
    setAnswers(prev => ({ ...prev, [questionId]: option }))
  }

  function next() {
    if (currentIdx < questions.length - 1) setCurrentIdx(i => i + 1)
    else onComplete(answers)
  }

  const q = questions[currentIdx]
  if (!q) return null
  const pct = Math.round(((currentIdx) / questions.length) * 100)

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Question {currentIdx + 1} of {questions.length}
        </span>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          color: timeLeft < 60 ? 'var(--color-error-500)' : 'var(--text-secondary)',
          fontWeight: 700, fontSize: '0.9375rem',
        }}>
          <Clock size={15} /> {formatTime(timeLeft)}
        </div>
      </div>
      <Progress value={currentIdx} max={questions.length} style={{ marginBottom: '1.5rem' }} />

      <Card className="card-padded">
        <h2 style={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.5, marginBottom: '1.5rem' }}>{q.question}</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.5rem' }}>
          {(q.options || []).map((option, i) => {
            const selected = answers[q.id] === option
            return (
              <button
                key={i}
                onClick={() => select(q.id, option)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '0.875rem 1rem', border: `2px solid ${selected ? 'var(--accent-primary)' : 'var(--border-base)'}`,
                  borderRadius: 'var(--radius-md)', background: selected ? 'var(--accent-light)' : 'var(--bg-surface)',
                  cursor: 'pointer', width: '100%', textAlign: 'left',
                  fontSize: '0.875rem', color: selected ? 'var(--accent-primary)' : 'var(--text-primary)',
                  fontWeight: selected ? 600 : 400,
                  transition: 'all var(--transition-fast)',
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${selected ? 'var(--accent-primary)' : 'var(--border-strong)'}`,
                  background: selected ? 'var(--accent-primary)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {selected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
                </div>
                {option}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button
            className="btn btn-ghost"
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx(i => i - 1)}
          >
            <ChevronLeft size={14} /> Previous
          </button>
          <Button onClick={next} disabled={!answers[q.id]}>
            {currentIdx < questions.length - 1 ? <><ChevronRight size={14} /> Next</> : 'Finish →'}
          </Button>
        </div>
      </Card>
    </div>
  )
}

// ── Results screen ────────────────────────────────────────────────
function ResultsScreen({ result, assessment }) {
  const passed = result.score >= 60
  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <Card className="card-padded" style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>{passed ? '🎉' : '💪'}</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>
          {passed ? 'Assessment Passed!' : 'Keep Practising!'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          {passed ? 'Your skill level has been updated in your passport.' : 'Score 60% or more to verify your skill.'}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <ProgressRing value={result.score} size={100} strokeWidth={8} label={`${result.score}%`} />
        </div>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--color-success-600)' }}>{result.correctAnswers}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Correct</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--color-error-500)' }}>{result.wrongAnswers}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Incorrect</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: '1.25rem' }}>{result.totalQuestions}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Total</div>
          </div>
        </div>
        {passed && result.newLevel && (
          <Badge variant="success" style={{ fontSize: '0.875rem' }}>
            ✓ Skill updated to {result.newLevel.toLowerCase()}
          </Badge>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: '1.25rem' }}>
          <Link to="/student/assessments">
            <button className="btn btn-secondary">Back to assessments</button>
          </Link>
          <Link to="/student/skill-passport">
            <button className="btn btn-primary">View passport →</button>
          </Link>
        </div>
      </Card>

      {/* Question breakdown */}
      {result.breakdown?.length > 0 && (
        <Card className="card-padded">
          <h3 className="card-title" style={{ marginBottom: '1rem' }}>Question breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {result.breakdown.map((q, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '0.75rem', borderRadius: 'var(--radius-md)', background: q.isCorrect ? 'var(--color-success-50)' : 'var(--color-error-50)' }}>
                {q.isCorrect
                  ? <CheckCircle size={16} style={{ color: 'var(--color-success-600)', flexShrink: 0, marginTop: 2 }} />
                  : <X size={16} style={{ color: 'var(--color-error-500)', flexShrink: 0, marginTop: 2 }} />}
                <div>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{q.question}</p>
                  {!q.isCorrect && q.correctAnswer && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-success-700)' }}>Correct: {q.correctAnswer}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────
export default function AssessmentSession() {
  const { id } = useParams()
  const toast = useToast()
  const [stage, setStage] = useState('intro')   // intro | quiz | results
  const [result, setResult] = useState(null)

  const { data, isLoading, error } = useAssessmentDetail(id)

  const submitMut = useMutation({
    mutationFn: answers => api.post(`/students/me/assessments/${id}/submit`, { answers }),
    onSuccess: res => { setResult(res.data.data); setStage('results') },
    onError: err => {
      toast.error(err.message)
      setStage('intro')
    },
  })

  if (isLoading) return <InlineLoading message="Loading assessment…" />
  if (error) return <ErrorState message={error.message} />
  if (!data) return null

  if (stage === 'intro') return <IntroScreen assessment={data} onStart={() => setStage('quiz')} />
  if (stage === 'quiz')  return <QuizScreen assessment={data} onComplete={answers => { setStage('submitting'); submitMut.mutate(answers) }} />
  if (stage === 'submitting') return <InlineLoading message="Calculating your score…" />
  if (stage === 'results' && result) return <ResultsScreen result={result} assessment={data} />
  return null
}
