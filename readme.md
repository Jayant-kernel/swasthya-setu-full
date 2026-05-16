# 🩺 Swasth Setu — Bridge to Health

> Swasth Setu ("Bridge to Health") is a full-stack healthcare platform built to connect patients and health services, making healthcare more accessible and manageable for everyone.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?logo=vercel)](https://swasthya-setu-full.vercel.app)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Issues](https://img.shields.io/github/issues/Jayant-kernel/swasthya-setu-full)](https://github.com/Jayant-kernel/swasthya-setu-full/issues)

---

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running the App](#running-the-app)
- [Contributing](#contributing)
- [License](#license)

---

## About

Swasth Setu is a full-stack health platform with a **React/JavaScript frontend**, a **Node.js backend**, and a **Python-based scaler service**. It aims to bridge the gap between patients and healthcare resources by providing easy access to health services, information, and tools — all in one place.

---

## ✨ Features

- 🏥 Healthcare service discovery and management
- 👤 Patient-facing dashboard
- 🔗 RESTful backend API for data and service coordination
- 📊 Scaler service for analytics/data processing (Python)
- 🌐 Deployed on Vercel for fast, global access

---

## 🛠 Tech Stack

| Layer        | Technology                     |
|--------------|-------------------------------|
| Frontend     | JavaScript (React), CSS, HTML  |
| Backend      | Node.js                        |
| Data/Scaler  | Python                         |
| Deployment   | Vercel                         |
| Version Ctrl | Git & GitHub                   |

---

## 📁 Project Structure

```
swasthya-setu-full/
├── swasth-scaler/           # Python-based data scaler/analytics service
├── swasthya-setu-backend    # Node.js backend API (submodule or linked repo)
└── .gitignore
```

> **Note:** The backend (`swasthya-setu-backend`) may be linked as a Git submodule. Run `git submodule update --init --recursive` after cloning if needed.

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Python](https://www.python.org/) (3.9+ for the scaler service)
- [Git](https://git-scm.com/)

### Clone the Repository

```bash
git clone https://github.com/Jayant-kernel/swasthya-setu-full.git
cd swasthya-setu-full

# If the backend is a submodule:
git submodule update --init --recursive
```

---

## 🔑 Environment Variables

Create a `.env` file in both the backend and scaler directories. Example:

**Backend (`swasthya-setu-backend/.env`)**
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

**Scaler (`swasth-scaler/.env`)**
```env
API_BASE_URL=http://localhost:5000
```

> Copy `.env.example` if available, or ask the maintainer for the required keys.

---

## ▶️ Running the App

### Backend

```bash
cd swasthya-setu-backend
npm install
npm run dev
```

### Scaler (Python service)

```bash
cd swasth-scaler
pip install -r requirements.txt
python main.py
```

### Frontend

```bash
# From the root or the frontend directory
npm install
npm run dev
```

The app should now be running at `http://localhost:3000` (frontend) and `http://localhost:5000` (backend).

---

## 🤝 Contributing

We welcome contributions of all kinds — bug fixes, new features, documentation improvements, and more!

Please read our [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 🙏 Acknowledgements

- Inspired by the need for accessible digital healthcare in India
- Built with ❤️ by [Jayant Kumar](https://github.com/Jayant-kernel) and contributors
