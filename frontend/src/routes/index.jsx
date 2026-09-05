import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '../context/AuthContext'
import { ThemeProvider } from '../context/ThemeContext'
import { ToastProvider } from '../context/ToastContext.jsx'
import { RequireAuth, RedirectIfAuth } from './guards'
import { LoadingPage } from '../components/ui/index.jsx'

// Auth pages (eager)
import LoginPage    from '../features/auth/LoginPage'
import RegisterPage from '../features/auth/RegisterPage'

// Student pages (lazy)
const StudentDashboard  = lazy(() => import('../features/student/StudentDashboard'))
const StudentProfile    = lazy(() => import('../features/student/StudentProfile'))
const StudentSkills     = lazy(() => import('../features/student/StudentSkills'))
const SkillPassport     = lazy(() => import('../features/student/SkillPassport'))
const SkillGaps         = lazy(() => import('../features/student/SkillGaps'))
const CareerPath        = lazy(() => import('../features/student/CareerPath'))
const Learning          = lazy(() => import('../features/student/Learning'))
const Assessments       = lazy(() => import('../features/student/Assessments'))
const AssessmentSession = lazy(() => import('../features/student/AssessmentSession'))
const OpportunitySearch = lazy(() => import('../features/student/OpportunitySearch'))
const OpportunityDetail = lazy(() => import('../features/student/OpportunityDetail'))
const ApplicationList   = lazy(() => import('../features/student/ApplicationList'))
const InternshipList    = lazy(() => import('../features/student/InternshipList'))
const Portfolio         = lazy(() => import('../features/student/Portfolio'))
const StudentNotifications = lazy(() => import('../features/student/Notifications'))
const StudentSettings   = lazy(() => import('../features/student/Settings'))

// Industry pages (lazy)
const IndustryDashboard  = lazy(() => import('../features/industry/IndustryDashboard'))
const OpportunityManager = lazy(() => import('../features/industry/OpportunityManager'))
const CandidateSearch    = lazy(() => import('../features/industry/CandidateSearch'))
const RecruitmentPipeline= lazy(() => import('../features/industry/RecruitmentPipeline'))
const InterviewManager   = lazy(() => import('../features/industry/InterviewManager'))
const CompanyProfile     = lazy(() => import('../features/industry/CompanyProfile'))
const Collaborations     = lazy(() => import('../features/industry/Collaborations'))
const IndustryNotifications = lazy(() => import('../features/industry/IndustryNotifications'))
const IndustrySettings   = lazy(() => import('../features/industry/IndustrySettings'))

