// ============================================================
// AI-PROOF.JS — Simulated AI Proof Verification System
// Analyzes submitted evidence and generates quality scores
// ============================================================

const AIProofVerifier = {

  // Evidence type quality weights
  typeWeights: {
    github_commit: 30,
    test_result: 28,
    live_link: 25,
    screen_recording: 22,
    document: 18,
    screenshot: 15,
    design_file: 12,
  },

  // Keywords that indicate strong evidence per common task types
  requirementKeywords: {
    auth: ['login', 'register', 'jwt', 'token', 'oauth', 'authentication', 'password', '2fa', 'session', 'auth'],
    api: ['endpoint', 'route', 'rest', 'api', 'swagger', 'postman', 'http', 'request', 'response', 'crud'],
    ui: ['interface', 'ui', 'design', 'responsive', 'component', 'form', 'page', 'layout', 'css', 'html'],
    database: ['schema', 'migration', 'index', 'query', 'table', 'erd', 'database', 'sql', 'optimization', 'pool'],
    payment: ['stripe', 'razorpay', 'payment', 'webhook', 'transaction', 'refund', 'pci', 'gateway', 'checkout'],
    testing: ['test', 'spec', 'coverage', 'unit', 'integration', 'e2e', 'jest', 'mocha', 'assertion', 'pass'],
    frontend: ['react', 'vue', 'angular', 'component', 'state', 'props', 'render', 'dom', 'hook', 'context'],
    search: ['search', 'filter', 'elastic', 'index', 'query', 'pagination', 'sort', 'result', 'keyword'],
    profile: ['profile', 'employee', 'avatar', 'upload', 'crud', 'org', 'chart', 'department', 'role'],
    leave: ['leave', 'approval', 'workflow', 'balance', 'calendar', 'notification', 'request', 'policy'],
  },

  // Detect task category from title/description
  detectCategory(title, description) {
    const text = (title + ' ' + description).toLowerCase();
    const scores = {};
    for (const [cat, keywords] of Object.entries(this.requirementKeywords)) {
      scores[cat] = keywords.filter(k => text.includes(k)).length;
    }
    return Object.entries(scores).sort((a,b) => b[1]-a[1]).slice(0,3).map(e => e[0]);
  },

  // Score description text for evidence quality
  scoreDescription(description, categories) {
    if (!description) return 0;
    const text = description.toLowerCase();
    let score = 0;
    const matched = [];

    for (const cat of categories) {
      const keywords = this.requirementKeywords[cat] || [];
      for (const kw of keywords) {
        if (text.includes(kw)) { score += 3; matched.push(kw); }
      }
    }

    // General quality indicators
    if (description.length > 100) score += 10;
    if (description.length > 200) score += 5;
    if (text.includes('complete') || text.includes('done') || text.includes('finish')) score -= 2;
    if (text.includes('tested') || text.includes('verified') || text.includes('working')) score += 5;
    if (text.includes('commit') || text.includes('pr') || text.includes('pull request')) score += 5;
    if (text.includes('screenshot') || text.includes('recording') || text.includes('demo')) score += 4;
    if (text.includes('issue') || text.includes('problem') || text.includes('bug')) score -= 3;

    return Math.min(40, score);
  },

  // Check URL quality
  scoreUrl(url, type) {
    if (!url || url.trim() === '') return 0;
    let score = 5;
    if (url.startsWith('https://')) score += 5;
    if (type === 'github_commit' && (url.includes('github.com') || url.includes('gitlab.com'))) score += 15;
    if (type === 'live_link' && (url.startsWith('http://') || url.startsWith('https://'))) score += 10;
    if (type === 'document' && (url.includes('drive.google') || url.includes('docs.google') || url.includes('notion') || url.includes('confluence'))) score += 10;
    if (type === 'test_result' && (url.includes('github') || url.includes('jenkins') || url.includes('ci'))) score += 12;
    return Math.min(20, score);
  },

  // Determine missing components from task subtasks
  findMissingComponents(task, submittedDescription) {
    const text = (submittedDescription || '').toLowerCase();
    const missing = [];
    const categories = this.detectCategory(task.title, task.description);

    // Check incomplete subtasks
    task.subtasks.forEach(st => {
      if (!st.completed) missing.push(st.title);
    });

    // Additional checks based on task type
    if (categories.includes('auth')) {
      if (!text.includes('test') && !text.includes('spec')) missing.push('Unit/Integration tests');
      if (!text.includes('2fa') && !text.includes('two-factor')) {
        if (task.description.toLowerCase().includes('2fa')) missing.push('2FA implementation');
      }
    }
    if (categories.includes('api')) {
      if (!text.includes('swagger') && !text.includes('doc') && task.description.toLowerCase().includes('swagger')) missing.push('API documentation');
    }
    if (categories.includes('payment')) {
      if (!text.includes('webhook')) missing.push('Webhook handlers');
      if (!text.includes('refund')) missing.push('Refund flow');
      if (!text.includes('test') && !text.includes('stripe') && !text.includes('razorpay')) missing.push('Payment provider testing');
    }
    if (categories.includes('testing')) {
      if (!text.includes('coverage')) missing.push('Code coverage report');
    }

    return [...new Set(missing)].slice(0, 6);
  },

  // Main analysis function
  analyzeProof(proof, task) {
    const categories = this.detectCategory(task.title, task.description);

    // Component scores
    const typeScore = this.typeWeights[proof.type] || 10;
    const descScore = this.scoreDescription(proof.description, categories);
    const urlScore = this.scoreUrl(proof.url, proof.type);

    // Subtask verification bonus
    const completedSubtasks = task.subtasks.filter(s => s.completed).length;
    const subtaskRatio = task.subtasks.length > 0 ? completedSubtasks / task.subtasks.length : 0.5;
    const subtaskScore = Math.round(subtaskRatio * 15);

    // Recency score (recent submissions score higher)
    const submittedAt = new Date(proof.submittedAt || new Date());
    const hoursOld = (new Date() - submittedAt) / (1000 * 60 * 60);
    const recencyScore = hoursOld < 24 ? 5 : hoursOld < 72 ? 3 : 1;

    // Total score (capped 0-100)
    let totalScore = typeScore + descScore + urlScore + subtaskScore + recencyScore;
    totalScore = Math.max(0, Math.min(100, totalScore));

    // Determine category
    let category = 'insufficient';
    if (totalScore >= 75) category = 'strong';
    else if (totalScore >= 50) category = 'needs_review';
    else category = 'insufficient';

    // Find missing components
    const missingComponents = this.findMissingComponents(task, proof.description);

    // Build breakdown
    const breakdown = [
      { label: 'Evidence Type', score: typeScore, max: 30, detail: `${proof.type?.replace('_', ' ')} — ${typeScore >= 20 ? 'High credibility' : typeScore >= 12 ? 'Medium credibility' : 'Low credibility'}` },
      { label: 'Description Quality', score: descScore, max: 40, detail: `${description?.length || 0} chars, ${descScore >= 25 ? 'detailed' : descScore >= 15 ? 'moderate' : 'sparse'}` },
      { label: 'URL/Link Validity', score: urlScore, max: 20, detail: proof.url ? 'Link provided' : 'No link attached' },
      { label: 'Subtask Coverage', score: subtaskScore, max: 15, detail: `${completedSubtasks}/${task.subtasks.length} subtasks verified` },
      { label: 'Recency', score: recencyScore, max: 5, detail: hoursOld < 24 ? 'Submitted today' : 'Older submission' },
    ];

    // Recommendation
    let recommendation = '';
    if (category === 'strong') recommendation = 'Evidence appears comprehensive. Recommend approval after quick review.';
    else if (category === 'needs_review') recommendation = 'Evidence is partial. Request additional proof for missing components before approval.';
    else recommendation = 'Evidence is insufficient. Major components missing. Reject and return for rework.';

    return { totalScore, category, breakdown, missingComponents, recommendation, categories };
  },

  // Quick score for display (used when reviewing a task)
  getQuickScore(proofType, description, url) {
    const typeScore = this.typeWeights[proofType] || 10;
    const descScore = description ? Math.min(30, description.length / 10) : 0;
    const urlScore = url && url.startsWith('http') ? 15 : 0;
    return Math.min(100, Math.round(typeScore + descScore + urlScore));
  }
};
