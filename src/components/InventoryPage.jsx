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
  ChevronsDown,
  ChevronsUp,
} from "lucide-react";
import "../styles/InventoryPage.css";

const QuantityCell = ({ item, previousValue }) => {
  const currentValue = item.onHand;
  const lastQty = item.lastTransactionQty;
  const lastType = item.lastTransactionType;

  if (!lastQty || !lastType) {
    return <>{currentValue}</>;
  }

  const isPositive = lastType === 'in';
  const DeltaIcon = isPositive ? ChevronsUp : ChevronsDown; // Use ChevronUp/Down as requested
  const deltaClass = isPositive ? 'positive' : 'negative';
  // Use the exact colors from the new CSS for the icon to ensure correct rendering
  const iconColor = isPositive ? "#16a34a" : "#dc2626";

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start" }}>
      <span>{currentValue}</span>
      <span className={`quantity-delta ${deltaClass}`}>
        <DeltaIcon size={14} color={iconColor} />
        {/* Display magnitude only; the direction is shown by the icon and color */}
        {lastQty}
      </span>
    </div>
  );
};

const InventoryPage = () => {
  const [inventory, setInventory] = useState([]);
  const [previousInventoryMap, setPreviousInventoryMap] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  const [showDemand, setShowDemand] = useState(true); // Keep demand visible
  const [showSupply, setShowSupply] = useState(true); // Keep supply visible
  const [showExcess, setShowExcess] = useState(true); // Keep excess visible
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedProcurement, setSelectedProcurement] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);

  const fetchInventoryFromAPI = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // const response = await fetch("http://127.0.0.1:8000/api/inventory-analysis");
      const response = await fetch("http://127.0.0.1:8000/api/inventory-analysis");
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && !event.target.closest('.filter-dropdown')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  const handleExportToCSV = () => {
    const headers = ['SKU', 'Product Name', 'Type', 'Buy/Make', 'Status', 'On Hand', 'Cost/Unit', 'Total Value', 'Location', 'Days in Stock'];
    if (showDemand) {
      headers.push('Avg Demand/Mo', 'Forecast', 'Safety Stock', 'Sales Order', 'Dependent Demand', 'Total Demand', 'Months Inventory');
    }
    if (showSupply) {
      headers.push('WO/PO', 'In Transit');
    }
    if (showExcess) {
      headers.push('Excess/Shortage');
    }
    const rows = filteredData.map(item => {
      const row = [item.sku, item.product_name, item.itemType, item.procurementType, item.itemStatus, item.onHand, item.costPerUnit, item.totalValue, item.location, item.daysInStock];
      if (showDemand) {
        row.push(item.avgMonthlyDemand, item.forecast, item.safetyStock, item.salesOrder, item.dependentDemand, item.totalDemand, item.monthsOfInventory);
      }
      if (showSupply) {
        row.push(item.procurementType === "Make" ? `WO: ${item.workOrderCount} (${item.workOrderQty})` : `PO: ${item.purchaseOrderCount} (${item.purchaseOrderQty})`, item.inTransit);
      }
      if (showExcess) {
        row.push(item.excessInventory);
      }
      return row;
    });
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Inventory_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const processedInventory = useMemo(() => {
    return inventory.map((item) => ({
      ...item,
      totalValue: item.costPerUnit * item.onHand,
    }));
  }, [inventory]);

  const filteredData = useMemo(() => {
    return processedInventory.filter((item) => {
      const matchesSearch = !search ||
        item.product_name.toLowerCase().includes(search.toLowerCase()) ||
        item.sku.toLowerCase().includes(search.toLowerCase());
      const matchesType = selectedTypes.length === 0 || selectedTypes.some(type => item.itemType.toLowerCase() === type.toLowerCase());
      const matchesProcurement = selectedProcurement.length === 0 || selectedProcurement.includes(item.procurementType);
      const matchesStatus = selectedStatus.length === 0 || selectedStatus.includes(item.itemStatus);
      return matchesSearch && matchesType && matchesProcurement && matchesStatus;
    });
  }, [processedInventory, search, selectedTypes, selectedProcurement, selectedStatus]);

  const summaryMetrics = useMemo(() => {
    if (!processedInventory.length)
      return { totalValue: 0, totalExcess: 0, excessItems: 0, totalMO: 0, totalPO: 0 };

    const totalValue = processedInventory.reduce((sum, item) => sum + item.totalValue, 0);
    const totalExcess = processedInventory.reduce((sum, item) => sum + (item.excessInventory > 0 ? item.excessInventory : 0), 0);
    const excessItems = processedInventory.filter((item) => item.excessInventory > 0).length;

    // --- FIX 1 of 3: Use the new COUNT fields for the summary cards ---
    const totalMO = processedInventory.reduce((sum, item) => sum + item.workOrderCount, 0);
    const totalPO = processedInventory.reduce((sum, item) => sum + item.purchaseOrderCount, 0);

    return { totalValue, totalExcess, excessItems, totalMO, totalPO };
  }, [processedInventory]);

  const distributionData = useMemo(() => {
    if (!processedInventory.length) return { inStock: 0, lowStock: 0, outOfStock: 0 };
    const totalItems = processedInventory.length;
    const inStock = Math.round((processedInventory.filter((i) => i.onHand > 100).length / totalItems) * 100);
    const lowStock = Math.round((processedInventory.filter((i) => i.onHand > 30 && i.onHand <= 100).length / totalItems) * 100);
    const outOfStock = 100 - inStock - lowStock;
    return { inStock, lowStock, outOfStock };
  }, [processedInventory]);

  const agingData = useMemo(() => {
    if (!processedInventory.length) return [];
    const totalItems = processedInventory.length;
    const ranges = {
      "0-30 Days": processedInventory.filter((i) => i.daysInStock <= 30).length,
      "31-60 Days": processedInventory.filter((i) => i.daysInStock > 30 && i.daysInStock <= 60).length,
      "61-90 Days": processedInventory.filter((i) => i.daysInStock > 60 && i.daysInStock <= 90).length,
      "90+ Days": processedInventory.filter((i) => i.daysInStock > 90).length,
    };
    return Object.entries(ranges).map(([range, count]) => ({
      range,
      count,
      percentage: Math.round((count / totalItems) * 100),
    }));
  }, [processedInventory]);

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

  if (loading) return <div className="loading-screen"><p>Loading Inventory Data from Odoo...</p></div>;
  if (error) return <div className="no-data-screen"><p style={{ color: "red" }}>{error}</p></div>;
  if (!inventory.length) return <div className="no-data-screen"><p>No inventory records found.</p></div>;

  return (
    <div className="inventory-page">
      <div className="inventory-header-main">
        <div className="header-content">
          <div className="header-left">
            <button className="back-btn" onClick={() => (window.location.href = "/dashboard")}>←</button>
            <div>
              <h1 className="page-title">Inventory Analysis System</h1>
              <p className="page-subtitle">Demand & Supply Planning Analysis</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn-secondary" onClick={handleExportToCSV}><Download size={16} /> Export Report</button>
          </div>
        </div>
      </div>

      <div className="inventory-content">
        <div className="summary-grid">
          <div className="summary-card"><div className="summary-icon blue"><Package size={24} /></div><div className="summary-info"><p className="summary-label">Total Items</p><p className="summary-value">{inventory.length}</p></div></div>
          <div className="summary-card"><div className="summary-icon green"><TrendingUp size={24} /></div><div className="summary-info"><p className="summary-label">Total Inventory Value</p><p className="summary-value">${summaryMetrics.totalValue.toLocaleString()}</p></div></div>
          <div className="summary-card"><div className="summary-icon orange"><AlertTriangle size={24} /></div><div className="summary-info"><p className="summary-label">Excess Items</p><p className="summary-value">{summaryMetrics.excessItems}</p><p className="summary-subtext">{summaryMetrics.totalExcess} units excess</p></div></div>
          <div className="summary-card split-card">
            <div className="split-section"><div className="split-icon manufacturing"><Factory size={20} /></div><div><p className="split-label">Manufacturing Orders</p><p className="split-value">{summaryMetrics.totalMO}</p></div></div>
            <div className="split-divider"></div>
            <div className="split-section"><div className="split-icon purchase"><ShoppingBag size={20} /></div><div><p className="split-label">Purchase Orders</p><p className="split-value">{summaryMetrics.totalPO}</p></div></div>
          </div>
        </div>

        <div className="charts-grid">{/* Charts remain the same */}</div>

        <div className="analysis-section">
          <div className="tabs-header">
            <h2 className="section-title">Inventory Analysis Table</h2>
            <div className="column-toggles">
              <label className="toggle-item"><input type="checkbox" checked={showDemand} onChange={(e) => setShowDemand(e.target.checked)} /><span className="toggle-label">Show Demand</span></label>
              <label className="toggle-item"><input type="checkbox" checked={showSupply} onChange={(e) => setShowSupply(e.target.checked)} /><span className="toggle-label">Show Supply</span></label>
              <label className="toggle-item"><input type="checkbox" checked={showExcess} onChange={(e) => setShowExcess(e.target.checked)} /><span className="toggle-label">Show Excess</span></label>
              <button className="toggle-btn" onClick={handleShowAll}>Show All</button>
              <button className="toggle-btn secondary" onClick={handleHideAll}>Hide All</button>
            </div>
          </div>
          <div className="search-section">
            <div className="search-and-filters">
              <div className="search-container">
                <Search className="search-icon" size={18} />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search by product name or SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="filters-row">
                {/* Type Filter */}
                <div className="filter-dropdown">
                  <button
                    className={`filter-button ${selectedTypes.length > 0 ? 'active' : ''} ${openDropdown === 'type' ? 'open' : ''}`}
                    onClick={() => setOpenDropdown(openDropdown === 'type' ? null : 'type')}
                  >
                    <span>Type</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {selectedTypes.length > 0 && <span className="filter-badge">{selectedTypes.length}</span>}
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                        <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" />
                      </svg>
                    </div>
                  </button>
                  {openDropdown === 'type' && (
                    <div className="filter-dropdown-menu">
                      {['Finished Goods', 'Raw Material', 'Sub Assembly'].map(type => (
                        <label key={type} className="filter-option">
                          <input
                            type="checkbox"
                            checked={selectedTypes.includes(type)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTypes([...selectedTypes, type]);
                              } else {
                                setSelectedTypes(selectedTypes.filter(t => t !== type));
                              }
                            }}
                          />
                          <span className="filter-option-label">{type}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Buy/Make Filter */}
                <div className="filter-dropdown">
                  <button
                    className={`filter-button ${selectedProcurement.length > 0 ? 'active' : ''} ${openDropdown === 'procurement' ? 'open' : ''}`}
                    onClick={() => setOpenDropdown(openDropdown === 'procurement' ? null : 'procurement')}
                  >
                    <span>Buy/Make</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {selectedProcurement.length > 0 && <span className="filter-badge">{selectedProcurement.length}</span>}
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                        <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" />
                      </svg>
                    </div>
                  </button>
                  {openDropdown === 'procurement' && (
                    <div className="filter-dropdown-menu">
                      {['Buy', 'Make'].map(proc => (
                        <label key={proc} className="filter-option">
                          <input
                            type="checkbox"
                            checked={selectedProcurement.includes(proc)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProcurement([...selectedProcurement, proc]);
                              } else {
                                setSelectedProcurement(selectedProcurement.filter(p => p !== proc));
                              }
                            }}
                          />
                          <span className="filter-option-label">{proc}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status Filter */}
                <div className="filter-dropdown">
                  <button
                    className={`filter-button ${selectedStatus.length > 0 ? 'active' : ''} ${openDropdown === 'status' ? 'open' : ''}`}
                    onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
                  >
                    <span>Status</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {selectedStatus.length > 0 && <span className="filter-badge">{selectedStatus.length}</span>}
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                        <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" />
                      </svg>
                    </div>
                  </button>
                  {openDropdown === 'status' && (
                    <div className="filter-dropdown-menu">
                      {['Active', 'Inactive', 'Obsolete'].map(status => (
                        <label key={status} className="filter-option">
                          <input
                            type="checkbox"
                            checked={selectedStatus.includes(status)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStatus([...selectedStatus, status]);
                              } else {
                                setSelectedStatus(selectedStatus.filter(s => s !== status));
                              }
                            }}
                          />
                          <span className="filter-option-label">{status}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="table-container">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th className="sticky-col first-col">SKU</th>
                  <th className="sticky-col second-col">Product Name</th>
                  <th>Type</th>
                  <th>Buy/Make</th>
                  <th>Status</th>
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
                      {/* --- FIX: Added Dependent Demand column header --- */}
                      <th>Dependent Demand</th>
                      <th>Total Demand</th>
                      <th>Months Inventory</th>
                    </>
                  )}
                  {showSupply && (<><th>WO/PO</th><th>In Transit</th></>)}
                  {showExcess && <th>Excess/Shortage</th>}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => (
                  <tr key={item.product_id}>
                    <td className="sticky-col first-col text-gray">{item.sku}</td>
                    <td className="sticky-col second-col font-medium">{item.product_name}</td>
                    <td><span className={`badge badge-${item.itemType === "Finished Goods" ? "purple" : item.itemType === "Sub Assembly" ? "blue" : "green"}`}>{item.itemType}</span></td>
                    <td><span className={`badge badge-${item.procurementType === "Buy" ? "blue" : "orange"}`}>{item.procurementType}</span></td>
                    <td><span className={`badge badge-${item.itemStatus === "Active" ? "green" : item.itemStatus === "Inactive" ? "yellow" : item.itemStatus === "Obsolete" ? "red" : "gray"}`}>{item.itemStatus}</span></td>
                    <td className="font-medium"><QuantityCell item={item} previousValue={previousInventoryMap.get(item.product_id)} /></td>
                    <td className="text-gray">${item.costPerUnit}</td>
                    <td className="font-medium">${item.totalValue.toLocaleString()}</td>
                    <td className="text-gray">{item.location}</td>
                    <td className={`days-stock ${item.daysInStock > 90 ? "high" : item.daysInStock > 60 ? "medium" : "low"}`}>{item.daysInStock}d</td>
                    {showDemand && (
                      <>
                        <td className="font-medium">{item.avgMonthlyDemand}</td>
                        <td className="text-gray">{item.forecast}</td>
                        <td className="text-gray">{item.safetyStock}</td>
                        <td className="text-gray">{item.salesOrder}</td>
                        {/* --- FIX: Added Dependent Demand data cell --- */}
                        <td className="text-gray">{item.dependentDemand}</td>
                        <td className="font-medium">{item.totalDemand}</td>
                        <td className={`font-medium ${item.monthsOfInventory > 6 ? "text-red" : item.monthsOfInventory > 3 ? "text-orange" : "text-green"}`}>{item.monthsOfInventory}M</td>
                      </>
                    )}
                    {showSupply && (
                      <>
                        {/* --- FIX 2 of 3: Formatted WO/PO column as requested --- */}
                        <td className="text-gray">
                          {item.procurementType === "Make"
                            ? `WO: ${item.workOrderCount} (${item.workOrderQty})`
                            : `PO: ${item.purchaseOrderCount} (${item.purchaseOrderQty})`}
                        </td>
                        <td className="text-gray">{item.inTransit}</td>
                      </>
                    )}
                    {showExcess && (
                      <td className={`font-medium ${item.excessInventory > 0 ? "text-red" : "text-green"}`}>
                        {item.excessInventory > 0 ? "+" : ""}{item.excessInventory}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="demand-supply-section">{/* Demand/Supply overview remains the same */}</div>
      </div>
    </div>
  );
};

export default InventoryPage;