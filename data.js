// ============================================================
// DATA.JS — Dynamic Persistent State Management (No Hardcoded Lockdown)
// Allows creating Teams, Members, Major Works, and Tasks dynamically from the UI
// ============================================================

const STORAGE_KEYS = {
  USERS: 'erp_dynamic_users',
  TEAMS: 'erp_dynamic_teams',
  MAJOR_WORKS: 'erp_dynamic_major_works',
  TASKS: 'erp_dynamic_tasks',
  CHAT: 'erp_dynamic_chat'
};

// Initial minimal seed if completely fresh, but fully editable/deletable/expandable from the UI
const DEFAULT_BOOTSTRAP_USERS = [
  { id: 'usr_guide', name: 'Dr. Arjun Mehta (Guide)', role: 'Technical Head', email: 'guide@erp.io', avatar: 'TH', teamId: null },
  { id: 'usr_tl1', name: 'Priya Sharma (TL)', role: 'Team Leader', email: 'priya@erp.io', avatar: 'TL', teamId: 'team_core' },
  { id: 'usr_mem1', name: 'Keerthana', role: 'Team Member', email: 'keerthana@erp.io', avatar: 'KD', teamId: 'team_core', skill: 'Frontend & UI Developer' },
  { id: 'usr_mem2', name: 'Manasi', role: 'Team Member', email: 'manasi@erp.io', avatar: 'MN', teamId: 'team_core', skill: 'Backend & Database Engineer' },
  { id: 'usr_mem3', name: 'Rahul', role: 'Team Member', email: 'rahul@erp.io', avatar: 'RH', teamId: 'team_core', skill: 'QA & Testing Specialist' }
];

const DEFAULT_BOOTSTRAP_TEAMS = [
  { id: 'team_core', name: 'Core Innovation Team', leaderId: 'usr_tl1', leaderName: 'Priya Sharma (TL)', description: 'Full-stack development and security team' }
];

// Initialize State from localStorage or minimal bootstrap
let users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
if (!users || users.length === 0) {
  users = DEFAULT_BOOTSTRAP_USERS;
}

let teams = JSON.parse(localStorage.getItem(STORAGE_KEYS.TEAMS));
if (!teams || teams.length === 0) {
  teams = DEFAULT_BOOTSTRAP_TEAMS;
}

let majorWorks = JSON.parse(localStorage.getItem(STORAGE_KEYS.MAJOR_WORKS)) || [];
let tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS)) || [];
let projectChat = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHAT)) || [];

function saveAllData() {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
  localStorage.setItem(STORAGE_KEYS.MAJOR_WORKS, JSON.stringify(majorWorks));
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(projectChat));
}

function clearAllData() {
  localStorage.removeItem(STORAGE_KEYS.USERS);
  localStorage.removeItem(STORAGE_KEYS.TEAMS);
  localStorage.removeItem(STORAGE_KEYS.MAJOR_WORKS);
  localStorage.removeItem(STORAGE_KEYS.TASKS);
  localStorage.removeItem(STORAGE_KEYS.CHAT);
  users = JSON.parse(JSON.stringify(DEFAULT_BOOTSTRAP_USERS));
  teams = JSON.parse(JSON.stringify(DEFAULT_BOOTSTRAP_TEAMS));
  majorWorks = [];
  tasks = [];
  projectChat = [];
  saveAllData();
}