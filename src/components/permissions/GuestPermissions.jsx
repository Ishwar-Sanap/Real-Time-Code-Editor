import React from "react";
import "./Permissions.css";
import { useDispatch, useSelector } from "react-redux";

export default function GuestPermissions() {
  const users = useSelector((state) => state.connectedClients.clients);
  const dispatch = useDispatch();
  const myUserName = sessionStorage.getItem("userName");

  return (
    <div className="permissions-container">
      <label>Permissions:</label>
      <table className="permissions-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Read 👁️</th>
            <th>Write ✍️</th>
            <th>Execute ⚡</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            return (
              user.userName === myUserName && (
                <tr key={user.socketID}>
                  <td>{user.userName}</td>
                  <td>
                    <input type="checkbox" readOnly checked={user.permission.read} className="change-not-allowed" />
                  </td>
                  <td>
                    <input type="checkbox" readOnly checked={user.permission.write} className="change-not-allowed" />
                  </td>
                  <td>
                    <input type="checkbox" readOnly checked={user.permission.execute} className="change-not-allowed" />
                  </td>
                </tr>
              )
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
