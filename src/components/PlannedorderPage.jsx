import React, { useState, useEffect } from "react";
import "../styles/PlannedorderPage.css";

const PlannedOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortField, setSortField] = useState("planned_order_id");
  const [sortOrder, setSortOrder] = useState("asc");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/planned-orders")
      .then((res) => res.json())
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching planned orders:", err);
        setLoading(false);
      });
  }, []);

  const filteredOrders = orders
    .filter((o) => {
      const matchesSearch =
        o.planned_order_id.toLowerCase().includes(search.toLowerCase()) ||
        o.item.toLowerCase().includes(search.toLowerCase());

      const matchesFilter =
        filterType === "all" ? true : o.item_type === filterType;

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      const valA = a[sortField].toString().toLowerCase();
      const valB = b[sortField].toString().toLowerCase();

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  if (loading) return <p className="loading">Loading...</p>;
  if (!orders.length) return <p className="empty">No planned orders found.</p>;

  return (
    
    <div className="planned-orders-page">
      <button
          className="back-btn"
          onClick={() => (window.location.href = "/dashboard")}
        >
          ⬅ Back to Dashboard
        </button>

      <h1 className="title">📝 Planned Orders</h1>

      {/* Controls */}
      <div className="controls">
        <input
          type="text"
          placeholder="🔍 Search orders..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Types</option>
          <option value="Purchase">Purchase</option>
          <option value="Manufacture">Manufacture</option>
        </select>
      </div>
      {/* Table */}
      <div className="table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>#</th>
              <th onClick={() => toggleSort("planned_order_id")} className="sortable">
                Order ID {sortField === "planned_order_id" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th>Item</th>
              <th>Quantity</th>
              <th>Due Date</th>
              <th onClick={() => toggleSort("item_type")} className="sortable">
                Type {sortField === "item_type" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
            </tr>
          </thead>
          <tbody>
  {filteredOrders.map((o, idx) => (
    <tr key={idx}>
      <td>{idx + 1}</td>
      <td>{o.planned_order_id}</td>
      <td>{o.item}</td>
      <td>{o.quantity}</td>
      <td>{o.suggested_due_date}</td>
      <td>
        <span className={`badge ${o.item_type}`}>{o.item_type}</span>
      </td>
    </tr>
  ))}
</tbody>

        </table>
      </div>
    </div>
  );
};

export default PlannedOrdersPage;
