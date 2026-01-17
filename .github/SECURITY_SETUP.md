# Security Scanning Setup Guide

This repository includes comprehensive security scanning using Snyk and GitHub CodeQL.

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

## Viewing Results

### Security Tab
1. Navigate to your repository on GitHub
2. Click on the **Security** tab
3. View:
   - Dependency vulnerabilities (from Snyk)
   - CodeQL alerts (from SAST analysis)
   - License compliance issues

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

### License Compliance Warnings
- Review the license report in the workflow summary
- Update `snyk-policy` file if you need to allow specific licenses
- Contact your legal team for license approval

## Additional Resources

- [Snyk Documentation](https://docs.snyk.io)
- [GitHub CodeQL Documentation](https://docs.github.com/en/code-security/code-scanning/automatically-scanning-your-code-for-vulnerabilities-and-errors)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
