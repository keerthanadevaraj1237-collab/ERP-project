// ============================================================
// APP.JS — Evidence-Driven ERP Core Dynamic Application Controller
// AI Task Decomposition Agent, AI Proof Verification, Team Management & Role Isolation
// ============================================================

let currentUserId = 'usr_guide';
let selectedTaskId = null;
let selectedMajorWorkId = null;
let proofImageBase64 = '';
let stagedAiTasks = [];

document.addEventListener('DOMContentLoaded', () => {
  if (users.length > 0) {
    currentUserId = users[0].id;
  }
  populateUserDropdown();
  updateActiveUser();
  renderApp();
  renderChat();
});

// ============================================================
// 1. PROFILE & USER MANAGEMENT
// ============================================================

function populateUserDropdown() {
  const select = document.getElementById('userSelect');
  if (!select) return;

  select.innerHTML = users.map(u => `
    <option value="${u.id}">
      ${u.name} (${u.role}${u.skill ? ' - ' + u.skill : ''})
    </option>
  `).join('');

  select.value = currentUserId;
}

function handleUserChange() {
  const select = document.getElementById('userSelect');
  currentUserId = select.value;
  updateActiveUser();
  renderApp();
  showToast(`Active profile switched to ${getCurrentUser().name} (${getCurrentUser().role})`, 'success');
}

function getCurrentUser() {
  return users.find(u => u.id === currentUserId) || users[0] || { id: 'usr_default', name: 'User', role: 'Team Member' };
}

function updateActiveUser() {
  const user = getCurrentUser();
  document.getElementById('userAvatar').textContent = user.avatar || user.name.slice(0, 2).toUpperCase();
  document.getElementById('userName').textContent = user.name;
  document.getElementById('userRole').textContent = user.role;

  // Highlight active step in workflow roadmap
  document.querySelectorAll('.workflow-step').forEach(el => el.classList.remove('active'));
  if (user.role === 'Technical Head') {
    document.getElementById('wfStep1').classList.add('active');
    document.getElementById('wfStep5').classList.add('active');
  } else if (user.role === 'Team Leader') {
    document.getElementById('wfStep2').classList.add('active');
    document.getElementById('wfStep4').classList.add('active');
  } else {
    document.getElementById('wfStep3').classList.add('active');
  }
}

// Open / Close Create User Modal
function openCreateUserModal() {
  document.getElementById('newUserName').value = '';
  document.getElementById('newUserSkill').value = '';
  
  // Populate team options
  const teamSelect = document.getElementById('newUserTeamSelect');
  teamSelect.innerHTML = teams.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
  if (teams.length === 0) {
    teamSelect.innerHTML = `<option value="">No teams created yet</option>`;
  }

  handleNewUserRoleChange();
  document.getElementById('createUserModal').classList.remove('hidden');
}

function closeCreateUserModal() {
  document.getElementById('createUserModal').classList.add('hidden');
}

function handleNewUserRoleChange() {
  const role = document.getElementById('newUserRole').value;
  const skillGroup = document.getElementById('newUserSkillGroup');
  const teamGroup = document.getElementById('newUserTeamGroup');

  if (role === 'Technical Head') {
    skillGroup.style.display = 'none';
    teamGroup.style.display = 'none';
  } else if (role === 'Team Leader') {
    skillGroup.style.display = 'none';
    teamGroup.style.display = 'block';
  } else {
    skillGroup.style.display = 'block';
    teamGroup.style.display = 'block';
  }
}

function saveNewUser() {
  const name = document.getElementById('newUserName').value.trim();
  const role = document.getElementById('newUserRole').value;
  const skill = document.getElementById('newUserSkill').value.trim();
  const teamId = document.getElementById('newUserTeamSelect').value;

  if (!name) {
    showToast('Please enter a user name.', 'danger');
    return;
  }

  const team = teams.find(t => t.id === teamId);
  const newUser = {
    id: 'usr_' + Date.now(),
    name,
    role,
    email: name.toLowerCase().replace(/\s+/g, '') + '@erp.io',
    avatar: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
    teamId: teamId || null,
    team: team ? team.name : '',
    skill: role === 'Team Member' ? (skill || 'Full Stack Developer') : ''
  };

  users.push(newUser);
  saveAllData();
  closeCreateUserModal();
  populateUserDropdown();
  currentUserId = newUser.id;
  updateActiveUser();
  renderApp();
  showToast(`Created and logged in as ${name} (${role})!`, 'success');
}

// Open / Close Create Team Modal
function openCreateTeamModal() {
  document.getElementById('newTeamName').value = '';
  document.getElementById('newTeamDescription').value = '';

  const leaderSelect = document.getElementById('newTeamLeaderSelect');
  const teamLeads = users.filter(u => u.role === 'Team Leader' || u.role === 'Technical Head');
  leaderSelect.innerHTML = teamLeads.map(l => `<option value="${l.id}">${l.name} (${l.role})</option>`).join('');

  document.getElementById('createTeamModal').classList.remove('hidden');
}

function closeCreateTeamModal() {
  document.getElementById('createTeamModal').classList.add('hidden');
}

function saveNewTeam() {
  const name = document.getElementById('newTeamName').value.trim();
  const desc = document.getElementById('newTeamDescription').value.trim();
  const leaderId = document.getElementById('newTeamLeaderSelect').value;

  if (!name) {
    showToast('Please enter a team name.', 'danger');
    return;
  }

  const leader = users.find(u => u.id === leaderId);
  const newTeam = {
    id: 'team_' + Date.now(),
    name,
    leaderId: leader ? leader.id : '',
    leaderName: leader ? leader.name : 'Unassigned',
    description: desc
  };

  teams.push(newTeam);
  if (leader) leader.teamId = newTeam.id;

  saveAllData();
  closeCreateTeamModal();
  renderApp();
  showToast(`Team "${name}" created successfully!`, 'success');
}

