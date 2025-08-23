import React from "react";
import { ClipLoader } from "react-spinners";

export default function Spinner() {
  return (
    <div>
      <div
        className="loading-spinner"
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <ClipLoader color="#36d7b7" loading={true} size={100} />
        <h2>Joining The Room...</h2>
      </div>
    </div>
  );
}
