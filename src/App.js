import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import { HCPSidebar } from "@/components/HCPSidebar";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import VerifyOtpPage from "@/pages/VerifyOtpPage";
import ForgotPassword from "./pages/ForgotPassword";
import DashboardPage from "@/pages/DashboardPage";
import BiomarkersPage from "@/pages/BiomarkersPage";
import WearablesPage from "@/pages/WearablesPage";
import LeaderboardPage from "@/pages/LeaderboardPage";
import RoadmapPage from "@/pages/RoadmapPage";
import ProfilePage from "@/pages/ProfilePage";
import FranchiseAdminPage from "@/pages/FranchiseAdminPage";
import SeasonsPage from "@/pages/SeasonsPage";
import ChallengesPage from "@/pages/ChallengesPage";
import RewardsPage from "@/pages/RewardsPage";
import SocialFeedPage from "@/pages/SocialFeedPage";
import NutritionPage from "@/pages/NutritionPage";
import HealthOverviewPage from "@/pages/HealthOverviewPage";
import CareTeamPage from "@/pages/CareTeamPage";
import SettingsPage from "@/pages/SettingsPage";
import MindCognitionPage from "@/pages/MindCognitionPage";
import HealthSnapshotsPage from "@/pages/HealthSnapshotsPage";
import TopBar from "@/components/TopBar";
/* New patient flow pages */
import LocationSetupPage from "@/pages/LocationSetupPage";
import PatientChatPage from "@/pages/PatientChatPage";
import BookLabTestPage from "@/pages/BookLabTestPage";
import LabReportViewPage from "@/pages/LabReportViewPage";
import VideoConsultationPage from "@/pages/VideoConsultationPage";
import LongevityProtocolPage from "@/pages/LongevityProtocolPage";
import PostCallActionsPage from "@/pages/PostCallActionsPage";
import SplashScreen from "@/pages/SplashScreen";
import LocationPermissionPage from "@/pages/LocationPermissionPage";
import PhlebotomistDashboardPage from "@/pages/PhlebotomistDashboardPage";
/* HCP shared */
import HCPDashboardPage from "@/pages/hcp/HCPDashboardPage";
import HCPMembersPage from "@/pages/hcp/HCPMembersPage";
import HCPMemberDetailPage from "@/pages/hcp/HCPMemberDetailPage";
import HCPAlertQueuePage from "@/pages/hcp/HCPAlertQueuePage";
import HCPProtocolsPage from "@/pages/hcp/HCPProtocolsPage";
import HCPSessionsPage from "@/pages/hcp/HCPSessionsPage";
import HCPOverridePage from "@/pages/hcp/HCPOverridePage";
import HCPPopulationPage from "@/pages/hcp/HCPPopulationPage";
import HCPLabOrdersPage from "@/pages/hcp/HCPLabOrdersPage";
import HCPEMRPage from "@/pages/hcp/HCPEMRPage";
import HCPPrescriptionsPage from "@/pages/hcp/HCPPrescriptionsPage";
import HCPTelehealthPage from "@/pages/hcp/HCPTelehealthPage";
import HCPTelehealthRoom from "@/pages/hcp/HCPTelehealthRoom";
import HCPNFLEPage from "@/pages/hcp/HCPNFLEPage";
import HCPPharmacyPage from "@/pages/hcp/HCPPharmacyPage";
import HCPFhirPage from "@/pages/hcp/HCPFhirPage";
import HCPAppointmentsPage from "@/pages/hcp/HCPAppointmentsPage";
import HCPReviewPage from "@/pages/hcp/HCPReviewPage";
import SmartEMRPage from "@/pages/hcp/SmartEMRPage";
import PatientProfilePage from "@/pages/hcp/PatientProfilePage";
import SecureMessagingPage from "@/pages/hcp/SecureMessagingPage";
import WearableDashboardPage from "@/pages/hcp/WearableDashboardPage";
import EscalationsPage from "@/pages/hcp/EscalationsPage";
/* PFC: Physical Fitness Coach */
import PFCDashboardPage from "@/pages/hcp/PFCDashboardPage";
import PFCProgrammesPage from "@/pages/hcp/PFCProgrammesPage";
import PFCWearableFeedPage from "@/pages/hcp/PFCWearableFeedPage";
import PFCHabitsPage from "@/pages/hcp/PFCHabitsPage";
import PFCChallengesPage from "@/pages/hcp/PFCChallengesPage";
/* PSY: Psychology Therapist */
import PSYDashboardPage from "@/pages/hcp/PSYDashboardPage";
import PSYAssessmentsPage from "@/pages/hcp/PSYAssessmentsPage";
import PSYCBTModulesPage from "@/pages/hcp/PSYCBTModulesPage";
import PSYCrisisAlertsPage from "@/pages/hcp/PSYCrisisAlertsPage";
import PSYSessionNotesPage from "@/pages/hcp/PSYSessionNotesPage";
import PSYTherapyProgramsPage from "@/pages/hcp/PSYTherapyProgramsPage";
import PSYMentalOutcomesPage from "@/pages/hcp/PSYMentalOutcomesPage";
/* NUT: Nutritional Coach */
import NUTDashboardPage from "@/pages/hcp/NUTDashboardPage";
import NUTMealPlansPage from "@/pages/hcp/NUTMealPlansPage";
import NUTSupplementsPage from "@/pages/hcp/NUTSupplementsPage";
import NUTFoodDiaryPage from "@/pages/hcp/NUTFoodDiaryPage";
import NUTConsultNotesPage from "@/pages/hcp/NUTConsultNotesPage";
import NUTBodyCompPage from "@/pages/hcp/NUTBodyCompPage";
import NUTNutritionAnalyticsPage from "@/pages/hcp/NUTNutritionAnalyticsPage";
/* Shared coach */
import CoachSessionLogPage from "@/pages/hcp/CoachSessionLogPage";
import CoachMessagingPage from "@/pages/hcp/CoachMessagingPage";
import CheckInsPage from "@/pages/hcp/CheckInsPage";
import GoalsPage from "@/pages/hcp/GoalsPage";
import CoachInsightsPage from "@/pages/hcp/CoachInsightsPage";
import CorporateWellnessPage from "@/pages/hcp/CorporateWellnessPage";
import ResourcesPage from "@/pages/hcp/ResourcesPage";
import CoachProfilePage from "@/pages/hcp/CoachProfilePage";
/* CORP: Corporate HR Admin / Wellness Head */
import CorpDashboardPage from "@/pages/hcp/CorpDashboardPage";
import CorpEmployeesPage from "@/pages/hcp/CorpEmployeesPage";
import CorpEngagementPage from "@/pages/hcp/CorpEngagementPage";
import CorpBurnoutPage from "@/pages/hcp/CorpBurnoutPage";
import CorpDepartmentsPage from "@/pages/hcp/CorpDepartmentsPage";
import CorpOutliersPage from "@/pages/hcp/CorpOutliersPage";
import CorpProgrammesPage from "@/pages/hcp/CorpProgrammesPage";
import CorpFranchisePage from "@/pages/hcp/CorpFranchisePage";
import CorpProfitSharePage from "@/pages/hcp/CorpProfitSharePage";
import CorpAnalyticsPage from "@/pages/hcp/CorpAnalyticsPage";
import CorpNudgePage from "@/pages/hcp/CorpNudgePage";
import CorpSeasonPage from "@/pages/hcp/CorpSeasonPage";
import CorpOrganogramPage from "@/pages/hcp/CorpOrganogramPage";
import CorpHREscalationsPage from "@/pages/hcp/CorpHREscalationsPage";
import CorpManagerDashPage from "@/pages/hcp/CorpManagerDashPage";
import CorpSubscriptionPage from "@/pages/hcp/CorpSubscriptionPage";
import CorpAIHubPage from "@/pages/hcp/CorpAIHubPage";
import CorpDataQualityPage from "@/pages/hcp/CorpDataQualityPage";
import CorpCareEscalationPage from "@/pages/hcp/CorpCareEscalationPage";
import RoadmapReviewPage from "@/pages/hcp/RoadmapReviewPage";
/* CXO: Executive Command Centre */
import CXODashboardPage from "@/pages/hcp/CXODashboardPage";
import CXOWviPage from "@/pages/hcp/CXOWviPage";
import CXOFinancialPage from "@/pages/hcp/CXOFinancialPage";
import CXOOperationsPage from "@/pages/hcp/CXOOperationsPage";
import CXOEsgPage from "@/pages/hcp/CXOEsgPage";
import CXOCompetitivePage from "@/pages/hcp/CXOCompetitivePage";
import CXOProfitSharePage from "@/pages/hcp/CXOProfitSharePage";
import CXOSimulatorPage from "@/pages/hcp/CXOSimulatorPage";
import CXOInterventionsPage from "@/pages/hcp/CXOInterventionsPage";
import CXOBoardReportsPage from "@/pages/hcp/CXOBoardReportsPage";
import CXOInvestorPage from "@/pages/hcp/CXOInvestorPage";
import CXOMissionControlPage from "@/pages/hcp/CXOMissionControlPage";
import { CXOSidebar } from "@/components/CXOSidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
/* Admin Dashboard */
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminAuditLogPage from "@/pages/admin/AdminAuditLogPage";
import AdminSupportPage from "@/pages/admin/AdminSupportPage";
import AdminFinancialPage from "@/pages/admin/AdminFinancialPage";
import AdminCorporatePage from "@/pages/admin/AdminCorporatePage";
import AdminHPSMonitorPage from "@/pages/admin/AdminHPSMonitorPage";
import AdminSupportAnalyticsPage from "@/pages/admin/AdminSupportAnalyticsPage";
import AdminAnnouncementsPage from "@/pages/admin/AdminAnnouncementsPage";
import AdminContentPage from "@/pages/admin/AdminContentPage";
import AdminSystemHealthPage from "@/pages/admin/AdminSystemHealthPage";
import AdminHRMSEmployeesPage from "@/pages/admin/AdminHRMSEmployeesPage";
import AdminHRMSPayrollPage from "@/pages/admin/AdminHRMSPayrollPage";
import AdminHRMSPerformancePage from "@/pages/admin/AdminHRMSPerformancePage";
import AdminHRMSLeavesPage from "@/pages/admin/AdminHRMSLeavesPage";
import AdminHRMSAssetsPage from "@/pages/admin/AdminHRMSAssetsPage";
import AdminHRMSHelpdeskPage from "@/pages/admin/AdminHRMSHelpdeskPage";
import AdminExecutiveBriefPage from "@/pages/admin/AdminExecutiveBriefPage";
import AdminProtocolEffectivenessPage from "@/pages/admin/AdminProtocolEffectivenessPage";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import CorporateDemoSidebar from "@/components/corpdemo/CorporateDemoSidebar";
import CorporateDemoTopbar from "@/components/corpdemo/CorporateDemoTopbar";
import CorporateDemoHome from "@/pages/corpdemo/CorporateDemoHome";
import CorpDemoDashboardPage from "@/pages/corpdemo/CorpDemoDashboardPage";
import CorpDemoEmployeesPage from "@/pages/corpdemo/CorpDemoEmployeesPage";
import CorpDemoLicensesPage from "@/pages/corpdemo/CorpDemoLicensesPage";
import CorpDemoEngagementPage from "@/pages/corpdemo/CorpDemoEngagementPage";
import CorpDemoExecutiveDashboardPage from "@/pages/corpdemo/CorpDemoExecutiveDashboardPage";
import CorpDemoRiskPage from "@/pages/corpdemo/CorpDemoRiskPage";
import CorpDemoParticipationPage from "@/pages/corpdemo/CorpDemoParticipationPage";
import CorpDemoROIPage from "@/pages/corpdemo/CorpDemoROIPage";
import HRDemoCredentialsPage from "@/pages/corpdemo/HRDemoCredentialsPage";