// Add Member to active team
function openAddMemberModal() {
  openCreateUserModal();
  document.getElementById('newUserRole').value = 'Team Member';
  handleNewUserRoleChange();
}

// ============================================================
// 2. MAIN VIEW CONTROLLER & ROLE ISOLATION
// ============================================================

function renderApp() {
  const user = getCurrentUser();

  // 1. Calculate & Render Statistics
  updateDashboardStats();

  // 2. Render Real-time Accountability Alerts
  renderAlerts();

  // 3. Render Major Works
  renderMajorWorks();

  // 4. Role-specific view configurations
  const teamRosterSec = document.getElementById('teamLeaderRosterSection');
  const btnAssignMajorWork = document.getElementById('btnAssignMajorWork');
  const btnCreateTaskManual = document.getElementById('btnCreateTaskManual');
  const otherMembersSec = document.getElementById('otherMembersProgressSection');
  const taskSectionTitle = document.getElementById('taskSectionTitle');

  if (user.role === 'Technical Head') {
    // Technical Head (Guide) sees everything, assigns major work
    teamRosterSec.style.display = 'none';
    btnAssignMajorWork.style.display = 'inline-flex';
    btnCreateTaskManual.style.display = 'none';
    otherMembersSec.style.display = 'none';
    taskSectionTitle.textContent = '📋 Organization-Wide Divided Tasks (Guide Truth Overview)';
    document.getElementById('scopeBadge').textContent = 'Scope: Organization Wide';
    renderTasks();
  } else if (user.role === 'Team Leader') {
    // Team Leader manages their team, AI decomposes work, reviews proofs
    teamRosterSec.style.display = 'block';
    btnAssignMajorWork.style.display = 'none';
    btnCreateTaskManual.style.display = 'inline-flex';
    otherMembersSec.style.display = 'none';
    taskSectionTitle.textContent = '📋 Team Tasks & Evidence Verification Queue';
    document.getElementById('scopeBadge').textContent = `Scope: ${user.team || 'My Team'}`;
    renderTeamRoster();
    renderTasks();
  } else {
    // Team Member: Edits own tasks, views other members' tasks as read-only
    teamRosterSec.style.display = 'none';
    btnAssignMajorWork.style.display = 'none';
    btnCreateTaskManual.style.display = 'none';
    otherMembersSec.style.display = 'block';
    taskSectionTitle.textContent = `📋 My Assigned Tasks (${user.name}) — Editable`;
    document.getElementById('scopeBadge').textContent = `Scope: ${user.name}`;
    renderTasks();
    renderOtherMembersTasks();
  }
}

// ============================================================
// 3. STATISTICS & TRUTH ENGINE
// ============================================================

function updateDashboardStats() {
  const user = getCurrentUser();
  let relevantTasks = tasks;

  if (user.role === 'Team Leader') {
    relevantTasks = tasks.filter(t => t.teamId === user.teamId || t.team === user.team);
  } else if (user.role === 'Team Member') {
    relevantTasks = tasks.filter(t => t.memberId === user.id || t.member === user.name);
  }

  const stats = WorkRealityEngine.computeSystemStats(relevantTasks);

  document.getElementById('statOverallProgress').textContent = `${stats.overallProgress}%`;
  document.getElementById('statOverallBar').style.width = `${stats.overallProgress}%`;
  document.getElementById('statCompleted').textContent = stats.completed;
  document.getElementById('statPending').textContent = stats.pending;
  document.getElementById('statRejected').textContent = stats.rejected;
  document.getElementById('statMismatches').textContent = stats.mismatches;

  document.getElementById('compareClaimed').textContent = `${stats.avgClaimed}%`;
  document.getElementById('compareVerified').textContent = `${stats.avgVerified}%`;
  const mismatchGap = Math.max(0, stats.avgClaimed - stats.avgVerified);
  document.getElementById('compareMismatch').textContent = `${mismatchGap}%`;
}

// ============================================================
// 4. REAL-TIME ACCOUNTABILITY ALERTS
// ============================================================

function renderAlerts() {
  const alertsContainer = document.getElementById('alertsList');
  alertsContainer.innerHTML = '';
  const user = getCurrentUser();

  let relevantTasks = tasks;
  if (user.role === 'Team Leader') {
    relevantTasks = tasks.filter(t => t.teamId === user.teamId || t.team === user.team);
  } else if (user.role === 'Team Member') {
    relevantTasks = tasks.filter(t => t.memberId === user.id || t.member === user.name);
  }

  const alertItems = [];

  relevantTasks.forEach(task => {
    const mismatch = WorkRealityEngine.getMismatch(task);
    if (mismatch.hasMismatch && task.status !== 'completed') {
      alertItems.push(`
        <div class="alert-item alert-warning">
          <span>⚠️</span>
          <div>
            <strong>Progress Mismatch Detected on "${task.name}" (${task.member})</strong><br>
            Claimed ${mismatch.claimed}% completion, but verified subtasks account for only ${mismatch.verified}%. (Gap: +${mismatch.gap}%)
          </div>
        </div>
      `);
    }

    const risk = WorkRealityEngine.getRiskAssessment(task);
    if (risk.level === 'critical' && task.status !== 'completed') {
      alertItems.push(`
        <div class="alert-item alert-danger">
          <span>🚨</span>
          <div>
            <strong>Critical Deadline Alert: "${task.name}" (${task.member})</strong><br>
            Deadline: ${task.deadline}. Current verified progress is only ${task.verifiedProgress}%.
          </div>
        </div>
      `);
    }

    if (task.status === 'pending_verification' && user.role !== 'Team Member') {
      alertItems.push(`
        <div class="alert-item alert-info">
          <span>🔍</span>
          <div>
            <strong>Proof Awaiting Team Leader Verification: "${task.name}"</strong><br>
            Submitted by ${task.member} (AI Confidence Score: ${task.aiScore}%). Review output proof and approve/reject.
          </div>
        </div>
      `);
    }

    if (task.status === 'rejected' && (user.id === task.memberId || user.name === task.member)) {
      alertItems.push(`
        <div class="alert-item alert-danger">
          <span>❌</span>
          <div>
            <strong>Submission Rejected on "${task.name}" &mdash; Rework Required</strong><br>
            Feedback: "${task.rejectionReason}". Please fix missing items and upload new output proof.
          </div>
        </div>
      `);
    }
  });

  if (alertItems.length === 0) {
    alertsContainer.innerHTML = `
      <div class="alert-item alert-success">
        <span>✅</span>
        <div><strong>All Systems Verified:</strong> All reported work matches submitted proof and tasks are on schedule.</div>
      </div>
    `;
  } else {
    alertsContainer.innerHTML = alertItems.join('');
  }
}

