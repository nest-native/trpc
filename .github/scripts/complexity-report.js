// Posts a cognitive complexity comparison comment on PRs.
// Called from ci.yml via actions/github-script.

module.exports = async ({ github, context, core }) => {
  const fs = require('fs');

  const current = JSON.parse(
    fs.readFileSync('complexity/cognitive-complexity-summary.json', 'utf8'),
  );
  const hasBase = fs.existsSync('base-cognitive-complexity-summary.json');
  const base = hasBase
    ? JSON.parse(
        fs.readFileSync('base-cognitive-complexity-summary.json', 'utf8'),
      )
    : null;
  const changedFiles = fs
    .readFileSync('changed-files.txt', 'utf8')
    .trim()
    .split('\n')
    .filter(Boolean);

  const baseByFile = new Map((base?.files ?? []).map(file => [file.file, file]));
  const currentByFile = new Map(current.files.map(file => [file.file, file]));

  const formatDiff = (currentValue, baseValue, { higherIsBad }) => {
    if (baseValue == null) {
      return '🆕 new';
    }
    const diff = currentValue - baseValue;
    if (diff > 0) {
      return `${higherIsBad ? '🔴' : '⚪'} +${diff}`;
    }
    if (diff < 0) {
      return `${higherIsBad ? '🟢' : '⚪'} ${diff}`;
    }
    return '⚪ 0';
  };
  const complexityDiff = (currentValue, baseValue) =>
    formatDiff(currentValue, baseValue, { higherIsBad: true });
  const neutralDiff = (currentValue, baseValue) =>
    formatDiff(currentValue, baseValue, { higherIsBad: false });

  const status = value => {
    if (value >= 25) {
      return '🔴 High';
    }
    if (value >= 15) {
      return '🟡 Watch';
    }
    return '🟢 OK';
  };

  const topEntries = current.entries.slice(0, 10).map(entry => {
    return `| \`${entry.symbol ?? '(unknown function)'}\` | \`${entry.file}:${entry.line}\` | ${entry.complexity} | ${status(entry.complexity)} |`;
  });

  const changedRows = [];
  for (const file of changedFiles) {
    const currentFile = currentByFile.get(file);
    const baseFile = baseByFile.get(file);
    if (!currentFile && !baseFile) {
      continue;
    }

    changedRows.push(
      `| \`${file.replace(/^packages\//, '')}\` | ${currentFile?.totalComplexity ?? 0} | ${currentFile?.maxComplexity ?? 0} | ${currentFile?.functionCount ?? 0} | ${complexityDiff(currentFile?.totalComplexity ?? 0, baseFile?.totalComplexity)} |`,
    );
  }

  const baseTotal = base?.totals.totalComplexity;
  const baseMax = base?.totals.maxComplexity;
  const sections = [
    '<!-- cognitive-complexity-report -->',
    '## 🧠 Cognitive Complexity Report',
    '',
    '| Metric | PR | Base | Diff |',
    '| --- | ---: | ---: | ---: |',
    `| Total complexity | ${current.totals.totalComplexity} | ${baseTotal ?? '-'} | ${complexityDiff(current.totals.totalComplexity, baseTotal)} |`,
    `| Max function complexity | ${current.totals.maxComplexity} | ${baseMax ?? '-'} | ${complexityDiff(current.totals.maxComplexity, baseMax)} |`,
    `| Functions measured | ${current.totals.functions} | ${base?.totals.functions ?? '-'} | ${neutralDiff(current.totals.functions, base?.totals.functions)} |`,
    '',
    '<details>',
    '<summary><strong>🧩 Most complex functions</strong></summary>',
    '',
    '| Function | Location | Complexity | Status |',
    '| --- | --- | ---: | --- |',
    ...(topEntries.length > 0 ? topEntries : ['| - | - | 0 | 🟢 OK |']),
    '',
    '</details>',
  ];

  if (changedRows.length > 0) {
    sections.push(
      '',
      '<details>',
      '<summary><strong>🧾 Changed files</strong></summary>',
      '',
      '| File | Total | Max | Functions | Total diff |',
      '| --- | ---: | ---: | ---: | ---: |',
      ...changedRows,
      '',
      '</details>',
    );
  }

  sections.push(
    '',
    '> 🧭 Cognitive complexity is reported as a review signal, not a merge gate. Prefer small, intention-revealing refactors when complexity rises.',
    '',
    '---',
    `<sub>Updated for [\`${context.sha.slice(0, 7)}\`](${context.payload.repository.html_url}/commit/${context.sha}) | ${hasBase ? 'Compared against base branch' : 'No base complexity cached yet - will compare after first merge to base'}</sub>`,
  );

  const body = sections.join('\n');

  const { data: comments } = await github.rest.issues.listComments({
    ...context.repo,
    issue_number: context.issue.number,
  });
  const existing = comments.find(comment =>
    comment.body?.includes('<!-- cognitive-complexity-report -->'),
  );

  if (existing) {
    await github.rest.issues.updateComment({
      ...context.repo,
      comment_id: existing.id,
      body,
    });
  } else {
    await github.rest.issues.createComment({
      ...context.repo,
      issue_number: context.issue.number,
      body,
    });
  }
};
