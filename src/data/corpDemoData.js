export const FILTER_OPTIONS = {
  locations: ["All Locations", "TN - Coimbatore", "TN - Chennai", "KA - Bengaluru", "MH - Mumbai"],
  departments: ["All Departments", "Engineering", "Design", "HR", "Sales", "Leadership"],
  ranges: ["Monthly", "Weekly", "Quarterly"],
};

export const adminStats = [
  { title: "Active Users", value: "456", sub: "/ 500 total", tag: "44 inactive", tone: "violet" },
  { title: "Corporate Health Score", value: "56", sub: "vs last month", tag: "+2%", tone: "emerald" },
  { title: "At-Risk %", value: "55.6%", sub: "multi-factor risk view", tag: "Stress 42%", tone: "rose" },
  { title: "Programme Adoption", value: "78%", sub: "ATP programme activation", tag: "+6 pts", tone: "amber" },
];

export const engagementTrend = [
  { label: "8 AM", interaction: 40, impression: 15 },
  { label: "9 AM", interaction: 60, impression: 25 },
  { label: "10 AM", interaction: 50, impression: 20 },
  { label: "11 AM", interaction: 42, impression: 18 },
  { label: "12 PM", interaction: 100, impression: 45 },
  { label: "1 PM", interaction: 102, impression: 40 },
  { label: "2 PM", interaction: 80, impression: 55 },
  { label: "3 PM", interaction: 70, impression: 35 },
  { label: "4 PM", interaction: 60, impression: 30 },
  { label: "5 PM", interaction: 40, impression: 25 },
];

export const healthGoalData = [
  { name: "Longevity", value: 45, color: "#7B35D8" },
  { name: "Weight Loss", value: 30, color: "#4F46E5" },
  { name: "Stress Relief", value: 15, color: "#EAB308" },
  { name: "Other", value: 10, color: "#A78BFA" },
];

export const licenseUtilizationData = [
  { month: "Jan", invite: 180, active: 120, available: 60 },
  { month: "Feb", invite: 140, active: 90, available: 50 },
  { month: "Mar", invite: 210, active: 130, available: 70 },
  { month: "Apr", invite: 230, active: 166, available: 64 },
];

export const coachingUtilization = [
  { title: "Coaching usage", percent: 65, valueLeft: 65, valueRight: 200, color: "#7B35D8" },
  { title: "Clinical usage", percent: 52, valueLeft: 104, valueRight: 200, color: "#0F9F8F" },
];

export const actionItems = [
  { title: "5 employees pending registration", time: "2 hours ago", tone: "rose" },
  { title: "10 licenses expiring soon", time: "4 hours ago", tone: "amber" },
  { title: "3 pending KYC approvals", time: "Today", tone: "violet" },
  { title: "Leadership cohort flagged for high cortisol", time: "Today", tone: "rose" },
];

export const employeeCards = [
  { title: "Total Employees", value: "500", change: "+18 this month", tone: "violet" },
  { title: "Fully Onboarded", value: "456", change: "91% coverage", tone: "emerald" },
  { title: "Pending Invites", value: "22", change: "Needs follow-up", tone: "amber" },
  { title: "High-Risk Employees", value: "37", change: "Escalate to coaches", tone: "rose" },
];

export const employeeRows = [
  { name: "Ananya Rao", department: "Engineering", location: "Bengaluru", status: "Active", risk: "Low", license: "Executive", lastActivity: "Today" },
  { name: "Vikram Shah", department: "Sales", location: "Mumbai", status: "Inactive", risk: "High", license: "Core", lastActivity: "6 days ago" },
  { name: "Meera Joseph", department: "HR", location: "Chennai", status: "Pending", risk: "Moderate", license: "Plus", lastActivity: "Invited" },
  { name: "Karthik Iyer", department: "Design", location: "Coimbatore", status: "Active", risk: "Low", license: "Plus", lastActivity: "Yesterday" },
  { name: "Ritu Menon", department: "Leadership", location: "Bengaluru", status: "Active", risk: "High", license: "Executive", lastActivity: "Today" },
  { name: "Harish Kumar", department: "Engineering", location: "Chennai", status: "Active", risk: "Moderate", license: "Core", lastActivity: "3 days ago" },
];

export const departmentMix = [
  { name: "Engineering", employees: 180, onboarding: 165 },
  { name: "Sales", employees: 95, onboarding: 84 },
  { name: "HR", employees: 60, onboarding: 54 },
  { name: "Design", employees: 72, onboarding: 68 },
  { name: "Leadership", employees: 28, onboarding: 22 },
];

export const licenseCards = [
  { title: "Allocated Licenses", value: "500", sub: "Enterprise annual contract", tone: "violet" },
  { title: "Utilized Licenses", value: "412", sub: "82.4% current utilization", tone: "emerald" },
  { title: "Expiring in 30 Days", value: "28", sub: "Needs renewal planning", tone: "amber" },
  { title: "Unused Capacity", value: "88", sub: "Opportunity for expansion", tone: "slate" },
];

export const planMix = [
  { name: "Core", seats: 180, fill: "#7B35D8" },
  { name: "Plus", seats: 152, fill: "#4F46E5" },
  { name: "Executive", seats: 80, fill: "#0F9F8F" },
];

export const renewalQueue = [
  { client: "North Star Retail", plan: "Executive", seats: 80, renewal: "Apr 12, 2026", health: "High value" },
  { client: "Aster Labs", plan: "Plus", seats: 120, renewal: "Apr 18, 2026", health: "Needs usage push" },
  { client: "Verve Systems", plan: "Core", seats: 60, renewal: "Apr 25, 2026", health: "Stable" },
];

