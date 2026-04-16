export const DEMO_USERS = [
  {
    email: "hr.admin.demo@agereboot.ai",
    password: "HRAdmin@123",
    home: "/corp-demo/dashboard",
    user: {
      id: "demo-hr-admin",
      name: "Aparna Menon",
      email: "hr.admin.demo@agereboot.ai",
      role: "hr_admin_demo",
      organisation: "AgeReboot Corporate",
      department: "People Operations",
    },
  },
  {
    email: "hr.executive.demo@agereboot.ai",
    password: "HRExec@123",
    home: "/corp-demo/executive",
    user: {
      id: "demo-hr-executive",
      name: "Rohan Iyer",
      email: "hr.executive.demo@agereboot.ai",
      role: "hr_executive_demo",
      organisation: "AgeReboot Corporate",
      department: "Executive Wellness Office",
    },
  },
];

export const DEMO_USER_MAP = Object.fromEntries(
  DEMO_USERS.map((account) => [account.email.toLowerCase(), account])
);

export function findDemoAccount(email, password) {
  if (!email || !password) return null;
  const account = DEMO_USER_MAP[String(email).trim().toLowerCase()];
  if (!account || account.password !== password) return null;
  return account;
}

export function isDemoToken(token) {
  return typeof token === "string" && token.startsWith("demo:");
}
