# Agent Notes

## Obsidian UI Colors

When adding or changing UI components, prefer the Obsidian default theme palette below so new work stays visually consistent with the site.

Reference: https://publish.obsidian.md/hub/04+-+Guides%2C+Workflows%2C+%26+Courses/Guides/Default+Obsidian+Theme+Colors

### Dark Theme

```css
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
```

### Light Theme

```css
--background-primary: #ffffff;
--background-primary-alt: #f5f6f8;
--background-secondary: #f2f3f5;
--background-secondary-alt: #e3e5e8;
--background-modifier-border: #ddd;
--background-modifier-form-field: #fff;
--background-modifier-form-field-highlighted: #fff;
--background-modifier-box-shadow: rgba(0, 0, 0, 0.1);
--background-modifier-success: #A4E7C3;
--background-modifier-error: #990000;
--background-modifier-error-hover: #bb0000;
--background-modifier-cover: rgba(0, 0, 0, 0.8);

--text-accent: #705dcf;
--text-accent-hover: #7a6ae6;
--text-normal: #2e3338;
--text-muted: #888888;
--text-faint: #999999;
--text-error: #800000;
--text-error-hover: #990000;
--text-highlight-bg: rgba(255, 255, 0, 0.4);
--text-highlight-bg-active: rgba(255, 128, 0, 0.4);
--text-selection: rgba(204, 230, 255, 0.99);
--text-on-accent: #f2f2f2;

--interactive-normal: #f2f3f5;
--interactive-hover: #e9e9e9;
--interactive-accent: #7b6cd9;
--interactive-accent-hover: #8273e6;
--interactive-success: #197300;

--scrollbar-active-thumb-bg: rgba(0, 0, 0, 0.2);
--scrollbar-bg: rgba(0, 0, 0, 0.05);
--scrollbar-thumb-bg: rgba(0, 0, 0, 0.1);
```

### Usage Guidance

- Use `--background-primary` for page backgrounds and `--background-primary-alt` / `--background-secondary` for cards, code blocks, panels, and subtle grouped surfaces.
- Use `--text-normal` for primary content, `--text-muted` for descriptions and metadata, and `--text-faint` for secondary timestamps or low-emphasis labels.
- Use `--text-accent` for links and accent affordances; use `--text-accent-hover` for hover states.
- Use `--background-modifier-border` for borders and dividers.
- Avoid introducing unrelated bright colors unless they have a specific semantic role.
