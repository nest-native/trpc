// Posts a test performance comparison comment on PRs.
// Called from ci.yml via actions/github-script.
// Adapted for Mocha JSON output format.

module.exports = async ({ github, context, core }) => {
  const fs = require('fs');

  const results = JSON.parse(fs.readFileSync('test-results.json', 'utf8'));
  const stepDurationMs = parseInt(fs.readFileSync('test-step-duration-ms.txt', 'utf8').trim(), 10);
  const hasBase = fs.existsSync('base-test-results.json');
  const baseResults = hasBase ? JSON.parse(fs.readFileSync('base-test-results.json', 'utf8')) : null;
  const baseStepDurationMs = fs.existsSync('base-test-step-duration-ms.txt')
    ? parseInt(fs.readFileSync('base-test-step-duration-ms.txt', 'utf8').trim(), 10)
    : null;

  // --- Helpers ---
  const fmtMilliseconds = (ms) => `${Math.round(ms)}ms`;
  const fmtDuration = (ms) => (ms >= 1000 ? `**${(ms / 1000).toFixed(2)}s**` : fmtMilliseconds(ms));

  const fmtDiff = (currMs, baseMs) => {
    if (baseMs == null) return '-';
    const diffMs = currMs - baseMs;
    if (Math.abs(diffMs) < 50) return '⚪ ~0';
    const sign = diffMs > 0 ? '+' : '';
    const icon = diffMs > 0 ? '🔴' : '🟢';
    return diffMs >= 1000 || diffMs <= -1000
      ? `${icon} ${sign}${(diffMs / 1000).toFixed(2)}s`
      : `${icon} ${sign}${fmtMilliseconds(diffMs)}`;
  };

  const suiteKey = (file) => file.split('/').slice(-3).join('/');

  // --- Build suite timings from mocha JSON (group tests by file) ---
  const suiteMap = new Map();
  for (const t of [...results.passes, ...results.failures, ...(results.pending || [])]) {
    const file = t.file || 'unknown';
    const entry = suiteMap.get(file) || { name: file, duration: 0, testCount: 0 };
    entry.duration += t.duration || 0;
    entry.testCount += 1;
    suiteMap.set(file, entry);
  }
  const suiteTimings = [...suiteMap.values()];
  const totalTestTime = results.stats.duration;

  // --- Base suite map ---
  const baseSuiteMap = new Map();
  if (baseResults) {
    for (const t of [...baseResults.passes, ...baseResults.failures, ...(baseResults.pending || [])]) {
      const file = t.file || 'unknown';
      const entry = baseSuiteMap.get(suiteKey(file)) || { duration: 0 };
      entry.duration += t.duration || 0;
      baseSuiteMap.set(suiteKey(file), entry);
    }
  }
  const baseTotalTestTime = baseResults ? baseResults.stats.duration : null;

  const suites = suiteTimings
    .map((s) => {
      const key = suiteKey(s.name);
      const baseEntry = baseSuiteMap.get(key);
      return { ...s, name: key, baseDuration: baseEntry?.duration ?? null };
    })
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 10);

  const suiteRows = suites.map((s, i) => {
    return `| ${i + 1} | \`${s.name}\` | ${s.testCount} | ${fmtDuration(s.duration)} | ${fmtDiff(s.duration, s.baseDuration)} |`;
  });

  // --- Slowest individual tests ---
  const baseTestMap = new Map();
  if (baseResults) {
    for (const t of baseResults.passes) {
      baseTestMap.set(t.fullTitle, t.duration || 0);
    }
  }

  const tests = [...results.passes, ...results.failures]
    .map((t) => ({
      suite: (t.file || '').split('/').slice(-1)[0]?.replace('.spec.ts', '') || 'unknown',
      name: t.fullTitle,
      duration: t.duration || 0,
    }))
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 15);

  const testRows = tests.map((t, i) => {
    const baseDuration = baseTestMap.has(t.name) ? baseTestMap.get(t.name) : null;
    return `| ${i + 1} | \`${t.suite}\` | ${t.name} | ${fmtDuration(t.duration)} | ${fmtDiff(t.duration, baseDuration)} |`;
  });

  // --- Build comment body ---
  const { stats } = results;
  const sections = [
    '<!-- test-performance-report -->',
    `## ⏱️ Performance Report`,
    '',
    `| | |`,
    `|---|---|`,
    `| **✅ Tests** | ${stats.passes} passed, ${stats.failures} failed, ${stats.pending} skipped |`,
    `| **🧪 Suites** | ${stats.suites} |`,
    `| **⏱️ Total step time** | ${fmtDuration(stepDurationMs)} (install + tests) ${baseStepDurationMs != null ? fmtDiff(stepDurationMs, baseStepDurationMs) : ''} |`,
    `| **⚙️ Test execution** | ${fmtDuration(totalTestTime)} ${baseTotalTestTime != null ? fmtDiff(totalTestTime, baseTotalTestTime) : ''} |`,
    '',
    '<details>',
    '<summary><strong>🐢 Slowest test suites</strong></summary>',
    '',
    `| # | Suite | Tests | Duration | vs Base |`,
    `|---|-------|-------|----------|---------|`,
    ...suiteRows,
    '',
    '</details>',
    '',
    '<details>',
    '<summary><strong>🐌 Slowest individual tests</strong></summary>',
    '',
    `| # | Suite | Test | Duration | vs Base |`,
    `|---|-------|------|----------|---------|`,
    ...testRows,
    '',
    '</details>',
    '',
    '---',
    `<sub>Updated for [\`${context.sha.slice(0, 7)}\`](${context.payload.repository.html_url}/commit/${context.sha}) | ${hasBase ? 'Compared against base branch' : 'No base data cached yet - will compare after first merge to base'}</sub>`,
  ];

  const body = sections.join('\n');

  // --- Post or update sticky comment ---
  const { data: comments } = await github.rest.issues.listComments({
    ...context.repo,
    issue_number: context.issue.number,
  });
  const existing = comments.find((c) => c.body?.includes('<!-- test-performance-report -->'));

  if (existing) {
    await github.rest.issues.updateComment({ ...context.repo, comment_id: existing.id, body });
  } else {
    await github.rest.issues.createComment({ ...context.repo, issue_number: context.issue.number, body });
  }
};
