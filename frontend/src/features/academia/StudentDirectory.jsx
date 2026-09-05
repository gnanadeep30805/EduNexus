import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { Card, Badge, SkeletonCard, ErrorState, EmptyState } from '../../components/ui/index.jsx'
import { Users, Search, GraduationCap } from 'lucide-react'

function useStudents(params) {
  return useQuery({
    queryKey: ['academia', 'students', params],
    queryFn: () => api.get('/academia/students', { params }).then(r => r.data.data),
    keepPreviousData: true,
  })
}

export default function StudentDirectory() {
  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(1)
  const params = { ...(search ? { search } : {}), page, pageSize: 20 }
  const { data, isLoading, error, refetch } = useStudents(params)

  const students = data?.students || data?.items || []
  const total    = data?.total || 0
  const totalPages = Math.ceil(total / 20)

  return (
    <div>
      <div className="section-header">
        <div>
          <p className="section-eyebrow">STUDENTS</p>
          <h1 className="section-title">Student Directory</h1>
          <p className="section-desc">{total} students enrolled</p>
        </div>
      </div>

      <Card className="card-padded" style={{ marginBottom: '1.25rem' }}>
        <div className="search-wrap">
          <Search size={15} className="search-icon" />
          <input className="input" style={{ paddingLeft: '2.25rem' }} placeholder="Search by name, email, course, department…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
      </Card>

      {isLoading ? (
        <SkeletonCard lines={8} />
      ) : error ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : students.length === 0 ? (
        <Card className="card-padded"><EmptyState icon={Users} title="No students found" description="No students match your search criteria." /></Card>
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Department</th>
                  <th>Grad. Year</th>
                  <th>Skills</th>
                  <th>Verified</th>
                  <th>Availability</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{s.full_name || `${s.first_name || ''} ${s.last_name || ''}`.trim()}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{s.email}</div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{s.course || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{s.department_name || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{s.graduation_year || '—'}</td>
                    <td>
                      <span style={{ fontWeight: 700 }}>{s.skill_count || 0}</span>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}> skills</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--color-success-600)' }}>{s.verified_skill_count || 0}</span>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}> verified</span>
                    </td>
                    <td>
                      {s.internship_availability
                        ? <Badge variant="success" dot>Available</Badge>
                        : <Badge variant="neutral">Not available</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
              <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Page {page} of {totalPages}</span>
              <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
