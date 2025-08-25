import { createContext, useContext } from "react";

export const MessagesContext = createContext();

export const useMessages = ()=>{
    return useContext(MessagesContext);
}