// ============================================================
// ENGINE.JS — Work Reality Engine
// Compares: (1) What Member Claims, (2) What Evidence Proves, (3) What Project Requires
// ============================================================

const WorkRealityEngine = {
  // Calculate verified progress strictly based on completed subtasks
  calculateVerifiedProgress(task) {
    if (!task.subtasks || task.subtasks.length === 0) {
      return task.verifiedProgress || 0;
    }
    const completedCount = task.subtasks.filter(s => s.completed).length;
    return Math.round((completedCount / task.subtasks.length) * 100);
  },

  // Detect mismatch between member's claimed progress and system-verified progress
  getMismatch(task) {
    const claimed = Number(task.claimedProgress) || 0;
    const verified = Number(task.verifiedProgress) || 0;
    const gap = claimed - verified;
    return {
      hasMismatch: gap >= 15,
      gap: Math.max(0, gap),
      claimed,
      verified
    };
  },

  // Assess task deadline and execution risk
  getRiskAssessment(task) {
    if (task.status === 'completed' || task.verifiedProgress === 100) {
      return { level: 'low', label: 'On Track', color: '#10B981', badgeClass: 'risk-low' };
    }

    const today = new Date();
    today.setHours(0,0,0,0);
    const deadline = new Date(task.deadline);
    deadline.setHours(0,0,0,0);
    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const verified = task.verifiedProgress || 0;

    if (diffDays < 0) {
      return { level: 'critical', label: `Overdue by ${Math.abs(diffDays)}d`, color: '#EF4444', badgeClass: 'risk-critical' };
    }
    if (diffDays <= 3 && verified < 70) {
      return { level: 'critical', label: `Critical: Due in ${diffDays}d (${verified}% done)`, color: '#EF4444', badgeClass: 'risk-critical' };
    }
    if (diffDays <= 7 && verified < 50) {
      return { level: 'high', label: `High Risk: ${diffDays}d left`, color: '#F97316', badgeClass: 'risk-high' };
    }
    if (diffDays <= 14 && verified < 30) {
      return { level: 'medium', label: `Medium Risk: ${diffDays}d left`, color: '#F59E0B', badgeClass: 'risk-medium' };
    }

    return { level: 'low', label: `${diffDays}d remaining`, color: '#10B981', badgeClass: 'risk-low' };
  },

  // Compute stats across teams and projects for Technical Lead and Team Lead dashboards
  computeSystemStats(allTasks, filterFn = null) {
    const list = filterFn ? allTasks.filter(filterFn) : allTasks;
    const total = list.length;
    if (total === 0) {
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
        rejected: 0,
        overdue: 0,
        mismatches: 0,
        avgClaimed: 0,
        avgVerified: 0,
        overallProgress: 0
      };
    }

    let totalClaimed = 0;
    let totalVerified = 0;
    let completed = 0;
    let inProgress = 0;
    let pending = 0;
    let rejected = 0;
    let overdue = 0;
    let mismatches = 0;

    list.forEach(t => {
      const claimed = Number(t.claimedProgress) || 0;
      const verified = Number(t.verifiedProgress) || 0;
      totalClaimed += claimed;
      totalVerified += verified;

      if (t.status === 'completed' || verified === 100) {
        completed++;
      } else if (t.status === 'pending_verification' || (t.proofSubmitted && t.status !== 'rejected')) {
        pending++;
      } else if (t.status === 'rejected') {
        rejected++;
      } else if (verified > 0 || claimed > 0) {
        inProgress++;
      }

      const risk = this.getRiskAssessment(t);
      if (risk.level === 'critical' && t.status !== 'completed') {
        overdue++;
      }

      if (claimed - verified >= 15) {
        mismatches++;
      }
    });

    const avgClaimed = Math.round(totalClaimed / total);
    const avgVerified = Math.round(totalVerified / total);

    return {
      total,
      completed,
      inProgress,
      pending,
      rejected,
      overdue,
      mismatches,
      avgClaimed,
      avgVerified,
      overallProgress: avgVerified
    };
  }
};
