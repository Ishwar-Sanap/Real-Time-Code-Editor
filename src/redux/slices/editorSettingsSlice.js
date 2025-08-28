import { createSlice } from "@reduxjs/toolkit";

const editorSettingsSlice = createSlice({
    name : "editorSettings",
    initialState : {
        language : "javascript",
        theme : "dracula",
        fontSize: "16px"
    },

    reducers:{
        setLanguage : (state, action) => {
            state.language = action.payload;
        },

        setTheme : (state, action) =>{
            state.theme = action.payload;
        },

        setFontSize : (state, action)=>{
            state.fontSize = action.payload;
        }
    }
});

export const {setLanguage, setTheme, setFontSize} = editorSettingsSlice.actions

export default editorSettingsSlice.reducer;