const ADMIN_ROLES = new Set(["super_admin", "support_agent"]);

const HCP_ROLES = new Set([
  "longevity_physician", "fitness_coach", "psychologist",
  "nutritional_coach",
  "clinician", "coach", "medical_director", "clinical_admin",
  "corporate_hr_admin", "corporate_wellness_head",
]);
const CXO_ROLES = new Set(["cxo_executive"]);
const PHLEBOTOMIST_ROLES = new Set(["phlebotomist"]);

const PFC_ROLES = new Set(["fitness_coach", "coach"]);
const PSY_ROLES = new Set(["psychologist"]);
const NUT_ROLES = new Set(["nutritional_coach"]);
const CORP_ROLES = new Set(["corporate_hr_admin", "corporate_wellness_head"]);
const CORP_DEMO_ROLES = new Set(["hr_admin_demo", "hr_executive_demo"]);
const EMPLOYEE_ROLES = new Set(["employee"]);

function RoleDashboard() {
  const { user } = useAuth();
  if (CORP_ROLES.has(user?.role)) return <CorpDashboardPage />;
  if (PFC_ROLES.has(user?.role)) return <PFCDashboardPage />;
  if (PSY_ROLES.has(user?.role)) return <PSYDashboardPage />;
  if (NUT_ROLES.has(user?.role)) return <NUTDashboardPage />;
  return <HCPDashboardPage />;
}

