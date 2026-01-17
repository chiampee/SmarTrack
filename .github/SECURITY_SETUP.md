# Security Scanning Setup Guide

This repository includes comprehensive security scanning using Snyk, GitHub CodeQL, SonarCloud, and GitGuardian.

## Required GitHub Secrets

To enable security scanning, you need to configure the following secrets in your GitHub repository:

### 1. SNYK_TOKEN (Required)

**Purpose**: Authenticates with Snyk for dependency vulnerability scanning and license compliance.

**How to obtain**:
1. Sign up for a free account at [https://snyk.io](https://snyk.io)
2. Navigate to your account settings
3. Go to "API Token" section
4. Copy your API token

**How to add to GitHub**:
1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `SNYK_TOKEN`
5. Value: Paste your Snyk API token
6. Click **Add secret**

### 2. DOCKER_USERNAME (Optional)

**Purpose**: Used for Docker image scanning if you have Dockerfiles in your repository.

**When needed**: Only required if you have Dockerfiles and want to scan container images.

**How to add**: Same process as above, name it `DOCKER_USERNAME`

### 3. DOCKER_PASSWORD (Optional)

**Purpose**: Used alongside DOCKER_USERNAME for Docker image scanning.

**When needed**: Only required if you have Dockerfiles and want to scan container images.

**How to add**: Same process as above, name it `DOCKER_PASSWORD`

### 4. SONAR_TOKEN (Required for SonarCloud)

**Purpose**: Authenticates with SonarCloud for code quality analysis, security hotspots, code smells, and bugs.

**How to obtain**:
1. Sign up for a free account at [https://sonarcloud.io](https://sonarcloud.io) (free for public repos)
2. Log in with your GitHub account (recommended)
3. Navigate to **My Account** → **Security** → **Generate Token**
4. Give it a name (e.g., "GitHub Actions")
5. Copy the token immediately (you won't be able to see it again)

**How to add to GitHub**:
1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `SONAR_TOKEN`
5. Value: Paste your SonarCloud token
6. Click **Add secret**

**Note**: After adding the token, you'll also need to:
1. Go to [SonarCloud](https://sonarcloud.io)
2. Import your GitHub repository
3. Update `sonar-project.properties` with your organization key if different from `chiampee`

### 5. GITGUARDIAN_API_KEY (Required for GitGuardian)

**Purpose**: Authenticates with GitGuardian for secret scanning in code and git history.

**How to obtain**:
1. Sign up for a free account at [https://dashboard.gitguardian.com](https://dashboard.gitguardian.com)
2. Log in with your GitHub account (recommended)
3. Navigate to **Settings** → **API** → **Create API Key**
4. Give it a name (e.g., "GitHub Actions")
5. Copy the API key immediately (you won't be able to see it again)

**How to add to GitHub**:
1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `GITGUARDIAN_API_KEY`
5. Value: Paste your GitGuardian API key
6. Click **Add secret**

**Local Setup (for pre-commit hooks)**:
1. Install GitGuardian CLI:
   ```bash
   # Using pipx (recommended)
   pipx install ggshield
   
   # Or using pip
   pip install ggshield
   ```
2. Authenticate locally (optional, for better integration):
   ```bash
   ggshield auth login
   ```

## Workflows

### Security Scanning (`security.yml`)

This workflow runs:
- **NPM Dependency Scanning**: Scans `package.json` and `package-lock.json` for vulnerabilities
- **Python Dependency Scanning**: Scans `backend/requirements.txt` for vulnerabilities
- **License Compliance**: Checks for license violations in both npm and Python dependencies
- **Docker Image Scanning**: Automatically detects and scans Dockerfiles (if present)

**Triggers**:
- Push to `main`, `master`, or `develop` branches
- Pull requests to `main`, `master`, or `develop` branches
- Weekly schedule (Mondays at 00:00 UTC)
- Manual trigger via workflow_dispatch

### CodeQL SAST Analysis (`codeql.yml`)

This workflow runs:
- **JavaScript/TypeScript SAST**: Static analysis for security vulnerabilities in JS/TS code
- **Python SAST**: Static analysis for security vulnerabilities in Python code

**Triggers**:
- Push to `main`, `master`, or `develop` branches
- Pull requests to `main`, `master`, or `develop` branches
- Weekly schedule (Mondays at 01:00 UTC)
- Manual trigger via workflow_dispatch

### SonarCloud Code Quality Analysis (`sonarcloud.yml`)

This workflow runs:
- **Code Quality Analysis**: Detects code smells, bugs, and technical debt
- **Security Hotspots**: Identifies security-sensitive code that needs review
- **Coverage Tracking**: Tracks test coverage (if coverage reports are generated)
- **Duplication Detection**: Finds duplicated code blocks
- **Maintainability Rating**: Provides maintainability ratings for your code

**Triggers**:
- Push to `main`, `master`, or `develop` branches
- Pull requests to `main`, `master`, or `develop` branches
- Manual trigger via workflow_dispatch

**Languages Analyzed**:
- TypeScript/JavaScript (frontend)
- Python (backend)

### GitGuardian Secret Scanning (`gitguardian.yml`)

This workflow runs:
- **Secret Detection**: Scans code for exposed secrets, API keys, passwords, tokens
- **Git History Scanning**: Scans entire git history for previously committed secrets
- **Real-time Protection**: Prevents secrets from being committed via pre-commit hooks
- **Comprehensive Coverage**: Scans all file types including code, config files, and documentation

**Triggers**:
- Push to `main`, `master`, or `develop` branches
- Pull requests to `main`, `master`, or `develop` branches
- Daily schedule (02:00 UTC)
- Manual trigger via workflow_dispatch

**Pre-commit Protection**:
- Automatically scans staged files before each commit
- Blocks commits containing secrets
- Integrated with Husky git hooks

## Pre-commit Hooks

### GitGuardian Secret Scanning

The repository includes a pre-commit hook that scans for secrets before each commit:

**How it works**:
1. When you run `git commit`, the hook automatically runs
2. GitGuardian scans all staged files for secrets
3. If secrets are found, the commit is blocked
4. You'll see a detailed report of what was found

**Installation** (if not already installed):
```bash
# Install GitGuardian CLI
pipx install ggshield

# Or with pip
pip install ggshield
```

**Manual scan** (if you want to scan without committing):
```bash
# Scan all files
ggshield secret scan path .

# Scan specific file
ggshield secret scan path src/config.ts

# Scan git history
ggshield secret scan commit-range HEAD~10..HEAD
```

## Viewing Results

### Security Tab
1. Navigate to your repository on GitHub
2. Click on the **Security** tab
3. View:
   - Dependency vulnerabilities (from Snyk)
   - CodeQL alerts (from SAST analysis)
   - License compliance issues

### SonarCloud Dashboard
1. Go to [https://sonarcloud.io](https://sonarcloud.io)
2. Log in with your GitHub account
3. Select your project (SmarTrack)
4. View:
   - Code quality metrics and ratings
   - Security hotspots
   - Code smells and bugs
   - Test coverage (if configured)
   - Technical debt
   - Duplication percentage

### GitGuardian Dashboard
1. Go to [https://dashboard.gitguardian.com](https://dashboard.gitguardian.com)
2. Log in with your GitHub account
3. Select your repository
4. View:
   - Detected secrets and their locations
   - Secret exposure incidents
   - Historical scans
   - Remediation recommendations
   - Real-time alerts

### Workflow Runs
1. Navigate to your repository on GitHub
2. Click on the **Actions** tab
3. Select the workflow run to see detailed logs and results

## Severity Thresholds

The workflows are configured to:
- **Fail on**: High severity vulnerabilities
- **Report**: All severity levels (low, medium, high, critical)
- **Upgradable**: Fail if vulnerabilities can be fixed by upgrading packages

## Customization

### Adjusting Severity Thresholds

Edit `.github/workflows/security.yml` and modify the `--severity-threshold` parameter:
- `low`: Report all vulnerabilities
- `medium`: Report medium, high, and critical
- `high`: Report high and critical (current setting)
- `critical`: Report only critical vulnerabilities

### Changing Scan Frequency

Edit the `schedule` section in both workflow files:
```yaml
schedule:
  - cron: '0 0 * * 1'  # Every Monday at 00:00 UTC
```

Use [crontab.guru](https://crontab.guru) to generate custom schedules.

### Adding More Languages

To add SAST scanning for additional languages, edit `.github/workflows/codeql.yml`:
1. Add the language to the `matrix.language` array
2. Add setup steps for that language in the workflow

## Troubleshooting

### Snyk Token Issues
- Ensure `SNYK_TOKEN` is correctly set in repository secrets
- Verify the token is valid and not expired
- Check Snyk account for any usage limits

### CodeQL Issues
- CodeQL is free and doesn't require additional setup
- Ensure the repository has Actions enabled
- Check that the code is properly checked out in the workflow

### SonarCloud Issues
- Ensure `SONAR_TOKEN` is correctly set in repository secrets
- Verify the repository is imported in SonarCloud
- Check that `sonar-project.properties` has the correct `sonar.projectKey` and `sonar.organization`
- For public repos, SonarCloud is free; private repos may require a paid plan

### GitGuardian Issues
- Ensure `GITGUARDIAN_API_KEY` is correctly set in repository secrets
- Verify the repository is connected in GitGuardian dashboard
- For pre-commit hooks: Install `ggshield` CLI locally (`pipx install ggshield`)
- If pre-commit hook fails, you can bypass with `git commit --no-verify` (not recommended)
- Check `.gitguardian.yaml` for configuration options

### License Compliance Warnings
- Review the license report in the workflow summary
- Update `snyk-policy` file if you need to allow specific licenses
- Contact your legal team for license approval

## Additional Resources

- [Snyk Documentation](https://docs.snyk.io)
- [GitHub CodeQL Documentation](https://docs.github.com/en/code-security/code-scanning/automatically-scanning-your-code-for-vulnerabilities-and-errors)
- [SonarCloud Documentation](https://docs.sonarcloud.io)
- [GitGuardian Documentation](https://docs.gitguardian.com)
- [GitGuardian CLI (ggshield) Documentation](https://docs.gitguardian.com/internal-monitoring/integrations/cli)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## Coverage Tracking Setup (Optional)

To enable coverage tracking in SonarCloud:

### Frontend (TypeScript/JavaScript)
1. Install coverage tool: `npm install -D @vitest/coverage-v8` or `jest --coverage`
2. Run tests with coverage: `npm test -- --coverage`
3. Coverage report will be automatically picked up by SonarCloud

### Backend (Python)
1. Install pytest-cov: `pip install pytest-cov`
2. Run tests with coverage: `pytest --cov=. --cov-report=xml`
3. Coverage report will be automatically picked up by SonarCloud

The `sonar-project.properties` file is already configured to look for coverage reports in the standard locations.
