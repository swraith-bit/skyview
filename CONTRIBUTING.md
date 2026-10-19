# Contributing to SkyView Moon & Space Tracker

Thank you for your interest in contributing to SkyView! We welcome contributions from the astronomy, open source, and developer communities.

---

## Code of Conduct

Please be respectful, collaborative, and constructive when opening issues, pull requests, and participating in discussions.

---

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (version 20 or higher)
- [npm](https://www.npmjs.com/) (version 9 or higher)
- [Android Studio](https://developer.android.com/studio) (for Android native builds)
- A modern web browser with WebGL support

### Getting Started

1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/<your-username>/skyview.git
   cd skyview
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Add your NASA API key (from [api.nasa.gov](https://api.nasa.gov/)) to `.env` if you want to test APOD requests beyond the public demo quota.

4. **Start the local development server:**
   ```bash
   npm run dev
   ```

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite development server with hot module replacement |
| `npm run build` | Builds the production bundle to `dist/` |
| `npm run preview` | Locally previews the production build |
| `npm run lint` | Runs ESLint and TypeScript type checking (`tsc --noEmit`) |
| `npm run test` | Runs the Vitest unit & integration test suite |
| `npm run clean` | Cleans build output directories |

---

## Android Workflow

1. Build the web distribution:
   ```bash
   npm run build
   ```

2. Sync web assets and plugins to the native Android platform:
   ```bash
   npx cap sync android
   ```

3. Open the Android project:
   ```bash
   npx cap open android
   ```
   Or open the `android/` directory directly in Android Studio.

---

## Coding Guidelines

- **TypeScript:** Strict mode is enforced. Avoid using `any`; define explicit types and schemas.
- **Components:** Modular, functional components using React hooks and Zustand stores.
- **Styling:** Tailwind CSS with responsive, dark-mode first design and accessible scotopic red-light support.
- **Validation:** Use Zod schemas for all external API responses (NASA, Open-Meteo, satellite TLEs, etc.).
- **Calculations:** Leverage `astronomy-engine` for celestial ephemeris and `satellite.js` for orbital propagations.
- **Internationalization:** All user-facing strings must use the localization keys in `src/locales/` with proper fallback and RTL support.

---

## Pull Request Guidelines

1. Create a descriptive branch from `main`:
   ```bash
   git checkout -b feat/my-new-feature
   ```
2. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat: ...` for new features
   - `fix: ...` for bug fixes
   - `docs: ...` for documentation changes
   - `refactor: ...` for code refactoring
   - `test: ...` for adding or updating tests
3. Ensure all tests and lint checks pass:
   ```bash
   npm run lint
   npm run test
   npm run build
   ```
4. Push your branch and open a Pull Request with a clear summary of changes and screenshots/screen recordings for UI modifications.
