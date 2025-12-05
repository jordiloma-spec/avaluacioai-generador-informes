# AI Studio Application Rules

This document outlines the core technologies used in this application and provides guidelines for their usage to ensure consistency, maintainability, and adherence to best practices.

## Tech Stack Description

*   **React**: A JavaScript library for building user interfaces, enabling a component-based architecture.
*   **TypeScript**: A superset of JavaScript that adds static type definitions, enhancing code quality and developer experience.
*   **Tailwind CSS**: A utility-first CSS framework used for rapidly styling components directly in the markup.
*   **Vite**: A fast build tool and development server, optimizing the development workflow for modern web projects.
*   **Google Gemini API (`@google/genai`)**: Utilized for AI-powered text generation, specifically for creating evaluation reports.
*   **Lucide React**: A collection of customizable SVG icons integrated into React components for visual elements.
*   **Local Storage**: Used for client-side data persistence, storing user profiles and application data directly in the browser.
*   **shadcn/ui**: A collection of reusable components built with Radix UI and Tailwind CSS, providing accessible and customizable UI primitives.
*   **React Router**: A standard library for routing in React applications, managing navigation between different views.

## Library Usage Rules

*   **React**: All UI development must be done using React components.
*   **TypeScript**: Always use TypeScript for all new and modified code to leverage type safety and improve code readability.
*   **Tailwind CSS**: All styling should be implemented using Tailwind CSS utility classes. Avoid custom CSS files or inline styles unless absolutely necessary for specific, isolated cases not covered by Tailwind.
*   **Vite**: Use Vite for all development and build processes. Configuration should be managed via `vite.config.ts`.
*   **Google Gemini API (`@google/genai`)**: This library is exclusively for interacting with the Google Gemini API for AI content generation. All AI-related service calls should be encapsulated within `services/geminiService.ts`.
*   **Lucide React**: Use `lucide-react` for all icons throughout the application to maintain a consistent icon set.
*   **Local Storage**: Data persistence for user profiles and application data should be handled through `localStorage` via `services/storageService.ts`. Do not directly access `localStorage` outside of this service.
*   **React Router**: For managing application routes and navigation, `react-router-dom` should be used. All primary routes should be defined in `src/App.tsx`.
*   **shadcn/ui**: Prioritize using components from `shadcn/ui` for common UI elements (e.g., buttons, inputs, dialogs, cards). If a `shadcn/ui` component needs modification, create a new component that wraps or extends it, rather than directly editing the `shadcn/ui` source files.