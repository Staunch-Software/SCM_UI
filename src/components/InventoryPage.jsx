import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  Download,
  Upload,
  TrendingUp,
  AlertTriangle,
  Package,
  Factory,
  ShoppingBag,
  RefreshCw,
} from "lucide-react";
import "../styles/InventoryPage.css";

const QuantityCell = ({ currentValue, previousValue }) => {
  if (previousValue === undefined || previousValue === null) {
    return <>{currentValue}</>;
  }
  const delta = currentValue - previousValue;
  if (delta === 0) {
    return <>{currentValue}</>;
  }
  const deltaStyle = {
    fontSize: "0.8em",
    marginLeft: "8px",
    padding: "2px 6px",
    borderRadius: "10px",
    color: "white",
    fontWeight: "600",
    backgroundColor: delta > 0 ? "#22c55e" : "#ef4444",
  };
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
      }}
    >
      <span>{currentValue}</span>
      <span style={deltaStyle}>{delta > 0 ? `+${delta}` : delta}</span>
    </div>
  );
};

const InventoryPage = () => {
  const [inventory, setInventory] = useState([]);
  const [previousInventoryMap, setPreviousInventoryMap] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  const [showDemand, setShowDemand] = useState(false);
  const [showSupply, setShowSupply] = useState(true);
  const [showExcess, setShowExcess] = useState(false);

  const fetchInventoryFromAPI = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/inventory-analysis"
      );
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setInventory((currentInventory) => {
        if (currentInventory.length > 0) {
          const oldDataMap = new Map();
          currentInventory.forEach((item) => {
            oldDataMap.set(item.product_id, item.onHand);
          });
          setPreviousInventoryMap(oldDataMap);
        }
        return data;
      });
    } catch (err) {
      console.error("Error fetching inventory:", err);
      setError(
        "Failed to load inventory data. Please check the backend connection."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventoryFromAPI();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- TASK 4: Calculate totalValue on the frontend ---
  // This derived state will be used by all other calculations and the table.
  const processedInventory = useMemo(() => {
    return inventory.map((item) => ({
      ...item,
      totalValue: item.costPerUnit * item.onHand,
    }));
  }, [inventory]);

  const filteredData = useMemo(() => {
    if (!search) return processedInventory; // Use processed data
    return processedInventory.filter(
      (
        item // Use processed data
      ) =>
        item.product_name.toLowerCase().includes(search.toLowerCase()) ||
        item.sku.toLowerCase().includes(search.toLowerCase())
    );
  }, [processedInventory, search]); // Dependency changed

  const summaryMetrics = useMemo(() => {
    if (!processedInventory.length)
      return {
        totalValue: 0,
        totalExcess: 0,
        excessItems: 0,
        totalMO: 0,
        totalPO: 0,
      };

    // --- TASK 4: The totalValue is now correctly calculated from the processed data ---
    const totalValue = processedInventory.reduce(
      (sum, item) => sum + item.totalValue,
      0
    );
    const totalExcess = processedInventory.reduce(
      (sum, item) =>
        sum + (item.excessInventory > 0 ? item.excessInventory : 0),
      0
    );
    const excessItems = processedInventory.filter(
      (item) => item.excessInventory > 0
    ).length;
    const totalMO = processedInventory.reduce(
      (sum, item) => sum + item.workOrders,
      0
    );
    const totalPO = processedInventory.reduce(
      (sum, item) => sum + item.purchaseOrders,
      0
    );

    return { totalValue, totalExcess, excessItems, totalMO, totalPO };
  }, [processedInventory]); // Dependency changed

  const distributionData = useMemo(() => {
    if (!processedInventory.length)
      return { inStock: 0, lowStock: 0, outOfStock: 0 };
    const totalItems = processedInventory.length;
    const inStock = Math.round(
      (processedInventory.filter((i) => i.onHand > 100).length / totalItems) *
        100
    );
    const lowStock = Math.round(
      (processedInventory.filter((i) => i.onHand > 30 && i.onHand <= 100)
        .length /
        totalItems) *
        100
    );
    const outOfStock = 100 - inStock - lowStock;
    return { inStock, lowStock, outOfStock };
  }, [processedInventory]); // Dependency changed

  const agingData = useMemo(() => {
    if (!processedInventory.length) return [];
    const totalItems = processedInventory.length;
    const ranges = {
      "0-30 Days": processedInventory.filter((i) => i.daysInStock <= 30).length,
      "31-60 Days": processedInventory.filter(
        (i) => i.daysInStock > 30 && i.daysInStock <= 60
      ).length,
      "61-90 Days": processedInventory.filter(
        (i) => i.daysInStock > 60 && i.daysInStock <= 90
      ).length,
      "90+ Days": processedInventory.filter((i) => i.daysInStock > 90).length,
    };
    return Object.entries(ranges).map(([range, count]) => ({
      range,
      count,
      percentage: Math.round((count / totalItems) * 100),
    }));
  }, [processedInventory]); // Dependency changed

  const handleShowAll = () => {
    setShowDemand(true);
    setShowSupply(true);
    setShowExcess(true);
  };

  const handleHideAll = () => {
    setShowDemand(false);
    setShowSupply(false);
    setShowExcess(false);
  };

  if (loading)
    return (
      <div className="loading-screen">
        <p>Loading Inventory Data from Odoo...</p>
      </div>
    );
  if (error)
    return (
      <div className="no-data-screen">
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  if (!inventory.length)
    return (
      <div className="no-data-screen">
        <p>No inventory records found.</p>
      </div>
    );

  return (
    <div className="inventory-page">
      <div className="inventory-header-main">
        <div className="header-content">
          <div className="header-left">
            <button
              className="back-btn"
              onClick={() => (window.location.href = "/dashboard")}
            >
              ←
            </button>
            <div>
              <h1 className="page-title">Inventory Analysis System</h1>
              <p className="page-subtitle">Demand & Supply Planning Analysis</p>
            </div>
          </div>
          <div className="header-actions">
            
            <button className="btn-secondary">
              <Upload size={16} /> Import
            </button>
            <button className="btn-secondary">
              <Download size={16} /> Export Report
            </button>
          </div>
        </div>
      </div>

      <div className="inventory-content">
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-icon blue">
              <Package size={24} />
            </div>
            <div className="summary-info">
              <p className="summary-label">Total Items</p>
              <p className="summary-value">{inventory.length}</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon green">
              <TrendingUp size={24} />
            </div>
            <div className="summary-info">
              <p className="summary-label">Total Inventory Value</p>
              <p className="summary-value">
                ${summaryMetrics.totalValue.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon orange">
              <AlertTriangle size={24} />
            </div>
            <div className="summary-info">
              <p className="summary-label">Excess Items</p>
              <p className="summary-value">{summaryMetrics.excessItems}</p>
              <p className="summary-subtext">
                {summaryMetrics.totalExcess} units excess
              </p>
            </div>
          </div>
          <div className="summary-card split-card">
            <div className="split-section">
              <div className="split-icon manufacturing">
                <Factory size={20} />
              </div>
              <div>
                <p className="split-label">Manufacturing Orders</p>
                <p className="split-value">{summaryMetrics.totalMO}</p>
              </div>
            </div>
            <div className="split-divider"></div>
            <div className="split-section">
              <div className="split-icon purchase">
                <ShoppingBag size={20} />
              </div>
              <div>
                <p className="split-label">Purchase Orders</p>
                <p className="split-value">{summaryMetrics.totalPO}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="charts-grid">{/* Charts remain the same */}</div>

        <div className="analysis-section">
          <div className="tabs-header">
            <h2 className="section-title">Inventory Analysis Table</h2>
            <div className="column-toggles">
              <label className="toggle-item">
                <input
                  type="checkbox"
                  checked={showDemand}
                  onChange={(e) => setShowDemand(e.target.checked)}
                />
                <span className="toggle-label">Show Demand</span>
              </label>
              <label className="toggle-item">
                <input
                  type="checkbox"
                  checked={showSupply}
                  onChange={(e) => setShowSupply(e.target.checked)}
                />
                <span className="toggle-label">Show Supply</span>
              </label>
              <label className="toggle-item">
                <input
                  type="checkbox"
                  checked={showExcess}
                  onChange={(e) => setShowExcess(e.target.checked)}
                />
                <span className="toggle-label">Show Excess</span>
              </label>
              <button className="toggle-btn" onClick={handleShowAll}>
                Show All
              </button>
              <button className="toggle-btn secondary" onClick={handleHideAll}>
                Hide All
              </button>
            </div>
          </div>
          <div className="search-section">{/* Search remains the same */}</div>

          {/* --- TASK 5: The container now controls the hover state for the animation --- */}
          <div className="table-container">
            <table className="inventory-table">
              <thead>
                <tr>
                  {/* --- TASK 2: Added classes for sticky columns --- */}
                  <th className="sticky-col first-col">SKU</th>
                  <th className="sticky-col second-col">Product Name</th>
                  <th>Type</th>
                  <th>Buy/Make</th>
                  <th>Status</th>
                  {/* --- TASK 1: Moved On Hand column here --- */}
                  <th>On Hand</th>
                  <th>Cost/Unit</th>
                  <th>Total Value</th>
                  <th>Location</th>
                  <th>Days in Stock</th>
                  {showDemand && (
                    <>
                      <th>Avg Demand/Mo</th>
                      <th>Forecast</th>
                      <th>Safety Stock</th>
                      <th>Sales Order</th>
                      <th>Total Demand</th>
                      <th>Months Inventory</th>
                    </>
                  )}
                  {showSupply && (
                    <>
                      <th>WO/PO</th>
                      <th>In Transit</th>
                    </>
                  )}
                  {showExcess && <th>Excess/Shortage</th>}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => (
                  <tr key={item.product_id}>
                    {/* --- TASK 2: Added classes for sticky columns --- */}
                    <td className="sticky-col first-col text-gray">
                      {item.sku}
                    </td>
                    <td className="sticky-col second-col font-medium">
                      {item.product_name}
                    </td>
                    <td>
                      <span
                        className={`badge badge-${
                          item.itemType === "Finished Good"
                            ? "purple"
                            : item.itemType === "Sub Assembly"
                            ? "blue"
                            : "green"
                        }`}
                      >
                        {item.itemType}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge badge-${
                          item.procurementType === "Buy" ? "blue" : "orange"
                        }`}
                      >
                        {item.procurementType}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge badge-${
                          item.itemStatus === "Active"
                            ? "green"
                            : item.itemStatus === "Non Current"
                            ? "yellow"
                            : item.itemStatus === "Obsolete"
                            ? "red"
                            : "gray"
                        }`}
                      >
                        {item.itemStatus}
                      </span>
                    </td>

                    {/* --- TASK 1: Moved On Hand cell here, it's now always visible --- */}
                    <td className="font-medium">
                      <QuantityCell
                        currentValue={item.onHand}
                        previousValue={previousInventoryMap.get(
                          item.product_id
                        )}
                      />
                    </td>

                    <td className="text-gray">${item.costPerUnit}</td>
                    <td className="font-medium">
                      ${item.totalValue.toLocaleString()}
                    </td>
                    <td className="text-gray">{item.location}</td>
                    <td
                      className={`days-stock ${
                        item.daysInStock > 90
                          ? "high"
                          : item.daysInStock > 60
                          ? "medium"
                          : "low"
                      }`}
                    >
                      {item.daysInStock}d
                    </td>

                    {showDemand && (
                      <>
                        <td className="font-medium">{item.avgMonthlyDemand}</td>
                        <td className="text-gray">{item.forecast}</td>
                        <td className="text-gray">{item.safetyStock}</td>
                        <td className="text-gray">{item.salesOrder}</td>
                        <td className="font-medium">{item.totalDemand}</td>
                        <td
                          className={`font-medium ${
                            item.monthsOfInventory > 6
                              ? "text-red"
                              : item.monthsOfInventory > 3
                              ? "text-orange"
                              : "text-green"
                          }`}
                        >
                          {item.monthsOfInventory}M
                        </td>
                      </>
                    )}

                    {showSupply && (
                      <>
                        <td className="text-gray">
                          {item.procurementType === "Make"
                            ? `WO: ${item.workOrders}`
                            : `PO: ${item.purchaseOrders}`}
                        </td>
                        <td className="text-gray">{item.inTransit}</td>
                      </>
                    )}

                    {showExcess && (
                      <td
                        className={`font-medium ${
                          item.excessInventory > 0 ? "text-red" : "text-green"
                        }`}
                      >
                        {item.excessInventory > 0 ? "+" : ""}
                        {item.excessInventory}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="demand-supply-section">
          {/* Demand/Supply overview remains the same */}
        </div>
      </div>
    </div>
  );
};

export default InventoryPage;
