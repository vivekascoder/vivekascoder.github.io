+++
title = "Design Language of This Site"
description = "Describing the choices made to make this beautiful and minimalistic site."
date = 2026-06-20

[taxonomies]
tags = ["design", "minimilism", "ui/ux"]
+++

## Tech behind it
- **Static Site Generator**: This site is powered by [Zola](https://github.com/getzola/zola), a static site generator written in Rust. I started using Zola in 2022 and kept onto it since then.
- The theme is built on top of a [Archie Zola](https://github.com/XXXMrG/archie-zola), but since using Archie, I've customize it so much that it looks a ot different from the original theme (read more about ui below).
- Comments: Comments are built using [utteranc](https://utteranc.es/), it's a github bot that uses github issues to store comments, it comes with github auth so you don't need to do anything, just link with github repo and you're done.
- Analytics: For analytics we're using Google Analytics, but I really move move away from it.

## UI and Design choices

- [Obsidian color scheme](https://github.com/obsidianmd/obsidian-themehttps://publish.obsidian.md/hub/04+-+Guides%2C+Workflows%2C+%26+Courses/Guides/Default+Obsidian+Theme+Colors): The color scheme is takes from Obsidian, the note taking app I use daily. This theme is the default theme Obsidian ships with.
```css
:root {
    --background-primary: #202020;
    --background-primary-alt: #1a1a1a;
    --background-secondary: #161616;
    --background-secondary-alt: #000000;
    
    --background-modifier-border: #333;
    --background-modifier-form-field: rgba(0, 0, 0, 0.3);
    --background-modifier-form-field-highlighted: rgba(0, 0, 0, 0.22);
    --background-modifier-box-shadow: rgba(0, 0, 0, 0.3);
    --background-modifier-success: #197300;
    --background-modifier-error: #3d0000;
    --background-modifier-error-hover: #470000;
    --background-modifier-cover: rgba(0, 0, 0, 0.8);
    
    --text-accent: #7f6df2;
    --text-accent-hover: #8875ff;
    --text-normal: #dcddde;
    --text-muted: #999;
    --text-faint: #666;
    --text-error: #ff3333;
    --text-error-hover: #990000;
    --text-highlight-bg: rgba(255, 255, 0, 0.4);
    --text-highlight-bg-active: rgba(255, 128, 0, 0.4);
    --text-selection: rgba(23, 48, 77, 0.99);
    --text-on-accent: #dcddde;
    
    --interactive-normal: #2a2a2a;
    --interactive-hover: #303030;
    --interactive-accent: #483699;
    --interactive-accent-hover: #4d3ca6;
    --interactive-success: #197300;
    
    --scrollbar-active-thumb-bg: rgba(255, 255, 255, 0.2);
    --scrollbar-bg: rgba(255, 255, 255, 0.05);
    --scrollbar-thumb-bg: rgba(255, 255, 255, 0.1);
}
```
- Font Selection
    - Tittle: Instrument Serif
    - Content: Source Sans 3 (From adobe)
    - Code: SF Mono (From apple)
- Background pattern
```css
:root {
    --background-primary: #ffffff;
    --background-pattern: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24'
    xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23808080' fill-opacity='0.2' fill-
    rule='evenodd'%3E%3Ccircle cx='0' cy='0' r='1.5'/%3E%3Ccircle cx='24' cy='0' r='1.5'/%3E%3Ccircle
    cx='0' cy='24' r='1.5'/%3E%3Ccircle cx='24' cy='24' r='1.5'/%3E%3C/g%3E%3C/svg%3E");
}

body {
    background-color: transparent;
    isolation: isolate;
    margin: 0;
    min-height: 100vh;
    position: relative;
}

body::before {
    background-color: var(--background-primary);
    background-image: var(--background-pattern);
    content: "";
    inset: 0;
    pointer-events: none;
    position: fixed;
    z-index: -1;
}

/**
For dark mode, just change the background:
**/

:root {
    --background-primary: #202020;
}
```

