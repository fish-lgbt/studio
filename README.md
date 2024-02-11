# Studio

Studio is a state-of-the-art web application designed to transform your screenshots into professional-quality images effortlessly. Powered by the robust Next.js framework and elegantly styled with Tailwind CSS, Studio offers an unparalleled experience for creating visually stunning content.

## Features

* **Dynamic Image Manipulation**: Seamlessly apply effects such as lens flares, dot patterns, and wave patterns directly through the web interface.
* **Custom Canvas Ratios**: Opt for various canvas ratios to fit your specific content needs, including 16:9, 9:16, 4:3, 1:1, and Twitter banner sizes.
* **Intuitive Drag-and-Drop**: Arrange elements with ease using the drag-and-drop functionality powered by `@dnd-kit`.
* **Advanced Color Processing**: Convert between color formats effortlessly and generate beautiful colors for your projects.
* **Responsive and Adaptive Design**: Designed with a mobile-first approach, ensuring a fluid editing experience across all devices.

## Technologies

* **Framework**: Built on Next.js 14.1.0 for SSR capabilities and fast performance.
* **Styling**: Utilizes Tailwind CSS 3.3.0, customized for extended theming and responsiveness.
* **State Management**: Employs local state management with React Hooks for reactive UI updates.
* **Development Tools**: Integrates ESLint for code quality, TypeScript for type safety, and a variety of utilities for an efficient development workflow.

## Getting Started

Jumpstart your Studio experience:

1. Clone the Studio repository: `git clone https://github.com/fish-lgbt/studio.git`
2. Install dependencies: `npm install`
3. Launch the development server: `npm run dev`

## NPM Scripts

* `dev`: Initiates the Next.js development server.
* `build`: Compiles the app for production deployment.
* `start`: Runs the production build.
* `lint`: Executes ESLint to detect and fix linting issues.

## Contribute

Contributions to Studio are highly encouraged! Whether you're contributing code, reporting bugs, or suggesting enhancements, your involvement is welcome. Please adhere to our contribution guidelines for a smooth collaboration process.

## Application Structure

Studio features a comprehensive and organized codebase, showcasing a broad spectrum of functionalities:

```
arduinoCopy code
src/
├─ app/
│  ├─ layout.tsx
│  ├─ page.tsx
│  └─ globals.css
├─ components/
│  ├─ LayerBar.tsx
│  ├─ Layers.tsx
│  ├─ Tools.tsx
│  └─ ...
├─ hooks/
│  ├─ useCanvasPanning.ts
│  ├─ useDrawCanvas.ts
│  └─ ...
├─ types.d.ts
public/
├─ backgrounds/
├─ easter-eggs/
├─ screenshots/
├─ favicon.ico
└─ manifest.json
```

## Configuration

Studio leverages several configuration files to tailor the development environment:

* **Next.js Configuration**: `next.config.mjs` customizes the Next.js setup.
* **Tailwind CSS Configuration**: `tailwind.config.ts` extends the framework's default styling capabilities.
* **TypeScript Configuration**: `tsconfig.json` ensures type-checking and compiler options are set.
* **PostCSS Configuration**: `postcss.config.js` integrates Tailwind CSS and autoprefixer for styling compatibility.

## Dependencies

Studio's functionality is enhanced by key dependencies like Next.js for SSR, Tailwind CSS for styling, `@dnd-kit` for interactive drag-and-drop interfaces, and more, ensuring a feature-rich user experience.

For a comprehensive list of dependencies and their roles, refer to `package.json`.

## Contributing

Your contributions make Studio better. We welcome code contributions, bug reports, feature requests, and feedback. Please check our contribution guidelines for more information on how to get involved.

- - -

Studio is more than just a tool; it's a canvas for your creativity, offering an easy-to-use platform for enhancing screenshots into works of art. Join us in evolving Studio into the premier solution for image manipulation and enhancement.
