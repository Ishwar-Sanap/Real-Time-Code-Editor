import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  setFontSize,
  setLanguage,
  setTheme,
  setToolTip,
} from "../../redux/slices/editorSettingsSlice";

import "./Settings.css"
import HostPermissions from "../permissions/HostPermissions";
import GuestPermissions from "../permissions/GuestPermissions";

export default function Settings() {
  const language = useSelector((state) => state.editorSettings.language);
  const theme = useSelector((state) => state.editorSettings.theme);
  const fontSize = useSelector((state) => state.editorSettings.fontSize);
  const toolTip = useSelector((state)=> state.editorSettings.toolTip);
  const dispatch = useDispatch();

  const myUserName = sessionStorage.getItem("userName");
  const hostUser = sessionStorage.getItem("hostUser") ;
  const isHostUser = myUserName === hostUser;
  console.log("Values from store: ", language, theme, fontSize);

  const languages = [
    { name: "javascript", label: "JavaScript" },
    { name: "c", label: "C" },
    { name: "cpp", label: "C++" },
    { name: "java", label: "Java" },
    { name: "python3", label: "Python3" },
  ];

  const thems = [
    { name: "base16-light", label: "Base Light" },
    { name: "dracula", label: "Dracula" },
    { name: "eclipse", label: "Eclipse Light" },
    { name: "midnight", label: "Midnight" },
    { name: "solarized dark", label: "Solarized Dark" },
  ];

  const fontSizes = [16, 18, 20, 22, 24, 30];

  return (
    <div>
      <div className="settings-container">
        <h3 className="panel-heading">Settings</h3>

        <div className="settings-panel">
          <div>
            <label>Language:</label>
            <select
              value={language}
              onChange={(e) => dispatch(setLanguage(e.target.value))}
            >
              {languages.map((language, indx) => (
                <option value={language.name} key={indx}>
                  {language.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Theme:</label>
            <select
              value={theme}
              onChange={(e) => dispatch(setTheme(e.target.value))}
            >
              {thems.map((theme, indx) => (
                <option value={theme.name} key={indx}>
                  {theme.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Font Size:</label>
            <select
              value={fontSize}
              onChange={(e) => dispatch(setFontSize(e.target.value))}
            >
              {fontSizes.map((fontSize, indx) => (
                <option value={`${fontSize}px`} key={indx}>
                  {" "}
                  {` ${fontSize}px`}{" "}
                </option>
              ))}
            </select>
          </div>

          <div className="my-cursor">
            <label htmlFor="">Show my cursor: </label>
            <input
              type="checkbox"
              checked={toolTip}
              onChange={(e) => {
                dispatch(setToolTip(!toolTip));
              }}
            />
          </div>

          {isHostUser ? (<HostPermissions/>) : (<GuestPermissions/>)}
        </div>
      </div>
    </div>
  );
}
