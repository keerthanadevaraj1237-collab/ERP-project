// ============================================================
// ENGINE.JS — Work Reality Engine
// The core intelligence: compares claimed vs verified vs required
// ============================================================

const WorkRealityEngine = {

  // Calculate verified progress from approved subtasks only
  calculateVerifiedProgress(task) {
    if (!task.subtasks || task.subtasks.length === 0) return task.verifiedProgress || 0;
    const completed = task.subtasks.filter(s => s.completed).length;
    return Math.round((completed / task.subtasks.length) * 100);
  },

  // Check if mismatch exists (claimed exceeds verified by threshold)
  hasMismatch(task, threshold = 15) {
    const verified = this.calculateVerifiedProgress(task);
    return task.claimedProgress - verified >= threshold;
  },

  // Determine risk level based on deadline + verified progress gap
  calculateRiskLevel(task) {
    const now = new Date();
    const deadline = new Date(task.deadline);
    const start = new Date(task.startDate);
    const totalDays = Math.max(1, (deadline - start) / (1000 * 60 * 60 * 24));
    const daysLeft = (deadline - now) / (1000 * 60 * 60 * 24);
    const verified = this.calculateVerifiedProgress(task);
    const timeElapsedPct = ((now - start) / (deadline - start)) * 100;
    const progressGap = timeElapsedPct - verified;

    if (task.status === 'completed') return 'low';

    if (daysLeft < 0) {
      return verified < 100 ? 'critical' : 'high';
    }
    if (daysLeft <= 3 && verified < 80) return 'critical';
    if (daysLeft <= 7 && verified < 60) return 'critical';
    if (daysLeft <= 5 && verified < 80) return 'high';
    if (progressGap > 40) return 'high';
    if (progressGap > 20 || daysLeft <= 10 && verified < 50) return 'medium';
    return 'low';
  },

  // Check if task is blocked by dependencies
  isBlocked(task, allTasks) {
    if (!task.dependsOn || task.dependsOn.length === 0) return false;
    return task.dependsOn.some(depId => {
      const dep = allTasks.find(t => t.id === depId);
      return dep && dep.status !== 'completed';
    });
  },

  // Get blocking reasons
  getBlockingReasons(task, allTasks) {
    if (!task.dependsOn || task.dependsOn.length === 0) return [];
    return task.dependsOn
      .map(depId => allTasks.find(t => t.id === depId))
      .filter(dep => dep && dep.status !== 'completed')
      .map(dep => `"${dep.title}" (${dep.verifiedProgress}% verified)`);
  },

  // Run full reality check on a task
  analyzeTask(task, allTasks) {
    const verifiedProgress = this.calculateVerifiedProgress(task);
    const mismatch = this.hasMismatch({ ...task, verifiedProgress });
    const riskLevel = this.calculateRiskLevel({ ...task, verifiedProgress });
    const blocked = this.isBlocked(task, allTasks);
    const blockingReasons = this.getBlockingReasons(task, allTasks);
    const mismatchGap = task.claimedProgress - verifiedProgress;

    let verdict = 'on_track';
    if (task.status === 'completed') verdict = 'verified_complete';
    else if (blocked) verdict = 'blocked';
    else if (riskLevel === 'critical') verdict = 'critical';
    else if (mismatch && riskLevel === 'high') verdict = 'unverified_at_risk';
    else if (mismatch) verdict = 'unverified_claim';
    else if (riskLevel === 'high' || riskLevel === 'critical') verdict = 'at_risk';
    else verdict = 'on_track';

    return { verifiedProgress, mismatch, mismatchGap, riskLevel, blocked, blockingReasons, verdict };
  },

  // Aggregate project stats
  getProjectStats(projectId, allTasks) {
    const tasks = allTasks.filter(t => t.projectId === projectId);
    const total = tasks.length;
    if (total === 0) return null;

    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const pending = tasks.filter(t => t.status === 'pending_verification').length;
    const rejected = tasks.filter(t => t.status === 'rejected').length;
    const notStarted = tasks.filter(t => t.status === 'not_started').length;
    const overdue = tasks.filter(t => new Date(t.deadline) < new Date() && t.status !== 'completed').length;
    const highRisk = tasks.filter(t => ['high', 'critical'].includes(this.calculateRiskLevel(t))).length;
    const mismatches = tasks.filter(t => this.hasMismatch(t)).length;
    const blocked = tasks.filter(t => this.isBlocked(t, allTasks)).length;

    const avgVerified = Math.round(tasks.reduce((sum, t) => sum + this.calculateVerifiedProgress(t), 0) / total);
    const avgClaimed = Math.round(tasks.reduce((sum, t) => sum + t.claimedProgress, 0) / total);

    return { total, completed, inProgress, pending, rejected, notStarted, overdue, highRisk, mismatches, blocked, avgVerified, avgClaimed };
  },

  // Get team stats for a lead
  getTeamStats(leadId, allTasks, allUsers) {
    const members = allUsers.filter(u => u.leadId === leadId);
    const memberIds = members.map(u => u.id);
    const teamTasks = allTasks.filter(t => memberIds.includes(t.assignedTo));

    const pendingVerification = teamTasks.filter(t => t.status === 'pending_verification').length;
    const mismatchCount = teamTasks.filter(t => this.hasMismatch(t)).length;
    const highRiskCount = teamTasks.filter(t => ['high', 'critical'].includes(this.calculateRiskLevel(t))).length;
    const overdueCount = teamTasks.filter(t => new Date(t.deadline) < new Date() && t.status !== 'completed').length;
    const completedCount = teamTasks.filter(t => t.status === 'completed').length;
    const blockedCount = teamTasks.filter(t => this.isBlocked(t, allTasks)).length;

    const avgVerified = teamTasks.length
      ? Math.round(teamTasks.reduce((sum, t) => sum + this.calculateVerifiedProgress(t), 0) / teamTasks.length)
      : 0;

    return { pendingVerification, mismatchCount, highRiskCount, overdueCount, completedCount, blockedCount, avgVerified, totalTasks: teamTasks.length };
  },

  // Format date nicely
  formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  },

  // Format timestamp
  formatTimestamp(ts) {
    const d = new Date(ts);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  },

  // Days remaining
  daysRemaining(deadline) {
    const diff = new Date(deadline) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  },

  // Reliability badge
  reliabilityBadge(score) {
    if (score >= 90) return { label: 'Excellent', color: '#10B981', icon: '⭐' };
    if (score >= 75) return { label: 'Good', color: '#4F8EF7', icon: '👍' };
    if (score >= 60) return { label: 'Average', color: '#F59E0B', icon: '⚠️' };
    return { label: 'Needs Improvement', color: '#F43F5E', icon: '🔴' };
  }
};
