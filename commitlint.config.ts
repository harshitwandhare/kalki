import type { UserConfig } from "@commitlint/types";

const config: UserConfig = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // new feature
        "fix", // bug fix
        "docs", // documentation
        "style", // formatting (no logic change)
        "refactor", // code restructure
        "perf", // performance improvement
        "test", // tests
        "chore", // build/tooling/deps
        "revert", // revert commit
        "ci", // CI/CD changes
        "agent", // AI agent changes
        "pipeline", // video pipeline changes
      ],
    ],
    "subject-max-length": [2, "always", 100],
    "body-max-line-length": [2, "always", 200],
  },
};

export default config;
