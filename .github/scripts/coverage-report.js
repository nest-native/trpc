// Posts a coverage comparison comment on PRs.
// Called from ci.yml via actions/github-script.

module.exports = async ({ github, context, core }) => {
  const fs = require('fs');

  const current = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'));
  const hasBase = fs.existsSync('base-coverage-summary.json');
  const base = hasBase ? JSON.parse(fs.readFileSync('base-coverage-summary.json', 'utf8')) : null;
  const changedFiles = fs.readFileSync('changed-files.txt', 'utf8').trim().split('\n').filter(Boolean);

  // --- Helpers ---
  const bar = (pct) => {
    const filled = Math.round(pct / 5);
    return '\u2588'.repeat(filled) + '\u2591'.repeat(20 - filled);
  };

  const fmt = (m) => `\`${m.covered}/${m.total}\` (${m.pct}%)`;

  const diffStr = (curr, prev) => {
    const diff = (curr - prev).toFixed(2);
    if (diff > 0) return `+${diff}%`;
    if (diff < 0) return `${diff}%`;
    return `0%`;
  };

  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  // --- Badge ---
  const overallPct = current.total.statements.pct;
  const badgeColor = overallPct >= 80 ? 'brightgreen' : overallPct >= 60 ? 'yellow' : 'red';
  const badge = `![Coverage](https://img.shields.io/badge/coverage-${overallPct}%25-${badgeColor})`;

  // --- Overall table ---
  const metrics = ['statements', 'branches', 'functions', 'lines'];

  const totalRows = metrics.map((m) => {
    const curr = current.total[m];
    const barStr = `\`${bar(curr.pct)}\``;
    if (base) {
      const prev = base.total[m];
      return `| ${capitalize(m)} | ${barStr} | ${fmt(curr)} | ${fmt(prev)} | ${diffStr(curr.pct, prev.pct)} |`;
    }
    return `| ${capitalize(m)} | ${barStr} | ${fmt(curr)} | - | - |`;
  });

  // --- Changed files table ---
  const fileRows = [];
  for (const file of changedFiles) {
    const absKey = Object.keys(current).find((k) => k !== 'total' && k.endsWith(file));
    if (!absKey) continue;
    const curr = current[absKey];
    const baseFile = base ? Object.keys(base).find((k) => k !== 'total' && k.endsWith(file)) : null;
    const prev = baseFile ? base[baseFile] : null;

    const stmtBar = `\`${bar(curr.statements.pct)}\``;
    const diff = prev ? diffStr(curr.statements.pct, prev.statements.pct) : 'new';
    const shortName = file.replace(/^packages\//, '');

    fileRows.push(
      `| \`${shortName}\` | ${stmtBar} | ${fmt(curr.statements)} | ${fmt(curr.branches)} | ${diff} |`,
    );
  }

  // --- Build comment body ---
  const sections = [
    '<!-- coverage-report -->',
    `## ${badge} Coverage Report`,
    '',
    '| Metric | | PR | Base | Diff |',
    '|--------|---|-----|------|------|',
    ...totalRows,
  ];

  if (fileRows.length > 0) {
    sections.push(
      '',
      '<details>',
      '<summary><strong>Changed files</strong></summary>',
      '',
      '| File | | Statements | Branches | Diff |',
      '|------|---|------------|----------|------|',
      ...fileRows,
      '',
      '</details>',
    );
  }

  sections.push(
    '',
    '---',
    `<sub>Updated for [\`${context.sha.slice(0, 7)}\`](${context.payload.repository.html_url}/commit/${context.sha}) | ${base ? 'Compared against base branch' : 'No base coverage cached yet - will compare after first merge to base'}</sub>`,
  );
  const body = sections.join('\n');

  // --- Post or update sticky comment ---
  const { data: comments } = await github.rest.issues.listComments({
    ...context.repo,
    issue_number: context.issue.number,
  });
  const existing = comments.find((c) => c.body?.includes('<!-- coverage-report -->'));

  if (existing) {
    await github.rest.issues.updateComment({ ...context.repo, comment_id: existing.id, body });
  } else {
    await github.rest.issues.createComment({ ...context.repo, issue_number: context.issue.number, body });
  }

  // --- Fail if any metric dropped ---
  if (base) {
    const dropped = metrics.filter((m) => current.total[m].pct < base.total[m].pct);
    if (dropped.length > 0) {
      core.setFailed(`Coverage dropped in: ${dropped.join(', ')}`);
    }
  }
};
