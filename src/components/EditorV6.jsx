import { useEffect, useRef } from "react";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  drawSelection,
} from "@codemirror/view";
import { EditorState, Compartment } from "@codemirror/state";
import { defaultKeymap, historyKeymap } from "@codemirror/commands";
import { indentOnInput, bracketMatching } from "@codemirror/language";
import { closeBrackets } from "@codemirror/autocomplete";
import { yCollab, yUndoManagerKeymap } from "y-codemirror.next";
import * as Y from "yjs";
import { useSelector } from "react-redux";
import { getLanguageExtension } from "../utils/languages";
import { getThemeExtension } from "../utils/themes";
import { useCode } from "../contexts/CodeContext";

/* CodeMirror 6 editor with Yjs collaborative editing */
export default function Editor({ yText, awareness }) {
  const containerRef = useRef(null);
  const viewRef = useRef(null);
  const debounceTimeout = useRef(null);
  const langCompartment = useRef(new Compartment());
  const themeCompartment = useRef(new Compartment());
  const fontCompartment = useRef(new Compartment());
  const editableCompartment = useRef(new Compartment());

  // Redux state
  const language = useSelector((state) => state.editorSettings.language);
  const theme = useSelector((state) => state.editorSettings.theme);
  const fontSize = useSelector((state) => state.editorSettings.fontSize);
  const showTooltips = useSelector((state) => state.editorSettings.toolTip);
  const users = useSelector((state) => state.connectedClients.clients);
  const myUserName = sessionStorage.getItem("userName");
  const myUserDetails = JSON.parse(sessionStorage.getItem("user"));

  //context provider
  const { codeRef, code, setCode } = useCode();

  const me = users.find((u) => u.userID === myUserDetails.userID);
  const hasWritePermission = me?.permission?.write ?? null;

  // Initialize editor
  useEffect(() => {
    if (!containerRef.current || !yText || !awareness) return;

    const undoManager = new Y.UndoManager(yText);

    const getCurrentTextExt = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const newText = update.state.doc.toString();
        // Debounce state updates
        clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => {
          codeRef.current = newText;
          setCode(newText);
        }, 300); // Update state 300ms after user stops typing
      }
    });

    const fixedHeightExt = EditorView.theme({
      "&": {
        height: "calc(100vh - 25px)"
      },
      ".cm-scroller": {
        overflow: "auto", // enable scrolling
      },
    });

    const state = EditorState.create({
      doc: yText.toString(),
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        drawSelection(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        keymap.of([...defaultKeymap, ...historyKeymap, ...yUndoManagerKeymap]),
        editableCompartment.current.of(
          EditorView.editable.of(hasWritePermission),
        ),
        langCompartment.current.of(getLanguageExtension(language)),
        themeCompartment.current.of(getThemeExtension(theme)),
        fontCompartment.current.of(
          EditorView.theme({ "&": { fontSize: fontSize || "14px" } }),
        ),
        yCollab(yText, awareness, { undoManager }),
        tooltipVisibilityExtension(showTooltips), // custom tooltip control
        EditorView.lineWrapping,
        getCurrentTextExt,
        fixedHeightExt
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;

    return () => {
      view.destroy();
      clearTimeout(debounceTimeout.current);
      viewRef.current = null;
    };
  }, [yText, awareness]);

  // Update language
  useEffect(() => {
    if (!viewRef.current) return;
    viewRef.current.dispatch({
      effects: langCompartment.current.reconfigure(
        getLanguageExtension(language),
      ),
    });
  }, [language]);

  // Update theme
  useEffect(() => {
    if (!viewRef.current) return;
    viewRef.current.dispatch({
      effects: themeCompartment.current.reconfigure(getThemeExtension(theme)),
    });
  }, [theme]);

  // Update font size
  useEffect(() => {
    if (!viewRef.current) return;
    viewRef.current.dispatch({
      effects: fontCompartment.current.reconfigure(
        EditorView.theme({ "&": { fontSize: fontSize || "14px" } }),
      ),
    });
  }, [fontSize]);

  // Update permission when it changes
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: editableCompartment.current.reconfigure(
          EditorView.editable.of(hasWritePermission ?? false),
        ),
      });

      if (hasWritePermission === false) {
        showPermissionToast();
      }
    }
  }, [hasWritePermission]);

  return (
    <div
      ref={containerRef}
      style={{
        height: "calc(100vh - 25px)",
        overflow: "auto",
        borderRadius: "10px",
      }}
    />
  );
}

//  ********************** Utilities **********************

function showPermissionToast() {
  const toast = document.createElement("div");
  toast.textContent = "🚫 You don't have permission to write";
  Object.assign(toast.style, {
    position: "fixed",
    top: "30px",
    right: "30px",
    background: "rgba(242, 24, 24, 0.9)",
    color: "#fff",
    padding: "8px 16px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "bold",
    boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
    zIndex: "9999",
    opacity: "0",
    transition: "opacity 0.3s ease",
  });
  document.body.appendChild(toast);
  // Fade in
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
  });

  // Fade out + remove
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300); // wait for fade-out
  }, 5000);
}

function tooltipVisibilityExtension(show) {
  return EditorView.theme({
    ".cm-ySelectionInfo": {
      opacity: show ? "1 !important" : "0 !important",
      pointerEvents: "none",
    },
  });
}
