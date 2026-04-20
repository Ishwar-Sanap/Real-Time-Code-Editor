import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";

export function getThemeExtension(themeName) {
  switch (themeName) {
    case "dracula":
      return [oneDark, draculaLikeTheme];
    case "base16-light":
        return baseLighTheme;
    default:
      return oneDark;
  }
}

// Custom Dracula-like colors layered on oneDark
const draculaLikeTheme = EditorView.theme({
  "&": { backgroundColor: "#282a36" },
  ".cm-gutters": {
    backgroundColor: "#282a36",
    color: "#6272a4",
    borderRight: "1px solid #44475a",
  },
  ".cm-activeLineGutter": { backgroundColor: "#44475a" },
  ".cm-activeLine": { backgroundColor: "#44475a33" },
  ".cm-selectionBackground": { backgroundColor: "#44475a !important" },
  "&.cm-focused .cm-cursor": { borderLeftColor: "#f8f8f2" },
});

const baseLighTheme = EditorView.theme(
  {
    "&": {
      color: "#000000",
      backgroundColor: "#ffffff",
    },
    ".cm-content": {
      caretColor: "#000000",
    },
    "&.cm-focused .cm-cursor": {
      borderLeftColor: "#000000",
    },
    "&.cm-focused .cm-selectionBackground, ::selection": {
      backgroundColor: "#add6ff",
    },
    ".cm-gutters": {
      backgroundColor: "#f3f3f3",
      color: "#237893",
      border: "none",
    },
    ".cm-activeLine": {
      backgroundColor: "#e8f2ff",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "#e8f2ff",
    },
  },
  { dark: false },
);