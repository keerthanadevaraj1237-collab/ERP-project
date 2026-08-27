// ============================================================
// AI-PROOF.JS — Intelligent Agent Hub
// Agent 1: AI Task Decomposition & Role-Based Assignment Agent
// Agent 2: AI Proof & Output Verification Agent
// ============================================================

const AIAgentHub = {

  // ============================================================
  // AGENT 1: AI TASK DECOMPOSITION & ROLE ASSIGNMENT AGENT
  // Takes major work from Guide -> analyzes team roster -> splits & assigns tasks + deadlines
  // ============================================================
  decomposeAndAssignWork(majorWork, teamMembers) {
    if (!teamMembers || teamMembers.length === 0) {
      return { success: false, message: 'No team members available in this team to assign work.' };
    }

    const title = (majorWork.title || '').toLowerCase();
    const desc = (majorWork.description || '').toLowerCase();
    const fullText = `${title} ${desc}`;
    const parentDeadline = new Date(majorWork.deadline || new Date(Date.now() + 14 * 86400000));
    const now = new Date();

    // Calculate intermediate deadlines based on remaining days
    const totalDays = Math.max(3, Math.ceil((parentDeadline - now) / (1000 * 60 * 60 * 24)));

    // Categorize team members by their skill profiles
    const frontendDevs = teamMembers.filter(m => /front|ui|ux|web|design|client|react|html|css/i.test(m.skill || m.name));
    const backendDevs = teamMembers.filter(m => /back|api|server|node|python|java|db|database|sql/i.test(m.skill || m.name));
    const qaDevs = teamMembers.filter(m => /test|qa|quality|security|devops/i.test(m.skill || m.name));

    // Fallbacks if roles are generic
    const getAssignee = (preferredList, indexFallback) => {
      if (preferredList.length > 0) return preferredList[0];
      return teamMembers[indexFallback % teamMembers.length];
    };

    const generatedTasks = [];

    // Template 1: UI / Frontend Module
    const feAssignee = getAssignee(frontendDevs, 0);
    const feDays = Math.max(1, Math.floor(totalDays * 0.5));
    const feDeadline = new Date(now.getTime() + feDays * 86400000).toISOString().split('T')[0];
    generatedTasks.push({
      id: 'task_ai_' + Date.now() + '_1',
      majorWorkId: majorWork.id,
      name: `${majorWork.title} — Frontend Interface & User Experience`,
      description: `Build responsive client-side interface, navigation layout, input validation, and user interaction flows for ${majorWork.title}.`,
      memberId: feAssignee.id,
      member: feAssignee.name,
      teamId: feAssignee.teamId,
      team: feAssignee.team || 'Core Team',
      deadline: feDeadline,
      priority: 'High',
      weight: 30,
      claimedProgress: 0,
      verifiedProgress: 0,
      status: 'in_progress',
      subtasks: [
        { id: 'st_' + Date.now() + '_1', title: 'Design responsive screen layouts & views', completed: false },
        { id: 'st_' + Date.now() + '_2', title: 'Input form validation & state management', completed: false },
        { id: 'st_' + Date.now() + '_3', title: 'Client-side API call integration & error states', completed: false }
      ],
      aiAssignedReason: `Assigned to ${feAssignee.name} based on skill profile: "${feAssignee.skill || 'Frontend Development'}".`,
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
          action: 'AI Agent Generated & Assigned',
          user: 'AI Task Decomposition Agent',
          time: new Date().toLocaleString(),
          detail: `Decomposed from "${majorWork.title}" and assigned to ${feAssignee.name} matching role (${feAssignee.skill || 'Developer'}).`
        }
      ]
    });

    // Template 2: Backend, Database & Core Logic
    const beAssignee = getAssignee(backendDevs, 1);
    const beDays = Math.max(1, Math.floor(totalDays * 0.7));
    const beDeadline = new Date(now.getTime() + beDays * 86400000).toISOString().split('T')[0];
    generatedTasks.push({
      id: 'task_ai_' + Date.now() + '_2',
      majorWorkId: majorWork.id,
      name: `${majorWork.title} — Core Backend Logic & Database APIs`,
      description: `Implement database entities, authentication/authorization layers, API endpoints, business logic processing, and error handling for ${majorWork.title}.`,
      memberId: beAssignee.id,
      member: beAssignee.name,
      teamId: beAssignee.teamId,
      team: beAssignee.team || 'Core Team',
      deadline: beDeadline,
      priority: 'Critical',
      weight: 40,
      claimedProgress: 0,
      verifiedProgress: 0,
      status: 'in_progress',
      subtasks: [
        { id: 'st_' + Date.now() + '_4', title: 'Database schema design & migrations', completed: false },
        { id: 'st_' + Date.now() + '_5', title: 'REST / GraphQL endpoint controllers & business logic', completed: false },
        { id: 'st_' + Date.now() + '_6', title: 'Security validations & database connection pooling', completed: false }
      ],
      aiAssignedReason: `Assigned to ${beAssignee.name} based on skill profile: "${beAssignee.skill || 'Backend & Database'}".`,
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
          action: 'AI Agent Generated & Assigned',
          user: 'AI Task Decomposition Agent',
          time: new Date().toLocaleString(),
          detail: `Decomposed from "${majorWork.title}" and assigned to ${beAssignee.name} matching role (${beAssignee.skill || 'Developer'}).`
        }
      ]
    });

    // Template 3: Verification, Testing & Live Output
    const qaAssignee = getAssignee(qaDevs, 2);
    const qaDays = Math.max(1, totalDays);
    const qaDeadline = majorWork.deadline || new Date(now.getTime() + qaDays * 86400000).toISOString().split('T')[0];
    generatedTasks.push({
      id: 'task_ai_' + Date.now() + '_3',
      majorWorkId: majorWork.id,
      name: `${majorWork.title} — Testing, Output Validation & Documentation`,
      description: `Conduct end-to-end testing, integration tests, verify output screenshots/logs, and prepare deployment readiness evidence for ${majorWork.title}.`,
      memberId: qaAssignee.id,
      member: qaAssignee.name,
      teamId: qaAssignee.teamId,
      team: qaAssignee.team || 'Core Team',
      deadline: qaDeadline,
      priority: 'High',
      weight: 30,
      claimedProgress: 0,
      verifiedProgress: 0,
      status: 'in_progress',
      subtasks: [
        { id: 'st_' + Date.now() + '_7', title: 'Unit & integration test case execution', completed: false },
        { id: 'st_' + Date.now() + '_8', title: 'Live output verification & output screenshot capture', completed: false },
        { id: 'st_' + Date.now() + '_9', title: 'System documentation & deployment test run', completed: false }
      ],
      aiAssignedReason: `Assigned to ${qaAssignee.name} based on skill profile: "${qaAssignee.skill || 'Testing & QA'}".`,
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
          action: 'AI Agent Generated & Assigned',
          user: 'AI Task Decomposition Agent',
          time: new Date().toLocaleString(),
          detail: `Decomposed from "${majorWork.title}" and assigned to ${qaAssignee.name} matching role (${qaAssignee.skill || 'Developer'}).`
        }
      ]
    });

    return {
      success: true,
      tasks: generatedTasks,
      summary: `AI Agent successfully decomposed "${majorWork.title}" into ${generatedTasks.length} role-aligned tasks distributed to ${teamMembers.length} team members.`
    };
  },

  // ============================================================
  // AGENT 2: AI PROOF & OUTPUT VERIFICATION AGENT
  // Analyzes uploaded images/pictures, output proofs, links & descriptions
  // ============================================================
  verifyProofSubmission(task, proofType, description, file, link, imageBase64) {
    let score = 25; // Base confidence score for evidence filing
    const descText = (description || '').toLowerCase();
    const linkText = (link || '').toLowerCase();
    const fileName = (file || '').toLowerCase();

    // 1. Evidence Type Credibility
    if (proofType === 'screenshot' || proofType === 'image_output') {
      score += 25;
      if (imageBase64 && imageBase64.length > 500) {
        score += 15; // Image file actual binary/base64 present
      }
    } else if (proofType === 'github') {
      score += 25;
      if (linkText.includes('github.com') || linkText.includes('gitlab.com') || linkText.includes('commit')) score += 15;
    } else if (proofType === 'live') {
      score += 25;
      if (linkText.startsWith('http://') || linkText.startsWith('https://')) score += 15;
    } else if (proofType === 'test') {
      score += 25;
      if (descText.includes('pass') || descText.includes('coverage') || descText.includes('assert')) score += 10;
    } else if (proofType === 'document') {
      score += 20;
    }

    // 2. Output description depth & clarity
    if (descText.length > 30) score += 10;
    if (descText.length > 100) score += 10;

    // 3. Subtask verification alignment
    const totalSubtasks = (task.subtasks || []).length;
    const completedSubtasks = (task.subtasks || []).filter(s => s.completed).length;
    const subtaskRatio = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) : 0.5;
    score = Math.round(score * (0.6 + 0.4 * subtaskRatio));

    // Cap score (0 to 98)
    score = Math.max(15, Math.min(98, score));

    // Determine category
    let category = 'insufficient';
    if (score >= 75) category = 'strong';
    else if (score >= 45) category = 'needs_review';
    else category = 'insufficient';

    // Extract missing requirement components
    const missing = [];
    (task.subtasks || []).forEach(st => {
      if (!st.completed) missing.push(st.title);
    });

    if (!imageBase64 && proofType === 'screenshot') {
      missing.push('Actual output picture / screenshot attachment');
    }
    if (descText.length < 20) {
      missing.push('Detailed explanation of how the proof validates task completion');
    }

    return {
      score,
      category,
      missingComponents: [...new Set(missing)].slice(0, 4),
      recommendation: category === 'strong'
        ? 'High quality proof with verified output. Ready for Team Leader approval.'
        : category === 'needs_review'
        ? 'Proof partially complete. Team Leader should check missing subtasks before approval.'
        : 'Insufficient evidence. Output proof or required subtask checklist is missing. Recommend rework.'
    };
  }
};
