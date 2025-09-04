import { useContext } from "react";
import { createContext } from "react";

export const CodeContext = createContext();

export const useCode = () => {
  return useContext(CodeContext);
};
