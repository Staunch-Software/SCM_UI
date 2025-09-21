import React, { useState, useEffect } from "react";
import "../styles/PlannedorderPage.css";

const PlannedOrdersPage = ({ setCurrentPage }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortField, setSortField] = useState("planned_order_id");
  const [sortOrder, setSortOrder] = useState("asc");

 
  const [page, setPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);

  const fetchOrders = async (pageNum = 1, reset = false) => {
    try {
      if (pageNum === 1 || reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      //const response = await fetch(`http://127.0.0.1:8000/api/planned-orders?page=${pageNum}&limit=30&search=${search}&sort=${sortField}&order=${sortOrder}`);
      const response = await fetch(
        `http://odooerp.staunchtec.comapi/planned-orders?page=${pageNum}&limit=30&search=${search}&sort=${sortField}&order=${sortOrder}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Fetched orders:", data);

      const newOrders = Array.isArray(data.orders) ? data.orders : [];

      if (pageNum === 1 || reset) {
        setOrders(newOrders);
      } else {
        setOrders((prev) => [...prev, ...newOrders]);
      }

      setTotalOrders(data.total || 0);
      setHasNextPage(data.has_next || false);
      setPage(pageNum);
    } catch (err) {
      console.error("Error fetching planned orders:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchOrders(1, true);
  }, []);

  const loadMore = () => {
    if (hasNextPage && !loadingMore) {
      fetchOrders(page + 1, false);
    }
  };

  const filteredOrders = orders
    .filter((o) => {
      const matchesSearch =
        (o.planned_order_id
          ?.toString()
          .toLowerCase()
          .includes(search.toLowerCase()) ||
          o.item?.toLowerCase().includes(search.toLowerCase())) ??
        false;

      const matchesFilter =
        filterType === "all" ? true : o.item_type === filterType;

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      const valA = a[sortField]?.toString().toLowerCase() ?? "";
      const valB = b[sortField]?.toString().toLowerCase() ?? "";

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

  const handleBackToDashboard = () => {
    if (setCurrentPage) {
      setCurrentPage("dashboard");
    } else {
      window.location.href = "/dashboard";
    }
  };

  if (loading) {
    return (
      <div className="planned-orders-page">
        <p className="loading">Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="planned-orders-page">
        <button className="back-btn" onClick={handleBackToDashboard}>
          ← Back to Dashboard
        </button>
        <div className="error-message">
          <h2>Error Loading Orders</h2>
          <p>Failed to fetch orders: {error}</p>
          <button onClick={() => fetchOrders(1, true)} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="planned-orders-page">
        <button className="back-btn" onClick={handleBackToDashboard}>
          Back to Dashboard
        </button>
        <h1 className="title"> Orders</h1>
        <p className="empty">No orders found.</p>
      </div>
    );
  }

  return (
    <div className="planned-orders-page">
      <div className="orders-header">
        <div className="title-with-back">
          <button className="back-arrow" onClick={handleBackToDashboard}>
            ←
          </button>
          <h1 className="title">Orders</h1>
        </div>

        <div className="controls">
          <input
            type="text"
            placeholder="Search orders..."
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
      </div>

      <div className="results-info">
        Showing {orders.length} of {totalOrders} orders
      </div>

      <div className="table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>#</th>
              <th
                onClick={() => toggleSort("planned_order_id")}
                className="sortable"
              >
                Order ID{" "}
                {sortField === "planned_order_id" &&
                  (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th>Item</th>
              <th>Quantity</th>
              <th>Due Date</th>
              <th onClick={() => toggleSort("item_type")} className="sortable">
                Type{" "}
                {sortField === "item_type" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((o, idx) => (
              <tr key={o.planned_order_id || idx}>
                <td>{idx + 1}</td>
                <td>{o.planned_order_id || "N/A"}</td>
                <td>{o.item || "N/A"}</td>
                <td>{o.quantity || "N/A"}</td>
                <td>{o.suggested_due_date || "N/A"}</td>
                <td>
                  <span className={`badge ${o.item_type || "default"}`}>
                    {o.item_type || "N/A"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasNextPage && (
        <div className="load-more-container">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="load-more-btn"
          >
            {loadingMore ? "Loading..." : "Load More Orders"}
          </button>
        </div>
      )}
    </div>
  );
};

export default PlannedOrdersPage;
