/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],

  plugins: [
    {
      rules: {
        /**
         * Enforce that the scope, when present, matches dev-NNN or meta-NNN.
         * No scope (e.g. `chore: bump deps`) is also valid.
         */
        'custom-scope': ({ scope }) => {
          if (!scope) return [true];
          const valid = /^(dev-\d+|meta-\d+)$/.test(scope);
          return [
            valid,
            'Scope must be dev-NNN or meta-NNN (e.g. dev-007, meta-002), or omitted entirely',
          ];
        },
      },
    },
  ],

  rules: {
    // Disable the built-in scope validators so our custom rule is the
    // sole authority on what scopes are acceptable.
    'scope-case': [0],
    'scope-enum': [0],
    'custom-scope': [2, 'always'],
  },
};
