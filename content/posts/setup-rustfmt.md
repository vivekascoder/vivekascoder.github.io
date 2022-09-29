+++
title = "Setup RustFmt to format code"
date = 2022-09-29

[taxonomies]
tags = ["rust"]

+++

# Setup RustFmt to format code.

I want to talk about how to setup rust fmt as default formatter for rust files and tweak settings according to your taste.

Start with creating a local vscode settings config file at `./.vscode/settings.json`

```json
{
  "files.watcherExclude": {
    "**/.git/objects/**": true,
    "**/.git/subtree-cache/**": true,
    "**/node_modules/*/**": true,
    "**/.hg/store/**": true,
    "**/target/**": true
  },
  "[rust]": {
    "editor.defaultFormatter": "rust-lang.rust-analyzer",
    "editor.formatOnSave": true,
    "editor.tabSize": 2
  }
}
```

> This means you are setting rust analyzer to take care of formatting and saying good bye to prettier.
