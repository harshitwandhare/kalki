import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/generated/**", // Prisma generated code
    "src/components/ui/**", // Shadcn generated components
  ]),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "react-hooks/purity": "off",
      // Fetch-on-mount and matchMedia subscriptions legitimately set state in effects.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
