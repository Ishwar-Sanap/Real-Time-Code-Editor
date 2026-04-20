import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { json } from "@codemirror/lang-json";

export const getLanguageExtension = (lang) => {
  switch (lang) {
    case "javascript":
      return javascript();
    case "python3":
    case "python":
      return python();
    case "c":
      return cpp(); // cpp() supports C syntax
    case "cpp":
      return cpp();
    case "java":
      return java();
    case "json":
        return json();
    default:
      return null;
  }
};