export const engagementCards = [
  { title: "Broadcast Reach", value: "82%", change: "+5 pts", tone: "violet" },
  { title: "Challenge Join Rate", value: "64%", change: "+8 pts", tone: "emerald" },
  { title: "Coaching Attendance", value: "71%", change: "3 missed cohorts", tone: "amber" },
  { title: "Campaign CTR", value: "18.4%", change: "Above benchmark", tone: "rose" },
];

export const campaignTimeline = [
  { week: "W1", broadcasts: 42, challenges: 20, coaching: 18 },
  { week: "W2", broadcasts: 52, challenges: 28, coaching: 21 },
  { week: "W3", broadcasts: 48, challenges: 31, coaching: 27 },
  { week: "W4", broadcasts: 64, challenges: 39, coaching: 30 },
  { week: "W5", broadcasts: 58, challenges: 41, coaching: 29 },
  { week: "W6", broadcasts: 70, challenges: 46, coaching: 35 },
];

export const broadcastItems = [
  { title: "Burnout risk awareness campaign", status: "Live", audience: "Leadership + HR", ctr: "22.4%" },
  { title: "Sleep efficiency nudge", status: "Scheduled", audience: "Sales teams", ctr: "17.1%" },
  { title: "Metabolic health reminder", status: "Completed", audience: "Pan-company", ctr: "19.8%" },
];

export const challengeItems = [
  { title: "14-Day Movement Sprint", participants: 168, completion: 74 },
  { title: "Stress Reset Challenge", participants: 122, completion: 68 },
  { title: "Sleep Consistency Ladder", participants: 97, completion: 61 },
];

export const executiveStats = [
  { title: "Longevity Index", value: "74", sub: "Corporate composite score", tone: "violet" },
  { title: "High Risk Employees", value: "41", sub: "Immediate attention", tone: "rose" },
  { title: "Leader Cortisol Alerts", value: "12", sub: "Leadership cohort", tone: "amber" },
  { title: "Programme Coverage", value: "86%", sub: "Eligible population", tone: "emerald" },
];

export const threatItems = [
  "High cortisol in leadership cohort, 22% above baseline",
  "Spike in metabolic risk for night shift employees",
  "Low sleep efficiency in sales department",
  "Reduced coaching adherence in new joiner cohort",
];

export const riskDistribution = [
  { name: "Low", value: 45, color: "#10B981" },
  { name: "Medium", value: 32, color: "#EAB308" },
  { name: "High", value: 23, color: "#EF4444" },
];

export const riskDrivers = [
  { name: "Stress Biomarkers", delta: "-23%", coverage: 82 },
  { name: "Sleep Efficiency", delta: "-18%", coverage: 70 },
  { name: "Metabolic Flexibility", delta: "-12%", coverage: 63 },
  { name: "Recovery Load", delta: "-9%", coverage: 58 },
];

export const deptRiskData = [
  { dept: "Leadership", score: 71 },
  { dept: "Sales", score: 63 },
  { dept: "Engineering", score: 48 },
  { dept: "HR", score: 41 },
  { dept: "Design", score: 36 },
];

export const participationFunnel = [
  { title: "Biomarker test completion rate", stats: "120 / 200", percent: 60 },
  { title: "Clinical consultation rate", stats: "45 / 100", percent: 45 },
  { title: "Coaching usage rate", stats: "120 / 200", percent: 60 },
  { title: "ATP programme adoption", stats: "35 / 40", percent: 88 },
];

export const participationTrend = [
  { day: "7d", dau: 40, wau: 24, challengeRate: 18 },
  { day: "14d", dau: 60, wau: 35, challengeRate: 24 },
  { day: "21d", dau: 60, wau: 38, challengeRate: 20 },
  { day: "28d", dau: 100, wau: 44, challengeRate: 22 },
  { day: "35d", dau: 60, wau: 40, challengeRate: 19 },
  { day: "42d", dau: 60, wau: 45, challengeRate: 17 },
  { day: "49d", dau: 35, wau: 18, challengeRate: 12 },
  { day: "56d", dau: 20, wau: 12, challengeRate: 8 },
];

export const cohortTable = [
  { cohort: "Leadership", participation: "82%", challenge: "61%", coaching: "74%" },
  { cohort: "Engineering", participation: "71%", challenge: "54%", coaching: "48%" },
  { cohort: "Sales", participation: "66%", challenge: "52%", coaching: "41%" },
  { cohort: "HR", participation: "76%", challenge: "59%", coaching: "57%" },
];

export const roiStats = [
  { title: "Estimated Cost Savings", value: "₹46 L", sub: "Insurance + absenteeism", tone: "emerald" },
  { title: "Productivity Score", value: "56", sub: "Past month composite", tone: "violet" },
  { title: "Engagement ROI", value: "2.4x", sub: "Vs programme spend", tone: "amber" },
];

export const comparativePerformance = [
  { rank: "01", company: 24, others: 78, hps: 89 },
  { rank: "02", company: 30, others: 74, hps: 89 },
  { rank: "03", company: 36, others: 69, hps: 89 },
  { rank: "04", company: 46, others: 64, hps: 89 },
  { rank: "05", company: 54, others: 58, hps: 89 },
  { rank: "06", company: 62, others: 52, hps: 89 },
  { rank: "07", company: 68, others: 45, hps: 89 },
];

export const roiStreams = [
  { label: "Reduced absenteeism", value: 12.4, color: "#10B981" },
  { label: "Clinical risk prevention", value: 15.6, color: "#7B35D8" },
  { label: "Productivity uplift", value: 18.0, color: "#4F46E5" },
  { label: "Net benefit", value: 9.2, color: "#EAB308" },
];