function ProtectedLayout() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-space flex items-center justify-center">
      <div className="text-center">
        <h1 className="font-display text-3xl font-black"><span className="text-cosmic">AGE</span><span className="text-stellar">REBOOT</span></h1>
        <div className="w-10 h-10 border-2 border-cosmic/30 border-t-cosmic rounded-full animate-spin mx-auto mt-6" />
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (ADMIN_ROLES.has(user.role)) return <Navigate to="/admin" replace />;
  if (CXO_ROLES.has(user.role)) return <Navigate to="/cxo" replace />;
  if (CORP_DEMO_ROLES.has(user.role)) return <Navigate to="/corp-demo" replace />;
  if (HCP_ROLES.has(user.role)) return <Navigate to="/hcp" replace />;
  if (PHLEBOTOMIST_ROLES.has(user.role)) return <Navigate to="/phlebotomist" replace />;
   
  return (
    <div className="min-h-screen bg-space">
      <Sidebar />
      <main className="ml-60 p-6 lg:p-8 min-h-screen"><TopBar /><AnnouncementBanner /><Outlet /></main>
    </div>
  );
}

function HCPLayout() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-[#050217] flex items-center justify-center">
      <div className="text-center">
        <h1 className="font-display text-3xl font-black"><span className="text-[#7B35D8]">AGE</span><span className="text-white">REBOOT</span></h1>
        <p className="font-mono text-[9px] text-slate-500 tracking-[0.3em] uppercase mt-2">Coach Intelligence Platform</p>
        <div className="w-10 h-10 border-2 border-[#7B35D8]/30 border-t-[#7B35D8] rounded-full animate-spin mx-auto mt-6" />
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (!HCP_ROLES.has(user.role)) return <Navigate to="/" replace />;
  return (
    <div className="min-h-screen bg-[#050217]">
      <HCPSidebar />
      <main className="ml-[220px] p-6 lg:p-8 min-h-screen"><Outlet /></main>
    </div>
  );
}

