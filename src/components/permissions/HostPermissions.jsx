import React, { useEffect, useState } from "react";
import "./Permissions.css";
import { useSocket } from "../../contexts/SocketContext";
import { useParams } from "react-router-dom";
import ACTIONS from "../../actions";
import { updatePermission } from "../../redux/slices/clientsSlice";
import { useDispatch, useSelector } from "react-redux";

export default function HostPermissions() {
  const users = useSelector((state) => state.connectedClients.clients);
  const dispatch = useDispatch();

  console.log("users in permissions", users);
  const socketRef = useSocket();
  const { roomID } = useParams();

  const togglePermission = (socketID, permission, value) => {
    const newPermission = { [permission]: !value };
    socketRef.current.emit(ACTIONS.UPDATE_PERMISSIONS, {
      socketID,
      newPermission,
      roomID,
    });

    dispatch(updatePermission({ socketID, newPermission }));
  };

  return (
    <div className="permissions-container">
      <label>Manage Permissions:</label>
      <table className="permissions-table">
        <thead>
          <tr>
            <th>Users</th>
            <th>Read 👁️</th>
            <th>Write ✍️</th>
            <th>Execute ⚡</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.socketID}>
              <td>{user.userName}</td>
              <td>
                <input type="checkbox" checked readOnly disabled />
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={user.permission.write}
                  onChange={() =>
                    togglePermission(
                      user.socketID,
                      "write",
                      user.permission.write
                    )
                  }
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={user.permission.execute}
                  onChange={() =>
                    togglePermission(
                      user.socketID,
                      "execute",
                      user.permission.execute
                    )
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
