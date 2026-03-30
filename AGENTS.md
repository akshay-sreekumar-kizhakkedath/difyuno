# Agent Operation Guidelines (AGENTS.md)

Welcome, autonomous coding agents! This document outlines the standards, commands, and rules you must follow when operating within this repository. This project is a highly-animated, performance-optimized Vanilla JavaScript landing page powered by Vite, GSAP, and Lenis.

## 1. Core Commands

Since this is a straightforward Vite setup without complex tooling at the moment, stick to these fundamental NPM scripts:

*   **Development Server**: `npm run dev`
    *   *Usage*: Run this to spin up the local development environment using Vite.
*   **Production Build**: `npm run build`
    *   *Usage*: Run this to bundle the assets and JavaScript for production. Always run this before submitting a final feature to ensure there are no bundling or asset path errors.
*   **Preview Build**: `npm run preview`
    *   *Usage*: Run this to preview the production build locally.
*   **Testing**: Currently, there is no formal test runner (e.g., Jest, Vitest) configured. 
    *   *Running a Single Test*: If you introduce a test runner or are asked to run tests, add the appropriate script to `package.json` first (e.g., `"test": "vitest"`). If no test runner is configured, test your changes manually by serving the files and verifying DOM interactions or logic via console logs.
*   **Linting**: Currently, no dedicated linter (e.g., ESLint, Prettier) is installed. Rely on the formatting guidelines below.

## 2. Code Style & Architecture Guidelines

Adhere to the following conventions to keep the codebase clean, readable, and performant.

### Imports
*   **Module System**: Use standard ES6 `import`/`export` syntax.
*   **Grouping**: Group imports at the top of the file. Group external library imports (like `gsap` or `lenis`) first, followed by internal utility/module imports.
*   **Pathing**: Use relative paths for local file imports. Ensure file extensions are included if Vite requires them for non-JS files (e.g., `.css`, `.png`).

### Formatting & Syntax
*   **Vanilla JavaScript**: The project uses ES6+ Vanilla JS. Do not introduce TypeScript or React/JSX unless explicitly requested.
*   **Indentation**: Use 2 spaces for indentation.
*   **Semicolons**: Always use semicolons at the end of statements.
*   **Quotes**: Use single quotes (`'`) for strings, except when using template literals (`` ` ``) for interpolation.
*   **Variables**: Prefer `const` for variables that are never reassigned. Use `let` for variables whose values will change. Avoid `var`.
*   **Functions**: Use arrow functions (`() => {}`) for callbacks and utility functions. Standard function declarations are acceptable for top-level component initializations if preferred.

### Types & Data
*   **Dynamic Typing**: Since this is vanilla JS, be explicit and clear with variable names to imply the type (e.g., `isReady` for a boolean, `frameCount` for a number).
*   **Object Structures**: Maintain clear and consistent state objects (like the `state` or `config` objects in `main.js`). Keep state centralized if possible.

### Naming Conventions
*   **Variables/Functions**: Use `camelCase` (e.g., `initNavbar`, `renderLoop`).
*   **Constants**: Use `UPPER_SNAKE_CASE` for global, hardcoded constants and configuration milestones (e.g., `MILESTONES`).
*   **DOM Elements**: When caching DOM elements, keep names descriptive (e.g., `canvas`, `preloader`, `loadingPct`).
*   **CSS Classes**: Use lowercase, hyphenated class names. While not strictly BEM, aim for semantic class names (e.g., `scroll-container`, `hero-block`). Keep CSS selectors simple and avoid deep nesting.
*   **IDs**: Use IDs for unique, functional sections or elements that require precise JavaScript targeting (e.g., `#hero-h1`, `#scrub-canvas`).

### Error Handling
*   **Graceful Degradation**: When dealing with DOM elements, always check for their existence before manipulating them (e.g., `if (!el) return;`).
*   **Resource Loading**: Handle failed asset loads gracefully. For instance, the image preloader should not hang indefinitely if an image fails to load. Use `.onerror` handlers.
*   **Try/Catch**: Use `try/catch` blocks for asynchronous operations or parsing tasks that could throw exceptions.

## 3. Library-Specific Conventions

### GSAP (GreenSock Animation Platform)
*   **Timeline & Tweens**: Use GSAP for all complex animations. Avoid CSS transitions when GSAP is managing the element to prevent conflicts.
*   **ScrollTrigger**: Use `ScrollTrigger` for scroll-linked animations. Always `ScrollTrigger.refresh()` after DOM changes or major layout shifts.
*   **Cleanup**: If you dynamically create and destroy DOM elements, ensure you kill associated GSAP tweens/ScrollTriggers (`ScrollTrigger.getById(id).kill()`) to prevent memory leaks.
*   **Performance**: Use hardware-accelerated properties (`x`, `y`, `opacity`, `scale`) for animations instead of layout-triggering properties (`top`, `left`, `width`, `height`).

### Lenis (Smooth Scrolling)
*   **Integration**: Ensure Lenis's `requestAnimationFrame` loop syncs with GSAP's ticker. Do not create competing RAF loops.
*   **DOM Structure**: Be aware that Lenis relies on standard scroll events but smooths them. Ensure parent containers (like `body`) allow scrolling (unless specifically locked during preloading).

### HTML5 Canvas (Image Sequence Scrubbing)
*   **Canvas Operations**: Keep `requestAnimationFrame` render loops strictly for drawing operations. Do heavy calculations outside the loop.
*   **Resizing**: Always update canvas dimensions correctly on window resize and force a redraw to prevent stretching.

## 4. Operational Rules for Agents

1.  **Do Not Over-Engineer**: Maintain the lightweight nature of this project. Do not install heavy frameworks (React, Vue) or UI libraries (Bootstrap, Tailwind) unless asked.
2.  **File Management**: If `main.js` grows too large (>500 lines), proactively suggest or perform code splitting into logical modules (e.g., `js/animations.js`, `js/canvas.js`, `js/utils.js`).
3.  **Read Before Writing**: Always read existing HTML IDs and CSS classes before writing JS targeting them. 
4.  **Absolute Paths in Tools**: Remember to use absolute paths for file system operations (`Read`, `Write`, `Edit`).
5.  **Build Verification**: Always run `npm run build` after making changes to verify the Vite bundler handles your code correctly.

---
*Created automatically to maintain code integrity and style consistency.*