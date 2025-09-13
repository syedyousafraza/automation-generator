// server.js
import express from "express";
import fs from "fs";
import path from "path";

const app = express();
app.use(express.json());

// Utility to create dirs recursively
function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

// Main generator endpoint
app.post("/generate-framework", async (req, res) => {
  const { baseUrl, username, password, env = "dev" } = req.body;
  const projectDir = path.join(process.cwd(), "generated-project");

  // Clean old project if exists
  fs.rmSync(projectDir, { recursive: true, force: true });
  ensureDir(projectDir);

  // --- package.json ---
  fs.writeFileSync(
    path.join(projectDir, "package.json"),
    JSON.stringify(
      {
        name: "playwright-framework",
        version: "1.0.0",
        scripts: {
          test: "npx playwright test --reporter=line,html",
          report: "npx playwright show-report",
        },
        dependencies: {
          "@playwright/test": "^1.47.2"
        },
        devDependencies: {
          eslint: "^9.0.0"
        }
      },
      null,
      2
    )
  );

  // --- playwright.config.js ---
  fs.writeFileSync(
    path.join(projectDir, "playwright.config.js"),
    `
    import { defineConfig } from '@playwright/test';
    import * as fs from 'fs';

    const env = process.env.ENV || '${env}';
    const config = JSON.parse(fs.readFileSync(\`./config/\${env}.json\`));

    export default defineConfig({
      use: {
        baseURL: config.baseUrl,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'on-first-retry',
      },
      reporter: [['line'], ['html']]
    });
    `
  );

  // --- Configs per env ---
  ensureDir(path.join(projectDir, "config"));
  const envConfig = { baseUrl, username, password };
  ["dev", "qa", "staging", "prod"].forEach((e) =>
    fs.writeFileSync(
      path.join(projectDir, `config/${e}.json`),
      JSON.stringify(envConfig, null, 2)
    )
  );

  // --- Pages ---
  ensureDir(path.join(projectDir, "pages"));
  fs.writeFileSync(
    path.join(projectDir, "pages/BasePage.js"),
    `
    export default class BasePage {
      constructor(page) {
        this.page = page;
      }
      async navigate(url) {
        await this.page.goto(url);
      }
    }
    `
  );

  if (username && password) {
    fs.writeFileSync(
      path.join(projectDir, "pages/LoginPage.js"),
      `
      import BasePage from './BasePage.js';

      export default class LoginPage extends BasePage {
        constructor(page) {
          super(page);
          this.usernameField = 'input[name="username"], input[type="email"]';
          this.passwordField = 'input[type="password"]';
          this.loginButton = 'button[type="submit"], input[type="submit"]';
        }

        async login(username, password) {
          await this.page.fill(this.usernameField, username);
          await this.page.fill(this.passwordField, password);
          await this.page.click(this.loginButton);
        }
      }
      `
    );
  }

  fs.writeFileSync(
    path.join(projectDir, "pages/HomePage.js"),
    `
    import BasePage from './BasePage.js';
    export default class HomePage extends BasePage {
      constructor(page) {
        super(page);
        this.header = 'h1, header';
      }
      async isLoaded() {
        return this.page.isVisible(this.header);
      }
    }
    `
  );

  // --- Tests ---
  ensureDir(path.join(projectDir, "tests"));
  if (username && password) {
    fs.writeFileSync(
      path.join(projectDir, "tests/login.test.js"),
      `
      import { test, expect } from '@playwright/test';
      import LoginPage from '../pages/LoginPage.js';
      import fs from 'fs';

      const env = process.env.ENV || '${env}';
      const config = JSON.parse(fs.readFileSync(\`./config/\${env}.json\`));

      test('User can log in', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.navigate(config.baseUrl);
        await loginPage.login(config.username, config.password);
        await expect(page).toHaveURL(/dashboard|home/);
      });
      `
    );
  }

  fs.writeFileSync(
    path.join(projectDir, "tests/home.test.js"),
    `
    import { test, expect } from '@playwright/test';
    import HomePage from '../pages/HomePage.js';
    import fs from 'fs';

    const env = process.env.ENV || '${env}';
    const config = JSON.parse(fs.readFileSync(\`./config/\${env}.json\`));

    test('Home page loads', async ({ page }) => {
      const home = new HomePage(page);
      await home.navigate(config.baseUrl);
      expect(await home.isLoaded()).toBeTruthy();
    });
    `
  );

  // --- Utils ---
  ensureDir(path.join(projectDir, "utils"));
  fs.writeFileSync(
    path.join(projectDir, "utils/waitHelper.js"),
    `export async function wait(seconds) { return new Promise(r => setTimeout(r, seconds*1000)); }`
  );
  fs.writeFileSync(
    path.join(projectDir, "utils/assertHelper.js"),
    `import { expect } from '@playwright/test'; export function assertVisible(locator) { expect(locator).toBeVisible(); }`
  );
  fs.writeFileSync(
    path.join(projectDir, "utils/logger.js"),
    `export function log(message) { console.log(\`[LOG] \${new Date().toISOString()} - \${message}\`); }`
  );
  fs.writeFileSync(
    path.join(projectDir, "utils/dataHelper.js"),
    `import data from './testData.json' assert { type: 'json' }; export function getData(key) { return data[key]; }`
  );
  fs.writeFileSync(
    path.join(projectDir, "utils/testData.json"),
    JSON.stringify({ sampleUser: { username: "demo", password: "demo" } }, null, 2)
  );

  // --- GitHub Actions workflow ---
  ensureDir(path.join(projectDir, ".github/workflows"));
  fs.writeFileSync(
    path.join(projectDir, ".github/workflows/playwright.yml"),
    `
    name: Playwright Tests
    on: [push, pull_request]
    jobs:
      test:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v3
          - uses: actions/setup-node@v3
            with:
              node-version: 18
          - run: npm install
          - run: npx playwright install --with-deps
          - run: npx playwright test
    `
  );

  // --- README.md ---
  fs.writeFileSync(
    path.join(projectDir, "README.md"),
    `
    # Playwright Test Framework

    ## 🚀 Getting Started
    \`\`\`bash
    npm install
    npx playwright install
    npx playwright test
    \`\`\`

    ## 🌍 Running Against Different Envs
    \`\`\`bash
    ENV=qa npx playwright test
    \`\`\`

    ## 📊 Reports
    \`\`\`bash
    npm run report
    \`\`\`

    ## ⚡ CI/CD
    Already configured with GitHub Actions.
    `
  );

  res.json({ message: "Framework generated successfully", path: projectDir });
});

app.listen(4000, () => console.log("API running on http://localhost:4000"));
