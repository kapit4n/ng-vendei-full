// This file is required by karma.conf.js and loads recursively all the .spec and framework files

// Initialises the Angular testing environment (also used by the scoped entry
// that `scripts/test-scoped.mjs` generates).
import './test.setup';

// Then we find all the tests.
const context = (import.meta as any).webpackContext('./', {
  recursive: true,
  regExp: /\.spec\.ts$/
});
context.keys().forEach(context);
