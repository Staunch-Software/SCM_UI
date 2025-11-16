import React, { useState, useEffect } from "react";
import "../styles/CustomersPage.css";
import SalesOrderDrawer from "./SalesOrderDrawer";

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/customers")
      // fetch("https://odooerp.staunchtec.com/api/customers")
      .then((res) => res.json())
      .then((data) => {
        setCustomers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching customers:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="loading">Loading...</p>;
  if (!customers.length) return <p className="no-data">No customers found.</p>;

  return (
    <div className="customers-page">
      <div className="customers-header">
        <div className="title-with-back">
          <button className="back-arrow" onClick={() => window.location.href = "/dashboard"}>
            ←
          </button>
          <h1 className="title">Customers</h1>
        </div>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Order Reference</th>
              <th>Customer Name</th>
              <th>Sales ID</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c, idx) => (
              <tr
                key={idx}
                onClick={() => {
                  setSelectedOrderId(c.sales_id || c.order_reference);
                  setDrawerOpen(true);
                }}
                style={{ cursor: 'pointer' }}
              >
                <td>{idx + 1}</td>
                <td>{c.order_reference}</td>
                <td>{c.customer_name}</td>
                <td>{c.sales_id || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SalesOrderDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        orderId={selectedOrderId}
      />
    </div>
  );
};

export default CustomersPage;
