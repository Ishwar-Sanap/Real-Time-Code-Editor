import { createSlice } from "@reduxjs/toolkit";

const clientsSlice = createSlice({
    name : "connectedClients",
    initialState : {
        clients : []
    },
    reducers:{
        addClient : (state, action) =>{
            //In action.payload you will recieve the array of all updated clients so update the state.clients
            state.clients = action.payload;
        },

        //For remove client, you will recieve the SOCKET_ID in action.payload
        removeClient: (state, action) =>{
            const updatedClients = state.clients.filter((client)=> 
                client.socketID !== action.payload
            )

            state.clients = updatedClients;
        },

        updatePermission: (state, action)=>{
            //in action.payload you will recieve {socketID ,permission , value};
            const socketID = action.payload.socketID;
            const newPermission = action.payload.newPermission;
        
            const clients = state.clients;
            state.clients = clients.map(client => 
                client.socketID === socketID ? {...client, permission: {...client.permission, ...newPermission }}
                : client
            )
        }
    }
})

//Export actions
export const {addClient , removeClient ,updatePermission}  = clientsSlice.actions;

//Export reducer to put in store
export default clientsSlice.reducer;