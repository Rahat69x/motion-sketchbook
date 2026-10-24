# ResumeForge — Complete Full-Stack Placement Preparation Platform

> **Engineered for University Students, Internships, Aptitude Drives, and Campus Recruitment.**

ResumeForge is a production-grade full-stack web application built to streamline every phase of college campus placements. Rather than relying on disconnected tools or superficial mockups, ResumeForge delivers a unified workspace for crafting ATS-compliant resumes, auditing keyword gaps against job descriptions, mastering behavioral & technical mock interviews, and cracking aptitude tests.

---

## 🌟 Key Pillars & Features

### 1. 📄 Interactive Resume Builder
- **Multi-Resume Management**: Create, rename, duplicate, and delete specialized resumes for different roles (e.g. Frontend Engineer, Core SDE, Data Analyst).
- **Placement-Ready Sections**: Contact Details, Career Objective, Education with GPA, Categorized Technical Skills (Languages, Frameworks, Developer Tools, Core Concepts), Work & Internships, Projects with tech tags, Certifications, and Extracurricular Achievements.
- **Switchable Professional Templates**:
  - **Modern Tech**: Accent bars, pill badges, and clean hierarchy.
  - **Executive Classic**: Traditional academic serif with maximum readability.
  - **Minimalist Clean**: Ultra-dense monochrome layout optimized for high ATS parser score.
- **One-Click PDF Export**: Clean `@media print` styling preserving single-page or multi-page layouts cleanly without headers or background artifacts.

### 2. 🎯 Explainable ATS Compatibility Checker
- **Transparent Keyword Scoring**: Lexical analysis matching technical skills, frameworks, and domain concepts between resume and target job descriptions.
- **Preloaded Job Descriptions**: Includes preset templates for Top Tech SDE Internships, React Frontend Roles, and Data Analyst Drives.
- **Visual Breakdown**: Sub-scores for Keyword Density, Formatting Parseability, Section Completeness, and Action Verbs Quality.
- **Actionable Feedback**: Detects missing critical keywords, highlights vague phrases, flags missing contact details, and suggests bullet improvements.

### 3. 🧠 Interactive Mock Interview Module
- **Round Configurations**: HR Fit, Behavioral (STAR format), Technical / SDE, and System Design Architecture.
- **Difficulty & Length**: Easy, Medium, or Hard with customizable question counts.
- **Active Simulation**: Live timer, real-time word count, and question pagination.
- **Rubric & STAR Feedback**: Immediate evaluation identifying Situation, Task, Action, and Result components, alongside model ideal answers for post-round study.

### 4. 🧭 Placement Aptitude Drills
- **40+ Curated Questions**: Quantitative Aptitude, Logical Reasoning, Verbal Ability, and Data Interpretation.
- **Dual Modes**:
  - **Practice Mode**: Immediate feedback on option select, displaying correct answers and comprehensive mathematical step-by-step solutions.
  - **Timed Test Mode**: Exam pressure with countdown clock, question pagination, and final accuracy scorecard.
- **Server-Side Answer Protection**: Client question payloads strip answer keys and explanations until submission, preventing answer inspection in devtools.

### 5. 🔒 Authentication, Security & Data Isolation
- **Secure bcrypt Hashing**: All passwords securely hashed before storage.
- **Session Tokens**: JWT cookies with strict server-side authentication on private routes.
- **Strict Data Isolation**: Each student's resumes, interview feedback, and aptitude scores are privately scoped.
- **1-Click Student Demo**: Pre-populated with verified credentials (`student@resumeforge.edu` / `Placement2026!`) for rapid evaluation.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router with Turbopack)
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React
- **Backend**: Next.js Server Route Handlers (`src/app/api/...`)
- **Database**: Thread-safe persistent file-backed JSON/SQLite store (`data/resumeforge.json`) with atomic write buffers.
- **Security**: `bcryptjs` password hashing, `jsonwebtoken` session tokens.

---

## 🚀 Quickstart & Local Development

### Prerequisites
- Node.js 18+ or 20+ installed.

### 1. Installation
```bash
cd resumeforge
npm install --ignore-scripts
```

### 2. Environment Configuration
Copy `.env.example` to `.env.local` to customize settings:
```bash
cp .env.example .env.local
```
> **Security Note:** In `production` mode (`NODE_ENV=production`), `JWT_SECRET` must be set with at least 32 characters, otherwise the runtime throws an authorization configuration error to prevent insecure token signing. In `development`, a safe dev fallback is used.

### 3. Run Tests
```bash
npm test
```
*Executes all 22 automated integration tests verifying auth, security, ATS scoring, interview rubrics, and aptitude grading.*

### 3. Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Production Build
```bash
npm run build
npm start
```

---

## 👤 Preloaded Demo Account
For instant testing without filling registration forms:
- **Email**: `student@resumeforge.edu`
- **Password**: `Placement2026!`

*(A convenient "Click to Autofill Demo Student" button is also present directly on the `/login` screen).*