// Academia pages (lazy)
const AcademiaDashboard  = lazy(() => import('../features/academia/AcademiaDashboard'))
const StudentDirectory   = lazy(() => import('../features/academia/StudentDirectory'))
const SkillIntelligence  = lazy(() => import('../features/academia/SkillIntelligence'))
const InternshipMonitoring = lazy(() => import('../features/academia/InternshipMonitoring'))
const PlacementTracker   = lazy(() => import('../features/academia/PlacementTracker'))
const CollaborationHub   = lazy(() => import('../features/academia/CollaborationHub'))
const CurriculumAlignment= lazy(() => import('../features/academia/CurriculumAlignment'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function SuspenseRoute({ children }) {
  return <Suspense fallback={<LoadingPage />}>{children}</Suspense>
}

export default function AppRouter() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                {/* Public / auth routes */}
                <Route element={<RedirectIfAuth />}>
                  <Route path="/login"    element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                </Route>

                {/* Root redirect */}
                <Route path="/" element={<Navigate to="/login" replace />} />

                {/* Student routes */}
                <Route element={<RequireAuth role="STUDENT" />}>
                  <Route path="/student"                    element={<Navigate to="/student/dashboard" replace />} />
                  <Route path="/student/dashboard"          element={<SuspenseRoute><StudentDashboard /></SuspenseRoute>} />
                  <Route path="/student/profile"            element={<SuspenseRoute><StudentProfile /></SuspenseRoute>} />
                  <Route path="/student/skills"             element={<SuspenseRoute><StudentSkills /></SuspenseRoute>} />
                  <Route path="/student/skill-passport"     element={<SuspenseRoute><SkillPassport /></SuspenseRoute>} />
                  <Route path="/student/skill-gaps"         element={<SuspenseRoute><SkillGaps /></SuspenseRoute>} />
                  <Route path="/student/career-path"        element={<SuspenseRoute><CareerPath /></SuspenseRoute>} />
                  <Route path="/student/learning"           element={<SuspenseRoute><Learning /></SuspenseRoute>} />
                  <Route path="/student/assessments"        element={<SuspenseRoute><Assessments /></SuspenseRoute>} />
                  <Route path="/student/assessments/:id"    element={<SuspenseRoute><AssessmentSession /></SuspenseRoute>} />
                  <Route path="/student/opportunities"      element={<SuspenseRoute><OpportunitySearch /></SuspenseRoute>} />
                  <Route path="/student/opportunities/:id"  element={<SuspenseRoute><OpportunityDetail /></SuspenseRoute>} />
                  <Route path="/student/applications"       element={<SuspenseRoute><ApplicationList /></SuspenseRoute>} />
                  <Route path="/student/internships"        element={<SuspenseRoute><InternshipList /></SuspenseRoute>} />
                  <Route path="/student/portfolio"          element={<SuspenseRoute><Portfolio /></SuspenseRoute>} />
                  <Route path="/student/certifications"     element={<Navigate to="/student/portfolio" replace />} />
                  <Route path="/student/notifications"      element={<SuspenseRoute><StudentNotifications /></SuspenseRoute>} />
                  <Route path="/student/settings"           element={<SuspenseRoute><StudentSettings /></SuspenseRoute>} />
                </Route>

                {/* Industry routes */}
                <Route element={<RequireAuth role="RECRUITER" />}>
                  <Route path="/industry"                    element={<Navigate to="/industry/dashboard" replace />} />
                  <Route path="/industry/dashboard"          element={<SuspenseRoute><IndustryDashboard /></SuspenseRoute>} />
                  <Route path="/industry/opportunities"      element={<SuspenseRoute><OpportunityManager /></SuspenseRoute>} />
                  <Route path="/industry/candidates"         element={<SuspenseRoute><CandidateSearch /></SuspenseRoute>} />
                  <Route path="/industry/recruitment"        element={<SuspenseRoute><RecruitmentPipeline /></SuspenseRoute>} />
                  <Route path="/industry/interviews"         element={<SuspenseRoute><InterviewManager /></SuspenseRoute>} />
                  <Route path="/industry/offers"             element={<SuspenseRoute><IndustryDashboard /></SuspenseRoute>} />
                  <Route path="/industry/collaborations"     element={<SuspenseRoute><Collaborations /></SuspenseRoute>} />
                  <Route path="/industry/company"            element={<SuspenseRoute><CompanyProfile /></SuspenseRoute>} />
                  <Route path="/industry/settings"           element={<SuspenseRoute><IndustrySettings /></SuspenseRoute>} />
                  <Route path="/industry/notifications"      element={<SuspenseRoute><IndustryNotifications /></SuspenseRoute>} />
                </Route>

                {/* Academia routes */}
                <Route element={<RequireAuth role="ACADEMIA" />}>
                  <Route path="/academia"                    element={<Navigate to="/academia/dashboard" replace />} />
                  <Route path="/academia/dashboard"          element={<SuspenseRoute><AcademiaDashboard /></SuspenseRoute>} />
                  <Route path="/academia/students"           element={<SuspenseRoute><StudentDirectory /></SuspenseRoute>} />
                  <Route path="/academia/skills"             element={<SuspenseRoute><SkillIntelligence /></SuspenseRoute>} />
                  <Route path="/academia/internships"        element={<SuspenseRoute><InternshipMonitoring /></SuspenseRoute>} />
                  <Route path="/academia/placements"         element={<SuspenseRoute><PlacementTracker /></SuspenseRoute>} />
                  <Route path="/academia/collaborations"     element={<SuspenseRoute><CollaborationHub /></SuspenseRoute>} />
                  <Route path="/academia/curriculum"         element={<SuspenseRoute><CurriculumAlignment /></SuspenseRoute>} />
                  <Route path="/academia/settings"           element={<SuspenseRoute><StudentSettings /></SuspenseRoute>} />
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
