import { configureStore } from "@reduxjs/toolkit";
import clientReducer from "./slices/clientsSlice"
import editorSettingsReducer from "./slices/editorSettingsSlice"

const store = configureStore({
    reducer:{
        connectedClients : clientReducer,    
        editorSettings : editorSettingsReducer
    }
})

export default store;