function CorporateDemoLayout() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-[#050217] flex items-center justify-center">
      <div className="text-center">
        <h1 className="font-display text-3xl font-black"><span className="text-[#7B35D8]">AGE</span><span className="text-white">REBOOT</span></h1>
        <p className="font-mono text-[9px] text-slate-500 tracking-[0.3em] uppercase mt-2">Corporate Demo Portal</p>
        <div className="w-10 h-10 border-2 border-[#7B35D8]/30 border-t-[#7B35D8] rounded-full animate-spin mx-auto mt-6" />
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (!CORP_DEMO_ROLES.has(user.role)) return <Navigate to="/" replace />;
  return (
    <div className="min-h-screen bg-[#050217]">
      <CorporateDemoSidebar />
      <main className="ml-[260px] min-h-screen p-6 lg:p-8">
        <CorporateDemoTopbar />
        <Outlet />
      </main>
    </div>
  );
}

function CXOLayout() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-[#050217] flex items-center justify-center">
      <div className="text-center">
        <h1 className="font-display text-3xl font-black"><span className="text-[#CFB53B]">AGE</span><span className="text-white">REBOOT</span></h1>
        <p className="font-mono text-[9px] text-slate-500 tracking-[0.3em] uppercase mt-2">Executive Command Centre</p>
        <div className="w-10 h-10 border-2 border-[#CFB53B]/30 border-t-[#CFB53B] rounded-full animate-spin mx-auto mt-6" />
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (!CXO_ROLES.has(user.role)) return <Navigate to="/" replace />;
  return (
    <div className="min-h-screen bg-[#050217]">
      <CXOSidebar />
      <main className="ml-[220px] p-6 lg:p-8 min-h-screen"><AnnouncementBanner /><Outlet /></main>
    </div>
  );
}

