import React, { useState } from "react";
import AdminView from "../components/AdminView";
import "./AdminPage.css";
import { Link } from "react-router-dom";

const AdminPage = () => {
  const [activeCollection, setActiveCollection] = useState("users");
  const [selectedItem, setSelectedItem] = useState(null);

  const handleCloseDetailView = () => setSelectedItem(null);

  const renderDetailView = () => {
    if (!selectedItem) return null;

    return (
      <div className="detail-view">
        <h2>Petition Details</h2>
        <pre>{JSON.stringify(selectedItem, null, 2)}</pre>
        <button onClick={handleCloseDetailView}>Close</button>
      </div>
    );
  };

  return (
    <div className="admin-container">
      <nav className="search-db">
        <Link to="/search">Search in DB</Link>
      </nav>
      <h1>Admin Dashboard</h1>
      <div className="button-group">
        <button onClick={() => setActiveCollection("users")}>Users Data</button>
        <button onClick={() => setActiveCollection("petitions")}>Petitions Data</button>
        <button onClick={() => setActiveCollection("audit_trail")}>Audit Trail</button>
      </div>
      <div className="data-container">
        <AdminView activeCollection={activeCollection} onSelectItem={setSelectedItem} />
      </div>
      {renderDetailView()}
    </div>
  );
};


export default AdminPage;
