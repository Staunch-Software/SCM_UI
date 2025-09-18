import React, { useState, useEffect } from "react";
import "../styles/CustomersPage.css";

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/customers")
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
      <div className="page-header">
        {/* ✅ Simple back button */}
        <button
          className="back-btn"
          onClick={() => (window.location.href = "/dashboard")}
        >
          ⬅ Back to Dashboard
        </button>

        <h1>Customers</h1>
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Order Reference</th>
            <th>Customer Name</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c, idx) => (
            <tr key={idx}>
              <td>{idx + 1}</td>
              <td>{c.order_reference}</td>
              <td>{c.customer_name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CustomersPage;
