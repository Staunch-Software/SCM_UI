import React, { useState, useEffect } from "react";
import "../styles/InventoryPage.css";

const InventoryPage = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  // search + sort
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("desc"); // default: high → low

  useEffect(() => {
    //fetch("http://127.0.0.1:8000/api/inventory")
      fetch("https://odooerp.staunchtec.com/api/inventory")
      .then((res) => res.json())
      .then((data) => {
        setInventory(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching inventory:", err);
        setLoading(false);
      });
  }, []);

  // filter + sort inventory
  const filteredInventory = inventory
    .filter((item) =>
      item.product_name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) =>
      sortOrder === "asc" ? a.quantity - b.quantity : b.quantity - a.quantity
    );

  if (loading) return <p className="loading">Loading...</p>;
  if (!inventory.length) return <p className="no-data">No inventory records found.</p>;

  return (
    <div className="inventory-page">
      <div className="inventory-header">
        <div className="title-with-back">
          <button className="back-arrow" onClick={() => window.location.href = "/dashboard"}>
            ←
          </button>
          <h1 className="title">Inventory</h1>
        </div>

        <div className="controls">
          <input
            type="text"
            placeholder="Search by product name..."
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className="sort-btn"
            onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
          >
            Sort by Quantity ({sortOrder === "asc" ? "Low → High" : "High → Low"})
          </button>
        </div>
      </div>

      {/* 📋 Table */}
      <table>
        <thead>
          <tr>
            <th>Product ID</th>
            <th>Product Name</th>
            <th>
              Quantity 
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredInventory.map((item, idx) => (
            <tr key={idx}>
              <td>{item.product_id}</td>
              <td>{item.product_name}</td>
              <td>{item.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryPage;
