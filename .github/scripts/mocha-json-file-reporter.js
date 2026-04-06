// Mocha reporter that writes JSON results to a file.
// NestJS logs go to stdout and pollute the built-in json reporter's output,
// so we capture results via the runner API and write directly to a file.

const fs = require('fs');
const path = require('path');
const Mocha = require('mocha');
const { EVENT_RUN_END, EVENT_TEST_PASS, EVENT_TEST_FAIL, EVENT_TEST_PENDING } = Mocha.Runner.constants;

class JsonFileReporter extends Mocha.reporters.Base {
  constructor(runner, options) {
    super(runner, options);

    const outputFile = (options.reporterOptions && options.reporterOptions.output) || 'test-results.json';
    const passes = [];
    const failures = [];
    const pending = [];

    runner.on(EVENT_TEST_PASS, (test) => passes.push(this._clean(test)));
    runner.on(EVENT_TEST_FAIL, (test, err) => passes.push(this._clean(test, err)));
    runner.on(EVENT_TEST_PENDING, (test) => pending.push(this._clean(test)));

    runner.once(EVENT_RUN_END, () => {
      const result = {
        stats: runner.stats,
        passes,
        failures,
        pending,
      };
      fs.mkdirSync(path.dirname(path.resolve(outputFile)), { recursive: true });
      fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
    });
  }

  _clean(test, err) {
    return {
      title: test.title,
      fullTitle: test.fullTitle(),
      file: test.file,
      duration: test.duration || 0,
      ...(err && { err: { message: err.message, stack: err.stack } }),
    };
  }
}

module.exports = JsonFileReporter;
