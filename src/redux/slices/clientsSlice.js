import { createSlice } from "@reduxjs/toolkit";

const clientsSlice = createSlice({
    name : "connectedClients",
    initialState : {
        clients : []
    },
    reducers:{
        addClient : (state, action) =>{
            //In action.payload you will recieve the array of all clients so push one by one into clients
            state.clients = []
            const connectedClients = action.payload;
            connectedClients.forEach(client => {
                state.clients.push(client);
            });
        },

        //For remove client, you will recieve the SOCKET_ID in action.payload
        removeClient: (state, action) =>{
            const updatedClients = state.clients.filter((client)=> 
                client.socketID !== action.payload
            )

            state.clients = updatedClients;
        }
    }
})

//Export actions
export const {addClient , removeClient}  = clientsSlice.actions;

//Export reducer to put in store
export default clientsSlice.reducer;