function AdminLayout() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-[#050217] flex items-center justify-center">
      <div className="text-center">
        <h1 className="font-display text-3xl font-black"><span className="text-[#7B35D8]">AGE</span><span className="text-white">REBOOT</span></h1>
        <p className="font-mono text-[9px] text-slate-500 tracking-[0.3em] uppercase mt-2">Admin Command Centre</p>
        <div className="w-10 h-10 border-2 border-[#7B35D8]/30 border-t-[#7B35D8] rounded-full animate-spin mx-auto mt-6" />
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (!ADMIN_ROLES.has(user.role)) return <Navigate to="/" replace />;
  return (
    <div className="min-h-screen bg-[#050217]">
      <AdminSidebar />
      <main className="ml-[220px] p-6 lg:p-8 min-h-screen"><AnnouncementBanner /><Outlet /></main>
    </div>
  );
}

function PhlebotomistLayout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  if (loading) return (
    <div className="min-h-screen bg-[#050217] flex items-center justify-center">
      <div className="text-center">
        <h1 className="font-display text-3xl font-black"><span className="text-[#0F9F8F]">AGE</span><span className="text-white">REBOOT</span></h1>
        <p className="font-mono text-[9px] text-slate-500 tracking-[0.3em] uppercase mt-2">Collection Agent</p>
        <div className="w-10 h-10 border-2 border-[#0F9F8F]/30 border-t-[#0F9F8F] rounded-full animate-spin mx-auto mt-6" />
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (!PHLEBOTOMIST_ROLES.has(user.role)) return <Navigate to="/" replace />;
  return (
    <div className="min-h-screen bg-[#0A0A12]">
      <div className="sticky top-0 z-50 bg-[#0A0A12]/95 backdrop-blur border-b border-[#1E1E3A] px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-display text-lg font-black"><span className="text-[#0F9F8F]">AGE</span><span className="text-white">REBOOT</span></h1>
          <p className="text-[9px] text-slate-500 tracking-widest uppercase">Phlebotomist</p>
        </div>
        <button onClick={() => { logout(); navigate("/login"); }} className="text-xs text-slate-500 hover:text-white transition-colors" data-testid="phleb-logout-btn">Logout</button>
      </div>
      <main className="p-4 pb-20"><Outlet /></main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
          <Route path="/corp-demo/credentials" element={<HRDemoCredentialsPage />} />
          <Route path="/splash" element={<SplashScreen />} />
     <Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/forgot-password/:token" element={<ForgotPassword />} />
          <Route path="/location-permission" element={<LocationPermissionPage />} />
          {/* Phlebotomist App */}
          <Route element={<PhlebotomistLayout />}>
            <Route path="/phlebotomist" element={<PhlebotomistDashboardPage />} />
          </Route>
          {/* Admin Dashboard */}
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/corporates" element={<AdminCorporatePage />} />
            <Route path="/admin/hps-engine" element={<AdminHPSMonitorPage />} />
            <Route path="/admin/financial" element={<AdminFinancialPage />} />
            <Route path="/admin/support" element={<AdminSupportPage />} />
            <Route path="/admin/support/analytics" element={<AdminSupportAnalyticsPage />} />
            <Route path="/admin/audit-logs" element={<AdminAuditLogPage />} />
            <Route path="/admin/announcements" element={<AdminAnnouncementsPage />} />
            <Route path="/admin/content" element={<AdminContentPage />} />
            <Route path="/admin/system-health" element={<AdminSystemHealthPage />} />
            <Route path="/admin/hrms/employees" element={<AdminHRMSEmployeesPage />} />
            <Route path="/admin/hrms/payroll" element={<AdminHRMSPayrollPage />} />
            <Route path="/admin/hrms/performance" element={<AdminHRMSPerformancePage />} />
            <Route path="/admin/hrms/leaves" element={<AdminHRMSLeavesPage />} />
            <Route path="/admin/hrms/assets" element={<AdminHRMSAssetsPage />} />
            <Route path="/admin/hrms/helpdesk" element={<AdminHRMSHelpdeskPage />} />
            <Route path="/admin/executive-brief" element={<AdminExecutiveBriefPage />} />
            <Route path="/admin/protocol-effectiveness" element={<AdminProtocolEffectivenessPage />} />
          </Route>
          {/* CXO Executive Command Centre */}
          <Route element={<CXOLayout />}>
            <Route path="/cxo" element={<CXODashboardPage />} />
            <Route path="/cxo/mission-control" element={<CXOMissionControlPage />} />
            <Route path="/cxo/workforce-vitality" element={<CXOWviPage />} />
            <Route path="/cxo/financial" element={<CXOFinancialPage />} />
            <Route path="/cxo/operations" element={<CXOOperationsPage />} />
            <Route path="/cxo/esg" element={<CXOEsgPage />} />
            <Route path="/cxo/competitive" element={<CXOCompetitivePage />} />
            <Route path="/cxo/profit-share" element={<CXOProfitSharePage />} />
            <Route path="/cxo/simulator" element={<CXOSimulatorPage />} />
            <Route path="/cxo/interventions" element={<CXOInterventionsPage />} />
            <Route path="/cxo/board-reports" element={<CXOBoardReportsPage />} />
            <Route path="/cxo/investor" element={<CXOInvestorPage />} />
          </Route>
          <Route element={<CorporateDemoLayout />}>
            <Route path="/corp-demo" element={<CorporateDemoHome />} />
            <Route path="/corp-demo/dashboard" element={<CorpDemoDashboardPage />} />
            <Route path="/corp-demo/employees" element={<CorpDemoEmployeesPage />} />
            <Route path="/corp-demo/licenses" element={<CorpDemoLicensesPage />} />
            <Route path="/corp-demo/engagement" element={<CorpDemoEngagementPage />} />
            <Route path="/corp-demo/executive" element={<CorpDemoExecutiveDashboardPage />} />
            <Route path="/corp-demo/risk" element={<CorpDemoRiskPage />} />
            <Route path="/corp-demo/participation" element={<CorpDemoParticipationPage />} />
            <Route path="/corp-demo/roi" element={<CorpDemoROIPage />} />
          </Route>
          <Route element={<HCPLayout />}>
            {/* Role-specific dashboard */}
            <Route path="/hcp" element={<RoleDashboard />} />
            {/* Shared HCP routes */}
            <Route path="/hcp/members" element={<HCPMembersPage />} />
            <Route path="/hcp/members/:memberId" element={<PatientProfilePage />} />
            <Route path="/hcp/alerts" element={<HCPAlertQueuePage />} />
            <Route path="/hcp/protocols" element={<HCPProtocolsPage />} />
            <Route path="/hcp/sessions" element={<HCPSessionsPage />} />
            <Route path="/hcp/override" element={<HCPOverridePage />} />
            <Route path="/hcp/population" element={<HCPPopulationPage />} />
            <Route path="/hcp/lab-orders" element={<HCPLabOrdersPage />} />
            <Route path="/hcp/emr" element={<HCPEMRPage />} />
            <Route path="/hcp/prescriptions" element={<HCPPrescriptionsPage />} />
            <Route path="/hcp/telehealth" element={<HCPTelehealthPage />} />
            <Route path="/hcp/telehealth/:sessionId" element={<HCPTelehealthRoom />} />
            <Route path="/hcp/nfle" element={<HCPNFLEPage />} />
            <Route path="/hcp/pharmacy" element={<HCPPharmacyPage />} />
            <Route path="/hcp/fhir" element={<HCPFhirPage />} />
            <Route path="/hcp/appointments" element={<HCPAppointmentsPage />} />
            <Route path="/hcp/review" element={<HCPReviewPage />} />
            <Route path="/hcp/smart-emr/:memberId" element={<SmartEMRPage />} />
            <Route path="/hcp/secure-messaging" element={<SecureMessagingPage />} />
            <Route path="/hcp/wearable-dashboard" element={<WearableDashboardPage />} />
            <Route path="/hcp/escalations" element={<EscalationsPage />} />
            {/* PFC routes */}
            <Route path="/hcp/programmes" element={<PFCProgrammesPage />} />
            <Route path="/hcp/wearable-feed" element={<PFCWearableFeedPage />} />
            <Route path="/hcp/session-log" element={<CoachSessionLogPage />} />
            <Route path="/hcp/habits" element={<PFCHabitsPage />} />
            <Route path="/hcp/challenges" element={<PFCChallengesPage />} />
            {/* PSY routes */}
            <Route path="/hcp/assessments" element={<PSYAssessmentsPage />} />
            <Route path="/hcp/cbt-modules" element={<PSYCBTModulesPage />} />
            <Route path="/hcp/crisis" element={<PSYCrisisAlertsPage />} />
            <Route path="/hcp/session-notes" element={<PSYSessionNotesPage />} />
            <Route path="/hcp/therapy-programs" element={<PSYTherapyProgramsPage />} />
            <Route path="/hcp/mental-outcomes" element={<PSYMentalOutcomesPage />} />
            {/* NUT routes */}
            <Route path="/hcp/meal-plans" element={<NUTMealPlansPage />} />
            <Route path="/hcp/supplements" element={<NUTSupplementsPage />} />
            <Route path="/hcp/food-diary" element={<NUTFoodDiaryPage />} />
            <Route path="/hcp/consult-notes" element={<NUTConsultNotesPage />} />
            <Route path="/hcp/body-comp" element={<NUTBodyCompPage />} />
            <Route path="/hcp/nutrition-analytics" element={<NUTNutritionAnalyticsPage />} />
            {/* Shared coach */}
            <Route path="/hcp/messaging" element={<CoachMessagingPage />} />
            <Route path="/hcp/check-ins" element={<CheckInsPage />} />
            <Route path="/hcp/goals" element={<GoalsPage />} />
            <Route path="/hcp/coach-insights" element={<CoachInsightsPage />} />
            <Route path="/hcp/corporate" element={<CorporateWellnessPage />} />
            <Route path="/hcp/resources" element={<ResourcesPage />} />
            <Route path="/hcp/coach-profile" element={<CoachProfilePage />} />
            {/* CORP routes */}
            <Route path="/hcp/corp-employees" element={<CorpEmployeesPage />} />
            <Route path="/hcp/corp-engagement" element={<CorpEngagementPage />} />
            <Route path="/hcp/corp-burnout" element={<CorpBurnoutPage />} />
            <Route path="/hcp/corp-departments" element={<CorpDepartmentsPage />} />
            <Route path="/hcp/corp-outliers" element={<CorpOutliersPage />} />
            <Route path="/hcp/corp-programmes" element={<CorpProgrammesPage />} />
            <Route path="/hcp/corp-franchise" element={<CorpFranchisePage />} />
            <Route path="/hcp/corp-profitshare" element={<CorpProfitSharePage />} />
            <Route path="/hcp/corp-analytics" element={<CorpAnalyticsPage />} />
            <Route path="/hcp/corp-nudge" element={<CorpNudgePage />} />
            <Route path="/hcp/corp-seasons" element={<CorpSeasonPage />} />
            <Route path="/hcp/corp-organogram" element={<CorpOrganogramPage />} />
            <Route path="/hcp/corp-hr-escalations" element={<CorpHREscalationsPage />} />
            <Route path="/hcp/corp-manager" element={<CorpManagerDashPage />} />
            <Route path="/hcp/corp-subscriptions" element={<CorpSubscriptionPage />} />
            <Route path="/hcp/corp-ai-hub" element={<CorpAIHubPage />} />
            <Route path="/hcp/corp-data-quality" element={<CorpDataQualityPage />} />
            <Route path="/hcp/corp-care-escalation" element={<CorpCareEscalationPage />} />
            <Route path="/hcp/roadmap-review" element={<RoadmapReviewPage />} />
          </Route>
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/health-overview" element={<HealthOverviewPage />} />
            <Route path="/biomarkers" element={<BiomarkersPage />} />
            <Route path="/mind" element={<MindCognitionPage />} />
            <Route path="/wearables" element={<WearablesPage />} />
            <Route path="/nutrition" element={<NutritionPage />} />
            <Route path="/roadmap" element={<RoadmapPage />} />
            <Route path="/challenges" element={<ChallengesPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/feed" element={<SocialFeedPage />} />
            <Route path="/rewards" element={<RewardsPage />} />
            <Route path="/care-team" element={<CareTeamPage />} />
            <Route path="/franchise" element={<FranchiseAdminPage />} />
            <Route path="/seasons" element={<SeasonsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/snapshots" element={<HealthSnapshotsPage />} />
            {/* New patient flow pages */}
            <Route path="/location-setup" element={<LocationSetupPage />} />
            <Route path="/chat" element={<PatientChatPage />} />
            <Route path="/book-lab-test" element={<BookLabTestPage />} />
            <Route path="/lab-reports" element={<LabReportViewPage />} />
            <Route path="/video-consultation" element={<VideoConsultationPage />} />
            <Route path="/longevity-protocol" element={<LongevityProtocolPage />} />
            <Route path="/post-call-actions/:consultationId" element={<PostCallActionsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
