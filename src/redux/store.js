import { configureStore } from "@reduxjs/toolkit";
import clientReducer from "./slices/clientsSlice"

const store = configureStore({
    reducer:{
        connectedClients : clientReducer,    
    }
})

export default store;