// ============================================================
// 5. TEAM ROSTER (Team Leader View)
// ============================================================

function renderTeamRoster() {
  const user = getCurrentUser();
  const container = document.getElementById('teamMembersContainer');
  const rosterTitle = document.getElementById('teamRosterName');

  const team = teams.find(t => t.id === user.teamId || t.leaderId === user.id) || teams[0];
  if (rosterTitle) rosterTitle.textContent = team ? team.name : 'My Team';

  if (!container) return;

  const teamMembers = users.filter(u => u.role === 'Team Member' && (u.teamId === (team ? team.id : '') || !u.teamId));

  if (teamMembers.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; padding: 20px; text-align: center; color: var(--text-muted); background: var(--bg-surface); border-radius: var(--radius-md);">
        No team members added yet. Click "+ Add Member to My Team" to recruit members and set their technical roles.
      </div>
    `;
    return;
  }

  container.innerHTML = teamMembers.map(m => `
    <div class="member-roster-card">
      <div class="member-avatar-lg">${m.avatar || m.name.slice(0, 2).toUpperCase()}</div>
      <div class="member-info">
        <h4>${m.name}</h4>
        <span class="member-skill-badge">🎯 ${m.skill || 'Full Stack Developer'}</span>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">
          Active Tasks: ${tasks.filter(t => t.member === m.name && t.status !== 'completed').length}
        </div>
      </div>
    </div>
  `).join('');
}

// ============================================================
// 6. MAJOR WORKS SECTION (Technical Head &rarr; Team Leaders)
// ============================================================

function renderMajorWorks() {
  const container = document.getElementById('majorWorkContainer');
  if (!container) return;

  const user = getCurrentUser();

  if (majorWorks.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; padding: 36px; text-align: center; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--border);">
        <p style="font-size: 1rem; font-weight: 600;">No Major Work packages assigned yet.</p>
        <p style="font-size: 0.82rem; margin-top: 4px;">Technical Head (Guide) can click "+ Assign Work to Team" to create and delegate major project modules.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = majorWorks.map(mw => {
    const childTasks = tasks.filter(t => t.majorWorkId === mw.id);
    const total = childTasks.length;
    const completed = childTasks.filter(t => t.status === 'completed' || t.verifiedProgress === 100).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    const isTeamLeadOfWork = user.role === 'Team Leader';

    return `
      <div class="major-work-card">
        <div>
          <div class="work-header">
            <h3>${mw.title}</h3>
            <span class="badge badge-${mw.priority === 'Critical' ? 'rejected' : 'in_progress'}">${mw.priority} Priority</span>
          </div>
          <p class="work-desc">${mw.description}</p>
          
          <div class="work-meta">
            <div>
              <span>Assigned By Guide</span>
              <strong>${mw.assignedBy}</strong>
            </div>
            <div>
              <span>Assigned Team</span>
              <strong>${mw.team}</strong>
            </div>
            <div>
              <span>Target Deadline</span>
              <strong>${mw.deadline}</strong>
            </div>
            <div>
              <span>Child Tasks</span>
              <strong>${total} Tasks Created</strong>
            </div>
          </div>
        </div>

        <div>
          <div style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 6px;">
            <span style="color: var(--text-muted)">Verified Child Tasks Progress</span>
            <strong style="color: #60A5FA">${completed}/${total} Tasks (${progress}%)</strong>
          </div>
          <div class="progress-track" style="margin-bottom: 14px;">
            <div class="progress-bar-fill" style="width: ${progress}%"></div>
          </div>

          ${isTeamLeadOfWork ? `
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-ai btn-sm" style="flex: 1;" onclick="triggerAiDecomposition('${mw.id}')">
                🤖 AI Auto-Divide &amp; Assign to Members
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// Open / Close Major Work Modal
function openMajorWorkModal() {
  document.getElementById('mwTitle').value = '';
  document.getElementById('mwDescription').value = '';
  document.getElementById('mwDeadline').value = '';

  const teamSelect = document.getElementById('mwTeamSelect');
  teamSelect.innerHTML = teams.map(t => `<option value="${t.id}">${t.name} (Lead: ${t.leaderName})</option>`).join('');

  document.getElementById('majorWorkModal').classList.remove('hidden');
}

function closeMajorWorkModal() {
  document.getElementById('majorWorkModal').classList.add('hidden');
}

function createMajorWork() {
  const title = document.getElementById('mwTitle').value.trim();
  const desc = document.getElementById('mwDescription').value.trim();
  const teamId = document.getElementById('mwTeamSelect').value;
  const priority = document.getElementById('mwPriority').value;
  const deadline = document.getElementById('mwDeadline').value;

  if (!title || !deadline) {
    showToast('Please provide a title and deadline.', 'danger');
    return;
  }

  const team = teams.find(t => t.id === teamId) || { name: 'Core Innovation Team', leaderName: 'Team Leader' };

  const newMW = {
    id: 'mw_' + Date.now(),
    title,
    description: desc,
    assignedBy: getCurrentUser().name,
    assignedTo: team.leaderName,
    teamId: team.id,
    team: team.name,
    deadline,
    priority,
    status: 'in_progress',
    createdAt: new Date().toISOString()
  };

  majorWorks.push(newMW);
  saveAllData();
  closeMajorWorkModal();
  renderApp();
  showToast(`Major Work "${title}" assigned to ${team.name}!`, 'success');
}

// ============================================================
// 7. AGENT 1: AI AUTO-DECOMPOSE & ROLE-BASED ASSIGNMENT
// ============================================================

function triggerAiDecomposition(majorWorkId) {
  const mw = majorWorks.find(m => m.id === majorWorkId);
  if (!mw) return;

  const teamMembers = users.filter(u => u.role === 'Team Member');
  if (teamMembers.length === 0) {
    showToast('Please add team members to your team before running AI Task Decomposition.', 'danger');
    return;
  }

  // Execute AI Agent logic
  const result = AIAgentHub.decomposeAndAssignWork(mw, teamMembers);
  if (!result.success) {
    showToast(result.message, 'danger');
    return;
  }

  stagedAiTasks = result.tasks;

  const modalContent = document.getElementById('aiDecomposeModalContent');
  modalContent.innerHTML = `
    <div style="background: rgba(139, 92, 246, 0.12); border: 1px solid rgba(139, 92, 246, 0.4); border-radius: var(--radius-md); padding: 14px; margin-bottom: 16px;">
      <h4 style="color: #C4B5FD; font-size: 0.95rem; margin-bottom: 4px;">🎯 AI Task Decomposition Plan for "${mw.title}"</h4>
      <p style="font-size: 0.82rem; color: var(--text-muted);">${result.summary}</p>
    </div>

    <div style="display: flex; flex-direction: column; gap: 12px;">
      ${stagedAiTasks.map((t, idx) => `
        <div style="background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
            <strong style="color: #FFFFFF; font-size: 0.95rem;">${idx + 1}. ${t.name}</strong>
            <span class="badge badge-in_progress">${t.priority}</span>
          </div>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 8px;">${t.description}</p>
          <div style="display: flex; justify-content: space-between; font-size: 0.78rem; background: var(--bg-card); padding: 8px 12px; border-radius: 4px;">
            <span>Assigned to: <strong style="color: #93C5FD">${t.member}</strong></span>
            <span>Deadline: <strong style="color: #FCD34D">${t.deadline}</strong></span>
          </div>
          <div style="font-size: 0.74rem; color: #A78BFA; margin-top: 6px;">
            💡 ${t.aiAssignedReason}
          </div>
        </div>
      `).join('')}
    </div>
  `;

  const modalFooter = document.getElementById('aiDecomposeModalFooter');
  modalFooter.innerHTML = `
    <button class="btn btn-outline" onclick="closeAiDecomposeModal()">Cancel</button>
    <button class="btn btn-ai" onclick="confirmAiDecomposition()">✅ Confirm &amp; Dispatch Tasks</button>
  `;

  document.getElementById('aiDecomposeModal').classList.remove('hidden');
}

function closeAiDecomposeModal() {
  document.getElementById('aiDecomposeModal').classList.add('hidden');
  stagedAiTasks = [];
}

function confirmAiDecomposition() {
  if (!stagedAiTasks || stagedAiTasks.length === 0) return;

  tasks.push(...stagedAiTasks);
  saveAllData();
  closeAiDecomposeModal();
  renderApp();
  showToast(`AI successfully dispatched ${stagedAiTasks.length} tasks to team members!`, 'success');
}

// Manual task creation
function openTaskModal() {
  const user = getCurrentUser();
  const mwSelect = document.getElementById('taskParentMajorWork');
  const memberSelect = document.getElementById('taskMemberSelect');

  mwSelect.innerHTML = majorWorks.map(mw => `<option value="${mw.id}">${mw.title}</option>`).join('');
  if (majorWorks.length === 0) {
    mwSelect.innerHTML = `<option value="">No major works created yet</option>`;
  }

  const members = users.filter(u => u.role === 'Team Member');
  memberSelect.innerHTML = members.map(m => `<option value="${m.id}">${m.name} (${m.skill || 'Member'})</option>`).join('');

  document.getElementById('taskNameInput').value = '';
  document.getElementById('taskDescInput').value = '';
  document.getElementById('taskSubtasksInput').value = 'UI Interface, Database & API Integration, Testing Output';
  document.getElementById('taskDeadlineInput').value = '';

  document.getElementById('taskModal').classList.remove('hidden');
}

function closeTaskModal() {
  document.getElementById('taskModal').classList.add('hidden');
}

function createDividedTask() {
  const user = getCurrentUser();
  const majorWorkId = document.getElementById('taskParentMajorWork').value;
  const title = document.getElementById('taskNameInput').value.trim();
  const desc = document.getElementById('taskDescInput').value.trim();
  const memberId = document.getElementById('taskMemberSelect').value;
  const subtasksRaw = document.getElementById('taskSubtasksInput').value.trim();
  const deadline = document.getElementById('taskDeadlineInput').value;
  const priority = document.getElementById('taskPriorityInput').value;

  if (!title || !memberId || !deadline) {
    showToast('Please fill in task title, member, and deadline.', 'danger');
    return;
  }

  const member = users.find(u => u.id === memberId);
  const parentMW = majorWorks.find(mw => mw.id === majorWorkId);

  const subtaskList = subtasksRaw.split(',')
    .map((s, idx) => ({ id: 'st_' + Date.now() + '_' + idx, title: s.trim(), completed: false }))
    .filter(s => s.title.length > 0);

  const newTask = {
    id: 'task_' + Date.now(),
    majorWorkId,
    name: title,
    description: desc,
    memberId: member ? member.id : '',
    member: member ? member.name : 'Team Member',
    teamId: member ? member.teamId : '',
    team: member ? member.team : (parentMW ? parentMW.team : 'Core Team'),
    deadline,
    priority,
    weight: 25,
    claimedProgress: 0,
    verifiedProgress: 0,
    status: 'in_progress',
    subtasks: subtaskList,
    proofSubmitted: false,
    proofType: '',
    proofDescription: '',
    proofFile: '',
    proofImageBase64: '',
    proofLink: '',
    aiScore: 0,
    aiCategory: '',
    aiMissingComponents: [],
    rejectionReason: '',
    proofHistory: [],
    auditLog: [
      {
        action: 'Task Divided & Assigned',
        user: user.name,
        time: new Date().toLocaleString(),
        detail: `Manually assigned to ${member ? member.name : 'member'} with ${subtaskList.length} required subtasks.`
      }
    ]
  };

  tasks.push(newTask);
  saveAllData();
  closeTaskModal();
  renderApp();
  showToast(`Task assigned to ${member ? member.name : 'member'}!`, 'success');
}

// ============================================================
// 8. TASK CARD RENDERING (Dynamic & Role-Protected)
// ============================================================

function renderTasks() {
  const container = document.getElementById('taskContainer');
  if (!container) return;

  const user = getCurrentUser();
  let taskList = tasks;

  if (user.role === 'Team Member') {
    taskList = tasks.filter(t => t.memberId === user.id || t.member === user.name);
  } else if (user.role === 'Team Leader') {
    taskList = tasks.filter(t => t.teamId === user.teamId || t.team === user.team || !user.teamId);
  }

  if (taskList.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--border);">
        <p style="font-size: 1.05rem; font-weight: 600;">No tasks found in this view.</p>
        <p style="font-size: 0.82rem; margin-top: 4px;">Tasks assigned by Team Leaders will appear here with proof verification workflows.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = taskList.map(task => renderSingleTaskCard(task, false)).join('');
}

function renderOtherMembersTasks() {
  const container = document.getElementById('otherTasksContainer');
  if (!container) return;

  const user = getCurrentUser();
  const otherTasks = tasks.filter(t => t.memberId !== user.id && t.member !== user.name);

  if (otherTasks.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; padding: 30px; text-align: center; color: var(--text-muted); background: var(--bg-surface); border-radius: var(--radius-md);">
        No other teammate tasks active right now.
      </div>
    `;
    return;
  }

  // Render other tasks with read-only restriction
  container.innerHTML = otherTasks.map(task => renderSingleTaskCard(task, true)).join('');
}

function renderSingleTaskCard(task, isReadOnly = false) {
  const user = getCurrentUser();
  const risk = WorkRealityEngine.getRiskAssessment(task);
  const mismatch = WorkRealityEngine.getMismatch(task);

  const isMyOwnTask = (user.id === task.memberId || user.name === task.member) && !isReadOnly;
  const isLeaderOrGuide = (user.role === 'Team Leader' || user.role === 'Technical Head') && !isReadOnly;

  return `
    <div class="task-card ${isReadOnly ? 'read-only' : ''}">
      <!-- Header -->
      <div class="task-card-header">
        <div>
          <h3 class="task-card-title">${task.name}</h3>
          <p class="task-desc">${task.description || ''}</p>
        </div>
        <div class="task-badges">
          <span class="badge badge-${task.status}">${formatStatus(task.status)}</span>
          <span class="badge ${risk.badgeClass}">${risk.label}</span>
        </div>
      </div>

      <!-- Info Grid -->
      <div class="task-info-grid">
        <div class="info-item">
          <span>Assigned Member</span>
          <strong>${task.member}</strong>
        </div>
        <div class="info-item">
          <span>Deadline</span>
          <strong>${task.deadline}</strong>
        </div>
        <div class="info-item">
          <span>Priority</span>
          <strong>${task.priority}</strong>
        </div>
        <div class="info-item">
          <span>Claimed Progress</span>
          <strong class="claimed-color">${task.claimedProgress}%</strong>
        </div>
        <div class="info-item">
          <span>Verified Progress</span>
          <strong class="verified-color">${task.verifiedProgress}%</strong>
        </div>
        <div class="info-item">
          <span>Discrepancy Gap</span>
          <strong class="${mismatch.hasMismatch ? 'mismatch-color' : ''}">${mismatch.gap > 0 ? '+' + mismatch.gap + '%' : '0%'}</strong>
        </div>
      </div>

      <!-- Subtasks Checklist -->
      <div class="subtasks-box">
        <div class="subtasks-title">
          <span>Required Subtasks (${isReadOnly ? 'Read-Only' : 'Progress Lock'})</span>
          <span>${task.subtasks ? task.subtasks.filter(s => s.completed).length : 0}/${task.subtasks ? task.subtasks.length : 0}</span>
        </div>
        <div class="subtasks-list">
          ${(task.subtasks || []).map(st => `
            <label class="subtask-item ${st.completed ? 'checked' : ''}">
              <input type="checkbox" ${st.completed ? 'checked' : ''} 
                ${isMyOwnTask ? `onchange="toggleSubtask('${task.id}', '${st.id}', this.checked)"` : 'disabled'}
              >
              <span>${st.title}</span>
            </label>
          `).join('')}
        </div>
      </div>

      <!-- Rejection Banner if rework required -->
      ${task.status === 'rejected' && task.rejectionReason ? `
        <div class="rejection-banner">
          <strong>❌ Returned by Team Leader for Rework</strong>
          <span>Feedback: "${task.rejectionReason}"</span>
        </div>
      ` : ''}

      <!-- Output Picture / Proof Preview if uploaded -->
      ${task.proofImageBase64 ? `
        <div class="output-picture-card">
          <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">🖼️ Uploaded Output Picture:</span>
          <img src="${task.proofImageBase64}" class="output-picture-thumb" alt="Output Proof" onclick="window.open('${task.proofImageBase64}')">
        </div>
      ` : ''}

      <!-- AI Evidence Analysis Box if proof submitted -->
      ${task.proofSubmitted ? `
        <div class="ai-evidence-box">
          <div class="ai-header">
            <span style="font-size: 0.8rem; font-weight: 700; color: #93C5FD;">🤖 AI Proof Verification Report</span>
            <span class="ai-score-pill score-${task.aiCategory || 'needs_review'}">${task.aiScore || 0}/100</span>
          </div>
          <p class="ai-details">Proof Type: <strong>${task.proofType}</strong> &bull; ${task.proofDescription ? task.proofDescription.slice(0, 80) + '...' : 'Evidence attached'}</p>
          ${task.proofLink ? `<p style="font-size: 0.75rem; color: #60A5FA;">🔗 <a href="${task.proofLink}" target="_blank" style="color: #93C5FD">${task.proofLink}</a></p>` : ''}
          ${task.aiMissingComponents && task.aiMissingComponents.length > 0 ? `
            <div class="ai-missing">⚠️ AI Flagged Missing: ${task.aiMissingComponents.join(', ')}</div>
          ` : ''}
        </div>
      ` : ''}

      <!-- Action Buttons -->
      <div class="card-actions">
        ${isMyOwnTask ? `
          <button class="btn btn-primary btn-sm" onclick="openProofModal('${task.id}')">
            📤 ${task.status === 'rejected' ? 'Resubmit Output Picture & Proof' : 'Upload Output Proof & Pictures'}
          </button>
        ` : ''}

        ${isLeaderOrGuide && task.proofSubmitted && task.status === 'pending_verification' ? `
          <button class="btn btn-success btn-sm" onclick="openReviewModal('${task.id}')">
            🔍 Verify &amp; Review Proof
          </button>
        ` : ''}

        <button class="btn btn-outline btn-sm" onclick="openHistoryModal('${task.id}')">
          📜 History &amp; Audit Log
        </button>
      </div>
    </div>
  `;
}

function formatStatus(status) {
  if (status === 'in_progress') return 'In Progress';
  if (status === 'pending_verification') return 'Pending Verification';
  if (status === 'completed') return 'Verified Complete';
  if (status === 'rejected') return 'Rejected (Rework)';
  return 'Not Started';
}

// ============================================================
// 9. SUBTASK PROGRESS LOCKING
// ============================================================

function toggleSubtask(taskId, subtaskId, isChecked) {
  const task = tasks.find(t => t.id === taskId);
  if (!task || !task.subtasks) return;

  const st = task.subtasks.find(s => s.id === subtaskId);
  if (st) {
    st.completed = isChecked;

    const newVerified = WorkRealityEngine.calculateVerifiedProgress(task);
    task.verifiedProgress = newVerified;

    if (task.claimedProgress < newVerified) {
      task.claimedProgress = newVerified;
    }

    if (task.status === 'rejected' && isChecked) {
      task.status = 'in_progress';
    }

    if (!task.auditLog) task.auditLog = [];
    task.auditLog.push({
      action: isChecked ? 'Subtask Checked' : 'Subtask Unchecked',
      user: getCurrentUser().name,
      time: new Date().toLocaleString(),
      detail: `Subtask "${st.title}" updated. Verified progress: ${newVerified}%.`
    });

    saveAllData();
    renderApp();
    showToast(`Subtask updated. Verified progress: ${newVerified}%.`, 'success');
  }
}

// ============================================================
// 10. SUBMIT PROOF WITH OUTPUT PICTURE PREVIEW
// ============================================================

function openProofModal(taskId) {
  selectedTaskId = taskId;
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  proofImageBase64 = '';
  document.getElementById('proofModalTaskTitle').textContent = `Task: ${task.name}`;
  document.getElementById('proofProgressInput').value = task.claimedProgress || 100;
  document.getElementById('proofLinkInput').value = task.proofLink || '';
  document.getElementById('proofDescInput').value = task.proofDescription || '';
  document.getElementById('proofFileInput').value = '';
  document.getElementById('imagePreviewContainer').style.display = 'none';

  document.getElementById('proofModal').classList.remove('hidden');
}

function closeProofModal() {
  document.getElementById('proofModal').classList.add('hidden');
}

function handleProofImagePreview(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    proofImageBase64 = e.target.result;
    const imgPreview = document.getElementById('proofPreviewImg');
    const container = document.getElementById('imagePreviewContainer');
    imgPreview.src = proofImageBase64;
    container.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function submitEvidence() {
  const task = tasks.find(t => t.id === selectedTaskId);
  if (!task) return;

  const claimed = Number(document.getElementById('proofProgressInput').value) || 100;
  const proofType = document.getElementById('proofTypeSelect').value;
  const link = document.getElementById('proofLinkInput').value.trim();
  const desc = document.getElementById('proofDescInput').value.trim();
  const fileInput = document.getElementById('proofFileInput');
  const fileName = fileInput.files && fileInput.files[0] ? fileInput.files[0].name : '';

  if (!desc && !link && !proofImageBase64 && !fileName) {
    showToast('Please upload a picture or provide an explanation / link as proof.', 'danger');
    return;
  }

  // Run AI Verification Agent
  const aiResult = AIAgentHub.verifyProofSubmission(task, proofType, desc, fileName, link, proofImageBase64);

  task.claimedProgress = claimed;
  task.proofSubmitted = true;
  task.proofType = proofType;
  task.proofDescription = desc;
  task.proofLink = link;
  task.proofFile = fileName;
  if (proofImageBase64) {
    task.proofImageBase64 = proofImageBase64;
  }
  task.aiScore = aiResult.score;
  task.aiCategory = aiResult.category;
  task.aiMissingComponents = aiResult.missingComponents;
  task.status = 'pending_verification';
  task.rejectionReason = '';

  if (!task.proofHistory) task.proofHistory = [];
  task.proofHistory.push({
    attempt: task.proofHistory.length + 1,
    date: new Date().toLocaleString(),
    claimedProgress: claimed,
    aiScore: aiResult.score,
    proofType: proofType,
    hasImage: !!proofImageBase64,
    status: 'pending',
    reason: 'Awaiting Team Leader review'
  });

  if (!task.auditLog) task.auditLog = [];
  task.auditLog.push({
    action: 'Output Proof Submitted',
    user: getCurrentUser().name,
    time: new Date().toLocaleString(),
    detail: `Submitted proof with AI confidence score of ${aiResult.score}%.`
  });

  saveAllData();
  closeProofModal();
  renderApp();
  showToast(`Proof submitted! AI rated confidence at ${aiResult.score}%. Sent to Team Leader for approval.`, 'success');
}

// ============================================================
// 11. TEAM LEADER PROOF REVIEW (Approve / Reject)
// ============================================================

function openReviewModal(taskId) {
  selectedTaskId = taskId;
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  const content = document.getElementById('reviewModalContent');
  const footer = document.getElementById('reviewModalFooter');

  content.innerHTML = `
    <div style="background: var(--bg-surface); padding: 14px; border-radius: var(--radius-md); margin-bottom: 14px;">
      <h4 style="color: #FFFFFF; font-size: 1rem; margin-bottom: 4px;">${task.name}</h4>
      <p style="font-size: 0.82rem; color: var(--text-muted)">Submitted By: <strong style="color: #93C5FD">${task.member}</strong></p>
    </div>

    <!-- Progress Comparison -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px;">
      <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid var(--warning); padding: 10px; border-radius: var(--radius-sm)">
        <span style="font-size: 0.75rem; color: var(--warning); text-transform: uppercase;">Claimed by Member</span>
        <strong style="display: block; font-size: 1.25rem; color: var(--warning)">${task.claimedProgress}%</strong>
      </div>
      <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid var(--success); padding: 10px; border-radius: var(--radius-sm)">
        <span style="font-size: 0.75rem; color: var(--success); text-transform: uppercase;">Subtask-Verified</span>
        <strong style="display: block; font-size: 1.25rem; color: var(--success)">${task.verifiedProgress}%</strong>
      </div>
    </div>

    <!-- Picture Display if present -->
    ${task.proofImageBase64 ? `
      <div style="margin-bottom: 14px; background: var(--bg-surface); padding: 12px; border-radius: var(--radius-md);">
        <p style="font-size: 0.8rem; font-weight: 700; color: #FFFFFF; margin-bottom: 6px;">🖼️ Member's Uploaded Output Proof Picture:</p>
        <img src="${task.proofImageBase64}" style="max-width: 100%; max-height: 220px; border-radius: 6px; border: 1px solid var(--border); cursor: pointer;" onclick="window.open('${task.proofImageBase64}')">
      </div>
    ` : ''}

    <!-- AI Evidence Report -->
    <div class="ai-evidence-box" style="margin-bottom: 14px;">
      <div class="ai-header">
        <span style="font-size: 0.85rem; font-weight: 700; color: #93C5FD;">🤖 AI Proof Verification Report</span>
        <span class="ai-score-pill score-${task.aiCategory || 'needs_review'}">${task.aiScore}/100</span>
      </div>
      <p style="font-size: 0.82rem; color: var(--text-main); margin-top: 4px;">Proof Type: <strong>${task.proofType}</strong></p>
      ${task.proofLink ? `<p style="font-size: 0.8rem; color: #60A5FA;">🔗 Link: <a href="${task.proofLink}" target="_blank" style="color: #93C5FD">${task.proofLink}</a></p>` : ''}
      <p style="font-size: 0.84rem; color: var(--text-muted); background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; margin-top: 6px;">"${task.proofDescription || 'No description provided.'}"</p>
      
      ${task.aiMissingComponents && task.aiMissingComponents.length > 0 ? `
        <div style="margin-top: 8px; font-size: 0.78rem; color: #FCA5A5;">
          <strong>⚠️ Flagged Missing Items:</strong>
          <ul style="margin-left: 18px; margin-top: 4px;">
            ${task.aiMissingComponents.map(m => `<li>${m}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>

    <div class="form-group">
      <label>Feedback / Rejection Reason (If rejecting)</label>
      <textarea id="reviewFeedbackInput" class="form-textarea" placeholder="e.g. Test output screenshot was incomplete; please re-run test suite and upload full log picture."></textarea>
    </div>
  `;

  footer.innerHTML = `
    <button class="btn btn-outline" onclick="closeReviewModal()">Cancel</button>
    <button class="btn btn-danger" onclick="rejectProofDecision()">❌ Reject &amp; Return for Rework</button>
    <button class="btn btn-success" onclick="approveProofDecision()">✅ Approve &amp; Mark 100% Verified</button>
  `;

  document.getElementById('reviewModal').classList.remove('hidden');
}

function closeReviewModal() {
  document.getElementById('reviewModal').classList.add('hidden');
}

function approveProofDecision() {
  const task = tasks.find(t => t.id === selectedTaskId);
  if (!task) return;

  const user = getCurrentUser();

  task.verifiedProgress = 100;
  task.claimedProgress = 100;
  task.status = 'completed';
  task.rejectionReason = '';

  if (task.subtasks) {
    task.subtasks.forEach(s => s.completed = true);
  }

  if (!task.proofHistory) task.proofHistory = [];
  task.proofHistory.push({
    attempt: task.proofHistory.length + 1,
    date: new Date().toLocaleString(),
    claimedProgress: 100,
    aiScore: task.aiScore,
    proofType: task.proofType,
    status: 'approved',
    reason: `Approved by ${user.name}. Progress is 100% verified.`
  });

  if (!task.auditLog) task.auditLog = [];
  task.auditLog.push({
    action: 'Proof Approved',
    user: user.name,
    time: new Date().toLocaleString(),
    detail: `Approved work evidence. Progress verified as 100% complete.`
  });

  saveAllData();
  closeReviewModal();
  renderApp();
  showToast(`Task "${task.name}" APPROVED and verified!`, 'success');
}

function rejectProofDecision() {
  const task = tasks.find(t => t.id === selectedTaskId);
  if (!task) return;

  const user = getCurrentUser();
  const reason = document.getElementById('reviewFeedbackInput').value.trim() || 'Proof insufficient. Required output pictures or subtasks missing.';

  task.status = 'rejected';
  task.rejectionReason = reason;
  task.claimedProgress = task.verifiedProgress; // Reset premature claimed progress
  task.proofSubmitted = false; // Allow resubmission

  if (!task.proofHistory) task.proofHistory = [];
  task.proofHistory.push({
    attempt: task.proofHistory.length + 1,
    date: new Date().toLocaleString(),
    claimedProgress: task.claimedProgress,
    aiScore: task.aiScore,
    proofType: task.proofType,
    status: 'rejected',
    reason: `Rejected by ${user.name}: ${reason}`
  });

  if (!task.auditLog) task.auditLog = [];
  task.auditLog.push({
    action: 'Proof Rejected',
    user: user.name,
    time: new Date().toLocaleString(),
    detail: `Rejected proof. Reason: "${reason}". Sent back to ${task.member} for rework.`
  });

  saveAllData();
  closeReviewModal();
  renderApp();
  showToast(`Proof rejected. Task returned to ${task.member} for rework.`, 'warning');
}

// ============================================================
// 12. AUDIT TRAIL MODAL
// ============================================================

function openHistoryModal(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  const container = document.getElementById('historyModalContent');

  const historyHtml = (task.proofHistory || []).map(ph => `
    <div style="background: var(--bg-surface); border-left: 3px solid ${ph.status === 'approved' ? 'var(--success)' : ph.status === 'rejected' ? 'var(--danger)' : 'var(--warning)'}; padding: 10px 14px; border-radius: 6px; margin-bottom: 8px;">
      <div style="display: flex; justify-content: space-between; font-size: 0.82rem;">
        <strong style="color: #FFFFFF">Attempt #${ph.attempt} &bull; ${ph.proofType}</strong>
        <span class="badge badge-${ph.status === 'approved' ? 'completed' : ph.status === 'rejected' ? 'rejected' : 'pending_verification'}">${ph.status}</span>
      </div>
      <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">Date: ${ph.date} | AI Score: ${ph.aiScore}%</p>
      <p style="font-size: 0.8rem; color: var(--text-main); margin-top: 4px;"><strong>Note:</strong> ${ph.reason || ''}</p>
    </div>
  `).join('');

  const auditHtml = (task.auditLog || []).map(al => `
    <div style="font-size: 0.78rem; padding: 6px 0; border-bottom: 1px solid var(--border-light)">
      <span style="color: #60A5FA; font-weight: 600;">[${al.time}]</span>
      <strong style="color: #FFFFFF">${al.user}:</strong>
      <span style="color: #93C5FD">${al.action}</span> &mdash;
      <span style="color: var(--text-muted)">${al.detail}</span>
    </div>
  `).join('');

  container.innerHTML = `
    <h4 style="color: #93C5FD; font-size: 1rem; margin-bottom: 12px;">${task.name}</h4>
    
    <h5 style="color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase; margin-bottom: 8px;">Proof Submission History</h5>
    <div style="margin-bottom: 18px;">
      ${historyHtml || '<p style="color: var(--text-muted); font-size: 0.82rem;">No proof submissions yet.</p>'}
    </div>

    <h5 style="color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase; margin-bottom: 8px;">Immutable Audit Log</h5>
    <div style="background: rgba(0,0,0,0.3); padding: 12px; border-radius: var(--radius-sm); max-height: 200px; overflow-y: auto;">
      ${auditHtml || '<p style="color: var(--text-muted); font-size: 0.82rem;">No audit logs recorded.</p>'}
    </div>
  `;

  document.getElementById('historyModal').classList.remove('hidden');
}

function closeHistoryModal() {
  document.getElementById('historyModal').classList.add('hidden');
}

// ============================================================
// 13. REAL-TIME TEAM CHAT
// ============================================================

function renderChat() {
  const container = document.getElementById('chatMessages');
  if (!container) return;

  const currentUser = getCurrentUser();

  container.innerHTML = projectChat.map(msg => {
    const isMine = msg.sender === currentUser.name;
    return `
      <div class="chat-bubble ${isMine ? 'mine' : ''}">
        <div class="chat-meta">
          <span class="chat-sender">${msg.sender}</span>
          <span class="chat-role">${msg.role}</span>
          <span class="chat-time">${msg.time}</span>
        </div>
        <div class="chat-text">${msg.message}</div>
      </div>
    `;
  }).join('');

  container.scrollTop = container.scrollHeight;
}

function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;

  const user = getCurrentUser();

  const newMsg = {
    id: 'msg_' + Date.now(),
    sender: user.name,
    role: user.role,
    team: user.team || 'Management',
    message: text,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  projectChat.push(newMsg);
  saveAllData();
  input.value = '';
  renderChat();
}

function handleChatKeyPress(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    sendChatMessage();
  }
}

// ============================================================
// 14. TOAST NOTIFICATIONS
// ============================================================

function showToast(message, type = 'primary') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

// ============================================================
// 15. RESET DATA UTILITY
// ============================================================

function resetDemoData() {
  if (confirm('Reset application to clean initial bootstrap state? All custom created teams and tasks will be cleared.')) {
    clearAllData();
    currentUserId = users[0].id;
    populateUserDropdown();
    updateActiveUser();
    renderApp();
    renderChat();
    showToast('Clean bootstrap state restored!', 'success');
  }
}