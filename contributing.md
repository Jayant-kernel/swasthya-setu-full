# 🤝 Contributing to Swasth Setu

First off thank you for taking the time to contribute! Whether you're fixing a typo, reporting a bug, or building a new feature, every contribution helps make Swasth Setu better for everyone.

Please read this guide before opening issues or pull requests.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Setting Up the Dev Environment](#setting-up-the-dev-environment)
- [Branch Naming](#branch-naming)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Style Guidelines](#style-guidelines)

---

## 🧭 Code of Conduct

By participating in this project, you agree to be respectful, constructive, and welcoming to others. We follow the standard [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/) code of conduct.

---

## 💡 How Can I Contribute?

There are many ways to contribute:

- 🐛 **Report bugs** — Found something broken? Open an issue.
- ✨ **Request features** — Have an idea? Share it!
- 🔧 **Fix bugs** — Pick up an open issue labeled `good first issue` or `bug`.
- 📝 **Improve docs** — README, inline comments, JSDoc — all welcome.
- 🎨 **Improve UI/UX** — Accessibility, responsiveness, and visual polish matter.
- 🧪 **Write tests** — Help us improve coverage.

---

## 🛠 Setting Up the Dev Environment

1. **Fork** the repository and clone your fork:

```bash
git clone https://github.com/<your-username>/swasthya-setu-full.git
cd swasthya-setu-full
git submodule update --init --recursive
```

2. **Install dependencies:**

```bash
# Backend
cd swasthya-setu-backend
npm install

# Frontend (from root or frontend dir)
npm install

# Scaler (Python)
cd swasth-scaler
pip install -r requirements.txt
```

3. **Set up environment variables** — copy `.env.example` to `.env` in each service and fill in the values (see [README](README.md#environment-variables)).

4. **Start the dev servers:**

```bash
# Backend
npm run dev   # from swasthya-setu-backend/

# Frontend
npm run dev   # from root

# Scaler
python main.py  # from swasth-scaler/
```

---

## 🌿 Branch Naming

Use a clear, consistent naming convention:

| Type       | Pattern                        | Example                          |
|------------|-------------------------------|----------------------------------|
| Feature    | `feat/<short-description>`    | `feat/appointment-booking`       |
| Bug fix    | `fix/<short-description>`     | `fix/login-redirect-loop`        |
| Docs       | `docs/<short-description>`    | `docs/update-api-readme`         |
| Refactor   | `refactor/<short-description>`| `refactor/auth-middleware`       |
| Tests      | `test/<short-description>`    | `test/patient-api-coverage`      |
| Chore      | `chore/<short-description>`   | `chore/update-dependencies`      |

Always branch off from `main`:

```bash
git checkout main
git pull origin main
git checkout -b feat/your-feature-name
```

---

## ✍️ Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) standard:

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples:**

```
feat(auth): add JWT refresh token support
fix(ui): resolve broken layout on mobile dashboard
docs(readme): add environment variable section
```

Keep the subject line under 72 characters. Use the body to explain *why*, not *what*.

---

## 🔄 Pull Request Process

1. Ensure your branch is up to date with `main` before opening a PR:

```bash
git fetch origin
git rebase origin/main
```

2. Open your PR against the `main` branch.

3. Fill out the PR template fully:
   - What does this PR do?
   - How to test it?
   - Screenshots (if UI change)
   - Related issue (e.g., `Closes #42`)

4. Your PR will be reviewed by a maintainer. Address any requested changes promptly.

5. Once approved, it will be merged by a maintainer — please don't merge your own PRs.

---

## 🐛 Reporting Bugs

Open an [issue](https://github.com/Jayant-kernel/swasthya-setu-full/issues/new) and include:

- A clear, descriptive title
- Steps to reproduce the bug
- Expected vs. actual behavior
- Screenshots or error logs if available
- Your OS, browser, and Node/Python version

---

## 🚀 Suggesting Features

Open an [issue](https://github.com/Jayant-kernel/swasthya-setu-full/issues/new) with:

- A clear description of the feature
- The problem it solves
- Any ideas for implementation
- Mockups or examples if applicable

Label your issue `enhancement` so it's easy to find.

---

## 🎨 Style Guidelines

### JavaScript / React

- Use functional components and React hooks
- Follow [Airbnb JavaScript Style Guide](https://airbnb.io/javascript/react/) as a reference
- Use `const`/`let`, avoid `var`
- Keep components small and focused (single responsibility)
- Name components in `PascalCase`, files in `kebab-case`

### Python (Scaler)

- Follow [PEP 8](https://peps.python.org/pep-0008/)
- Use type hints where possible
- Write docstrings for all public functions

### CSS

- Use scoped styles or CSS modules to avoid conflicts
- Prefer flexbox/grid over hacks
- Mobile-first responsive design

---

## ❓ Questions?

If you're stuck or have questions, open a [Discussion](https://github.com/Jayant-kernel/swasthya-setu-full/discussions) or drop a comment on the relevant issue. We're happy to help!

Happy contributing! 🩺
