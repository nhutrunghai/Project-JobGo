import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import RequireAuth from '../../components/RequireAuth.jsx'
import RequireEmployerCompany from '../../components/RequireEmployerCompany.jsx'
import PageLoader from '../../components/feedback/PageLoader.jsx'

const Home = lazy(() => import('../../App.jsx'))
const Dashboard = lazy(() => import('../../pages/Dashboard.jsx'))
const JobList = lazy(() => import('../../pages/JobList.jsx'))
const Contracts = lazy(() => import('../../pages/Contracts.jsx'))
const JobDirectory = lazy(() => import('../../pages/JobDirectory.jsx'))
const MilestoneManagement = lazy(() => import('../../pages/MilestoneManagement.jsx'))
const Notifications = lazy(() => import('../../pages/Notifications.jsx'))
const JobProgress = lazy(() => import('../../pages/JobProgress.jsx'))
const MessagesCenter = lazy(() => import('../../pages/MessagesCenter.jsx'))
const UploadedCvs = lazy(() => import('../../pages/UploadedCvs.jsx'))
const AppliedProfileEdit = lazy(() => import('../../pages/AppliedProfileEdit.jsx'))
const AuthPortal = lazy(() => import('../../pages/AuthPortal.jsx'))
const VerifyEmail = lazy(() => import('../../pages/VerifyEmail.jsx'))
const JobDetail = lazy(() => import('../../pages/JobDetail.jsx'))
const Discussions = lazy(() => import('../../pages/Discussions.jsx'))
const Favorites = lazy(() => import('../../pages/Favorites.jsx'))
const SearchJobs = lazy(() => import('../../pages/SearchJobs.jsx'))
const AIAgent = lazy(() => import('../../pages/AIAgent.jsx'))
const UserProfileEdit = lazy(() => import('../../pages/UserProfileEdit.jsx'))
const UserPublicProfile = lazy(() => import('../../pages/UserPublicProfile.jsx'))
const UserSettings = lazy(() => import('../../pages/UserSettings.jsx'))
const WalletTopUp = lazy(() => import('../../pages/WalletTopUp.jsx'))

const EmployerOverviewDashboard = lazy(() => import('../../pages/tuyen-dung/EmployerOverviewDashboard.jsx'))
const EmployerCompanyRegistration = lazy(() => import('../../pages/tuyen-dung/EmployerCompanyRegistration.jsx'))
const EmployerRecruitmentDashboard = lazy(() => import('../../pages/tuyen-dung/EmployerRecruitmentDashboard.jsx'))
const EmployerJobList = lazy(() => import('../../pages/tuyen-dung/EmployerJobList.jsx'))
const EmployerInterviewCalendar = lazy(() => import('../../pages/tuyen-dung/EmployerInterviewCalendar.jsx'))
const EmployerMilestoneDashboard = lazy(() => import('../../pages/tuyen-dung/EmployerMilestoneDashboard.jsx'))
const EmployerReceivedProfiles = lazy(() => import('../../pages/tuyen-dung/EmployerReceivedProfiles.jsx'))
const EmployerCandidateDetail = lazy(() => import('../../pages/tuyen-dung/EmployerCandidateDetail.jsx'))
const EmployerMessages = lazy(() => import('../../pages/tuyen-dung/EmployerMessages.jsx'))
const EmployerNotifications = lazy(() => import('../../pages/tuyen-dung/EmployerNotifications.jsx'))
const EmployerJobPromotions = lazy(() => import('../../pages/tuyen-dung/EmployerJobPromotions.jsx'))
const EmployerJobPromotionDetail = lazy(() => import('../../pages/tuyen-dung/EmployerJobPromotionDetail.jsx'))

const AdminLogin = lazy(() => import('../../pages/admin/AdminLogin.jsx'))
const AdminDashboard = lazy(() => import('../../pages/admin/AdminDashboard.jsx'))
const AdminUsers = lazy(() => import('../../pages/admin/AdminUsers.jsx'))
const AdminCompanies = lazy(() => import('../../pages/admin/AdminCompanies.jsx'))
const AdminJobs = lazy(() => import('../../pages/admin/AdminJobs.jsx'))
const AdminJobCategories = lazy(() => import('../../pages/admin/AdminJobCategories.jsx'))
const AdminJobPromotions = lazy(() => import('../../pages/admin/AdminJobPromotions.jsx'))
const AdminJobPromotionPlans = lazy(() => import('../../pages/admin/AdminJobPromotionPlans.jsx'))
const AdminWalletTransactions = lazy(() => import('../../pages/admin/AdminWalletTransactions.jsx'))
const AdminSePayConfig = lazy(() => import('../../pages/admin/AdminSePayConfig.jsx'))
const AdminRagChatConfig = lazy(() => import('../../pages/admin/AdminRagChatConfig.jsx'))
const AdminAuditLogs = lazy(() => import('../../pages/admin/AdminAuditLogs.jsx'))

const protectedPage = (element) => <RequireAuth>{element}</RequireAuth>
const employerPage = (element) => <RequireAuth><RequireEmployerCompany>{element}</RequireEmployerCompany></RequireAuth>

export default function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<AuthPortal mode="login" />} />
        <Route path="/register" element={<AuthPortal mode="register" />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<AuthPortal mode="forgot" />} />
        <Route path="/reset-password" element={<AuthPortal mode="reset" />} />
        <Route path="/job-detail" element={<JobDetail />} />
        <Route path="/job-detail/:id" element={<JobDetail />} />
        <Route path="/discussions" element={<Discussions />} />
        <Route path="/search-jobs" element={<SearchJobs />} />
        <Route path="/ai-agent" element={<AIAgent />} />
        <Route path="/user/profile/:id" element={<UserPublicProfile />} />

        <Route path="/dashboard" element={protectedPage(<Dashboard />)} />
        <Route path="/jobs" element={protectedPage(<JobList />)} />
        <Route path="/contracts" element={protectedPage(<Contracts />)} />
        <Route path="/milestones" element={protectedPage(<MilestoneManagement />)} />
        <Route path="/notifications" element={protectedPage(<Notifications />)} />
        <Route path="/job-progress" element={protectedPage(<JobProgress />)} />
        <Route path="/uploaded-cvs" element={protectedPage(<UploadedCvs />)} />
        <Route path="/uploaded-cvs/:cvId/edit" element={protectedPage(<AppliedProfileEdit />)} />
        <Route path="/messages" element={protectedPage(<MessagesCenter />)} />
        <Route path="/favorites" element={protectedPage(<Favorites />)} />
        <Route path="/user/profile" element={protectedPage(<UserPublicProfile />)} />
        <Route path="/user/profile/edit" element={protectedPage(<UserProfileEdit />)} />
        <Route path="/user/settings" element={protectedPage(<UserSettings />)} />
        <Route path="/wallet/top-up" element={protectedPage(<WalletTopUp />)} />
        <Route path="/job-list" element={<JobDirectory />} />

        <Route path="/employer-dashboard" element={protectedPage(<EmployerOverviewDashboard />)} />
        <Route path="/employer/company-registration" element={protectedPage(<EmployerCompanyRegistration />)} />
        <Route path="/employer-post-job" element={employerPage(<EmployerRecruitmentDashboard />)} />
        <Route path="/employer-job-list" element={employerPage(<EmployerJobList />)} />
        <Route path="/employer-received-cv" element={employerPage(<EmployerReceivedProfiles />)} />
        <Route path="/employer-received-cv/:applicationId" element={employerPage(<EmployerCandidateDetail />)} />
        <Route path="/employer-interviews" element={employerPage(<EmployerInterviewCalendar />)} />
        <Route path="/employer-messages" element={employerPage(<EmployerMessages />)} />
        <Route path="/employer-notifications" element={employerPage(<EmployerNotifications />)} />
        <Route path="/employer-milestones" element={employerPage(<EmployerMilestoneDashboard />)} />
        <Route path="/employer-job-promotions" element={employerPage(<EmployerJobPromotions />)} />
        <Route path="/employer-job-promotions/:promotionId" element={employerPage(<EmployerJobPromotionDetail />)} />

        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/companies" element={<AdminCompanies />} />
        <Route path="/admin/jobs" element={<AdminJobs />} />
        <Route path="/admin/job-categories" element={<AdminJobCategories />} />
        <Route path="/admin/job-promotions" element={<AdminJobPromotions />} />
        <Route path="/admin/job-promotion-plans" element={<AdminJobPromotionPlans />} />
        <Route path="/admin/wallet-transactions" element={<AdminWalletTransactions />} />
        <Route path="/admin/sepay-config" element={<AdminSePayConfig />} />
        <Route path="/admin/rag-chat-config" element={<AdminRagChatConfig />} />
        <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
