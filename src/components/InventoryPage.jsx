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
  ChevronsUp, BarChart3, LineChart, ClipboardList, Lightbulb
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
  const [safetyStockPeriod, setSafetyStockPeriod] = useState(() => {
    const now = new Date();
    return `${now.toLocaleString('en-US', { month: 'short' }).toUpperCase()} ${now.getFullYear()}`;
  });
  const [safetyStockDetails, setSafetyStockDetails] = useState({});
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [updatingPeriod, setUpdatingPeriod] = useState(false);
  const [showSafetyStockModal, setShowSafetyStockModal] = useState(false);
  const [showForecastMonthDropdown, setShowForecastMonthDropdown] = useState(false);
  const [updatingForecast, setUpdatingForecast] = useState(false);
  const [showForecastModal, setShowForecastModal] = useState(false);
  const [forecastMonth, setForecastMonth] = useState(() => {
    const now = new Date();
    return `${now.toLocaleString('en-US', { month: 'short' }).toUpperCase()} ${now.getFullYear()}`;
  });
  const [isForecastRange, setIsForecastRange] = useState(false);
  const [forecastMonthDetails, setForecastMonthDetails] = useState({});
  const now = new Date();
  const currentMonth = now.toLocaleString('en-US', { month: 'long' });
  const currentYear = now.getFullYear().toString();

  const [selectedSafetyFromYear, setSelectedSafetyFromYear] = useState(currentYear);
  const [selectedSafetyFromMonth, setSelectedSafetyFromMonth] = useState(currentMonth);
  const [selectedSafetyToYear, setSelectedSafetyToYear] = useState(currentYear);
  const [selectedSafetyToMonth, setSelectedSafetyToMonth] = useState(currentMonth);

  const [selectedForecastFromYear, setSelectedForecastFromYear] = useState(currentYear);
  const [selectedForecastFromMonth, setSelectedForecastFromMonth] = useState(currentMonth);
  const [selectedForecastToYear, setSelectedForecastToYear] = useState(currentYear);
  const [selectedForecastToMonth, setSelectedForecastToMonth] = useState(currentMonth);

  // ADD these new states:
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showForecastDrawer, setShowForecastDrawer] = useState(false);
  const [drawerData, setDrawerData] = useState(null);
  const [drawerType, setDrawerType] = useState(''); // 'forecast' or 'safety'
  const [productDetails, setProductDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const formatNumber = (value, fallback = 0) => {
    // Check if value is NaN, null, or undefined
    if (value == null || isNaN(value)) {
      return fallback;
    }
    return value;
  };
  const fetchInventoryFromAPI = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // First check current period in backend
      const now = new Date();
      const currentMonth = now.toLocaleString('en-US', { month: 'long' });
      const currentYear = now.getFullYear().toString();

      // Fetch current month data directly
      await updateSafetyStockPeriod(currentMonth, currentYear, currentMonth, currentYear);
      await updateForecastMonth(currentMonth, currentYear, currentMonth, currentYear);

      //const response = await fetch("http://127.0.0.1:8000/api/inventory-analysis");
      const response = await fetch("https://odooerp.staunchtec.com/api/inventory-analysis");
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

  const updateSafetyStockPeriod = async (fromMonth, fromYear, toMonth, toYear) => {
    try {
      setUpdatingPeriod(true);
      //const response = await fetch(`http://127.0.0.1:8000/api/safety-stock-data/${fromYear}/${fromMonth}/${toYear}/${toMonth}`);
      const response = await fetch(`https://odooerp.staunchtec.com/api/safety-stock-data/${fromYear}/${fromMonth}/${toYear}/${toMonth}`);

      if (!response.ok) throw new Error("Failed to fetch safety stock data");
      const data = await response.json();

      const safetyStockMap = data.averages;
      const detailsMap = data.details;

      setInventory(prevInventory =>
        prevInventory.map(item => ({
          ...item,
          safetyStock: safetyStockMap[item.product_id] || 0
        }))
      );

      // Store details for tooltip
      setSafetyStockDetails(detailsMap);

      const isSameMonth = fromMonth === toMonth && fromYear === toYear;
      setIsForecastRange(!isSameMonth);
      const shortMonth = (m) => m.slice(0, 3).toUpperCase();
      const displayPeriod = isSameMonth
        ? `${shortMonth(fromMonth)} ${fromYear}`
        : `${shortMonth(fromMonth)} ${fromYear} - ${shortMonth(toMonth)} ${toYear}`;


      setSafetyStockPeriod(displayPeriod);
      setUpdatingPeriod(false);
    } catch (err) {
      console.error("Error updating safety stock:", err);
      setError("Failed to update safety stock");
      setUpdatingPeriod(false);
    }
  };

  const updateForecastMonth = async (fromMonth, fromYear, toMonth, toYear) => {
    try {
      setUpdatingForecast(true);
      //const response = await fetch(`http://127.0.0.1:8000/api/forecast-data/${fromYear}/${fromMonth}/${toYear}/${toMonth}`);
      const response = await fetch(`https://odooerp.staunchtec.com/api/forecast-data/${fromYear}/${fromMonth}/${toYear}/${toMonth}`);

      if (!response.ok) throw new Error("Failed to fetch forecast data");
      const data = await response.json();  // ✅ Get full data object

      const forecastMap = data.averages;  // ✅ Extract averages
      const detailsMap = data.details;    // ✅ Extract details

      setInventory(prevInventory =>
        prevInventory.map(item => ({
          ...item,
          forecast: forecastMap[item.product_id] || 0
        }))
      );

      // ✅ Store details for tooltip
      setForecastMonthDetails(detailsMap);

      const isSameMonth = fromMonth === toMonth && fromYear === toYear;
      setIsForecastRange(!isSameMonth);
      const shortMonth = (m) => m.slice(0, 3).toUpperCase();
      const displayPeriod = isSameMonth
        ? `${shortMonth(fromMonth)} ${fromYear}`
        : `${shortMonth(fromMonth)} ${fromYear} - ${shortMonth(toMonth)} ${toYear}`;

      setForecastMonth(displayPeriod);
      setUpdatingForecast(false);
    } catch (err) {
      console.error("Error updating forecast:", err);
      setError("Failed to update forecast");
      setUpdatingForecast(false);
    }
  };

  // ADD this new function:
  const handleProductClick = async (product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
    setLoadingDetails(true);

    try {
      //const response = await fetch(`http://127.0.0.1:8000/api/product-details/${product.product_id}`);
      const response = await fetch(`https://odooerp.staunchtec.com/api/product-details/${product.product_id}`);
      const data = await response.json();
      setProductDetails(data);
    } catch (err) {
      console.error("Error fetching product details:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchInventoryFromAPI();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && !event.target.closest('.filter-dropdown')) {
        setOpenDropdown(null);
      }
      if (showPeriodDropdown && !event.target.closest('.safety-stock-header') && !event.target.closest('.header-dropdown-menu')) {
        setShowPeriodDropdown(false);
      }
      if (showForecastMonthDropdown && !event.target.closest('.forecast-month-header') && !event.target.closest('.header-dropdown-menu')) {
        setShowForecastMonthDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown, showPeriodDropdown, showForecastMonthDropdown]);

  const handleExportToCSV = () => {
    const headers = ['SKU', 'Product Name', 'Type', 'Buy/Make', 'Status', 'On Hand', 'Cost/Unit', 'Total Value', 'Location', 'Days in Stock'];
    if (showDemand) {
      headers.push('Avg Demand/Mo', 'Forecast', 'Safety Stock', 'Sales Order', 'Dependent Demand', 'Total Demand', 'Months Inventory');
      if (isForecastRange) headers.push('Month Supply');
    }
    if (showSupply) {
      headers.push('WO/PO');
    }
    if (showExcess) {
      // --- FIX 1 of 4: Update CSV headers ---
      headers.push('Excess', 'Shortage');
    }
    const rows = filteredData.map(item => {
      const row = [item.sku, item.product_name, item.itemType, item.procurementType, item.itemStatus, item.onHand, item.costPerUnit, item.totalValue, item.location, item.daysInStock];
      if (showDemand) {
        row.push(item.avgMonthlyDemand, item.forecast, item.safetyStock, item.salesOrder, item.dependentDemand, item.totalDemand, item.monthsOfInventory);
        if (isForecastRange) row.push(item.monthSupply);
      }
      if (showSupply) {
        row.push(item.procurementType === "Make" ? `WO: ${item.workOrderCount} (${item.workOrderQty})` : `PO: ${item.purchaseOrderCount} (${item.purchaseOrderQty})`);
      }
      if (showExcess) {
        // --- FIX 2 of 4: Update CSV data rows ---
        row.push(item.excess, item.shortage);
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
      monthSupply: item.forecast > 0 ? (item.onHand / item.forecast).toFixed(1) : 0,
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
      return { totalValue: 0, totalExcess: 0, excessItems: 0, totalExcessValue: 0, totalMO: 0, totalPO: 0 };

    const totalValue = processedInventory.reduce((sum, item) => sum + item.totalValue, 0);

    // --- FIX 3 of 4: Update summary metrics to use the new fields ---
    const totalExcess = Math.round(processedInventory.reduce((sum, item) => sum + item.excess, 0));
    const excessItems = processedInventory.filter((item) => item.excess > 0).length;
    const totalExcessValue = processedInventory.reduce((sum, item) => sum + (item.excess * item.costPerUnit), 0);

    const totalMO = processedInventory.reduce((sum, item) => sum + (item.workOrderCount || 0), 0);
    const totalPO = processedInventory.reduce((sum, item) => sum + (item.purchaseOrderCount || 0), 0);

    return { totalValue, totalExcess, excessItems, totalExcessValue, totalMO, totalPO };
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
          <div className="summary-card"><div className="summary-icon orange"><AlertTriangle size={24} /></div><div className="summary-info"><p className="summary-label">Excess Items</p><p className="summary-value">{summaryMetrics.excessItems}</p><p className="summary-subtext">{summaryMetrics.totalExcess} units excess</p><p className="summary-subtext" style={{ color: '#c2410c', fontWeight: '600', fontSize: '0.875rem' }}>${summaryMetrics.totalExcessValue.toLocaleString()} total value</p></div></div>
          <div className="summary-card split-card">
            <div className="split-section"><div className="split-icon manufacturing"><Factory size={20} /></div><div><p className="split-label">Manufacturing Orders</p><p className="split-value">{formatNumber(summaryMetrics.totalMO)}</p></div></div>
            <div className="split-divider"></div>
            <div className="split-section"><div className="split-icon purchase"><ShoppingBag size={20} /></div><div><p className="split-label">Purchase Orders</p><p className="split-value">{formatNumber(summaryMetrics.totalPO)}</p></div></div>
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
                      <th style={{ position: 'relative' }}>
                        <div
                          className="forecast-month-header"
                          onClick={() => !updatingForecast && setShowForecastModal(true)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            cursor: updatingForecast ? 'wait' : 'pointer',
                            opacity: updatingForecast ? 0.6 : 1
                          }}
                        >
                          <span>Forecast ({forecastMonth})</span>
                          {updatingForecast ? (
                            <RefreshCw size={12} className="spin" />
                          ) : (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" />
                            </svg>
                          )}
                        </div>
                      </th>
                      {isForecastRange && <th>Month Supply</th>}
                      <th style={{ position: 'relative' }}>
                        <div
                          className="safety-stock-header"
                          onClick={() => !updatingPeriod && setShowSafetyStockModal(true)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            cursor: updatingPeriod ? 'wait' : 'pointer',
                            opacity: updatingPeriod ? 0.6 : 1
                          }}
                        >
                          <span>Safety Stock ({safetyStockPeriod})</span>
                          {updatingPeriod ? (
                            <RefreshCw size={12} className="spin" />
                          ) : (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" />
                            </svg>
                          )}
                        </div>
                      </th>
                      <th>Sales Order</th>
                      {/* --- FIX: Added Dependent Demand column header --- */}
                      <th>Dependent Demand</th>
                      <th>Total Demand</th>
                      <th>Months Inventory</th>
                    </>
                  )}
                  {showSupply && (<><th>WO/PO</th></>)}
                  {showExcess && (
                    // --- FIX 4 of 4: Update table headers ---
                    <>
                      <th>Excess</th>
                      <th>Shortage</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => (
                  <tr key={item.product_id}>
                    <td className="sticky-col first-col text-gray">{item.sku}</td>
                    <td className="sticky-col second-col font-medium">
                      <span
                        onClick={() => handleProductClick(item)}
                        style={{ cursor: 'pointer', color: '#2563eb', textDecoration: 'underline' }}
                      >
                        {item.product_name}
                      </span>
                    </td>
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
                        <td
                          className="text-gray font-medium"
                          style={{ cursor: 'pointer', color: '#2563eb' }}
                          onClick={() => {
                            setDrawerData({
                              product: item,
                              details: forecastMonthDetails[item.product_id],
                              dateRange: forecastMonth
                            });
                            setDrawerType('forecast');
                            setShowForecastDrawer(true);
                          }}
                        >
                          {item.forecast}
                        </td>
                        {isForecastRange && (
                          <td className={`font-medium ${item.monthSupply > 6 ? "text-red" : item.monthSupply > 3 ? "text-orange" : "text-green"}`}>
                            {item.monthSupply}M
                          </td>
                        )}
                        <td
                          className="text-gray font-medium"
                          style={{ cursor: 'pointer', color: '#2563eb' }}
                          onClick={() => {
                            setDrawerData({
                              product: item,
                              details: safetyStockDetails[item.product_id],
                              dateRange: safetyStockPeriod
                            });
                            setDrawerType('safety');
                            setShowForecastDrawer(true);
                          }}
                        >
                          {item.safetyStock}
                        </td>
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
                      </>
                    )}
                    {showExcess && (
                      // --- FIX 4 of 4: Update table data cells ---
                      <>
                        <td className="font-medium text-orange">{item.excess > 0 ? item.excess : '-'}</td>
                        <td className="font-medium text-red">{item.shortage > 0 ? item.shortage : '-'}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="demand-supply-section">{/* Demand/Supply overview remains the same */}</div>
      </div>
      {/* Forecast Modal */}
      {showForecastModal && (
        <div className="modal-overlay" onClick={() => setShowForecastModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Select Forecast Period Range</h3>
            <div className="modal-form">
              <div className="modal-row">
                <span className="modal-row-label">From:</span>
                <select value={selectedForecastFromYear} onChange={(e) => setSelectedForecastFromYear(e.target.value)}>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
                <select value={selectedForecastFromMonth} onChange={(e) => setSelectedForecastFromMonth(e.target.value)}>
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="modal-row">
                <span className="modal-row-label">To:</span>
                <select value={selectedForecastToYear} onChange={(e) => setSelectedForecastToYear(e.target.value)}>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
                <select value={selectedForecastToMonth} onChange={(e) => setSelectedForecastToMonth(e.target.value)}>
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button onClick={() => {
                  updateForecastMonth(
                    selectedForecastFromMonth, selectedForecastFromYear,
                    selectedForecastToMonth, selectedForecastToYear
                  );
                  setShowForecastModal(false);
                }}>Submit</button>
                <button onClick={() => setShowForecastModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Safety Stock Modal */}
      {showSafetyStockModal && (
        <div className="modal-overlay" onClick={() => setShowSafetyStockModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Select Safety Stock Period Range</h3>
            <div className="modal-form">
              <div className="modal-row">
                <span className="modal-row-label">From:</span>
                <select value={selectedSafetyFromYear} onChange={(e) => setSelectedSafetyFromYear(e.target.value)}>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
                <select value={selectedSafetyFromMonth} onChange={(e) => setSelectedSafetyFromMonth(e.target.value)}>
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="modal-row">
                <span className="modal-row-label">To:</span>
                <select value={selectedSafetyToYear} onChange={(e) => setSelectedSafetyToYear(e.target.value)}>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
                <select value={selectedSafetyToMonth} onChange={(e) => setSelectedSafetyToMonth(e.target.value)}>
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button onClick={() => {
                  updateSafetyStockPeriod(
                    selectedSafetyFromMonth, selectedSafetyFromYear,
                    selectedSafetyToMonth, selectedSafetyToYear
                  );
                  setShowSafetyStockModal(false);
                }}>Submit</button>
                <button onClick={() => setShowSafetyStockModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showProductModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
          <div className="modal-content product-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedProduct.product_name}</h3>
              <button className="modal-close" onClick={() => setShowProductModal(false)}>×</button>
            </div>

            {loadingDetails ? (
              <div className="modal-loading">Loading product details...</div>
            ) : productDetails ? (
              <div className="product-detail-content">

                {/* Finished Goods Fields */}
                {productDetails?.itemType === 'Finished goods' && (
                  <>
                    <div className="detail-row"><span>Planner Code:</span><span>{productDetails.plannerCode || 'N/A'}</span></div>
                    <div className="detail-row"><span>Org:</span><span>{productDetails.org || 'N/A'}</span></div>
                    <div className="detail-row"><span>Item Description:</span><span>{productDetails.itemDescription || 'N/A'}</span></div>
                    <div className="detail-row"><span>UOM:</span><span>{productDetails.uom || 'N/A'}</span></div>
                    <div className="detail-row"><span>Work Order:</span><span>{productDetails.workOrderList?.join(', ') || 'None'}</span></div>
                    <div className="detail-row"><span>Sales Order Qty:</span><span>{productDetails.salesOrderQty || 0}</span></div>
                    <div className="detail-row"><span>Sales Orders:</span><span>{productDetails.salesOrderList?.join(', ') || 'None'}</span></div>
                    <div className="detail-row"><span>Required WO QTY:</span><span>{productDetails.requiredWoQty || 0}</span></div>
                    <div className="detail-row"><span>Issued WO Qty:</span><span>{productDetails.issuedWoQty || 0}</span></div>
                    <div className="detail-row"><span>Open WO QTY:</span><span>{productDetails.openWoQty || 0}</span></div>
                    <div className="detail-row"><span>Consumption 3M Avg:</span><span>{productDetails.consumption3MAvg || 0}</span></div>
                    <div className="detail-row"><span>Consumption 12M Avg:</span><span>{productDetails.consumption12MAvg || 0}</span></div>
                    <div className="detail-row"><span>Variance 12M to 3M:</span><span>{productDetails.variance12MTo3M || 0}</span></div>
                    <div className="detail-row"><span>On Hand Nettable:</span><span>{productDetails.onHandNettable || 0}</span></div>
                    <div className="detail-row"><span>Months Supply (Nettable):</span><span>{productDetails.monthsSupplyNettable || 0}</span></div>
                    <div className="detail-row"><span>On Hand Non-Nettable:</span><span>{productDetails.onHandNonNettable || 0}</span></div>
                    <div className="detail-row"><span>Months Supply (Non-Nettable):</span><span>{productDetails.monthsSupplyNonNettable || 0}</span></div>
                    <div className="detail-row"><span>On Hand to Safety Stock %:</span><span>{productDetails.onHandToSafetyStockPercent || 0}%</span></div>
                    <div className="detail-row"><span>OH - Expiry:</span><span>{productDetails.ohExpiry || 'N/A'}</span></div>
                    <div className="detail-row"><span>ATP:</span><span>{productDetails.atp || 0}</span></div>
                  </>
                )}

                {/* Sub Assembly WITH BOM - Show Work Order Fields */}
                {productDetails?.itemType === 'Sub assembly' && productDetails?.hasBOM && (
                  <>
                    <div className="detail-row"><span>Planner Code:</span><span>{productDetails.plannerCode || 'N/A'}</span></div>
                    <div className="detail-row"><span>Org:</span><span>{productDetails.org || 'N/A'}</span></div>
                    <div className="detail-row"><span>Item Description:</span><span>{productDetails.itemDescription || 'N/A'}</span></div>
                    <div className="detail-row"><span>UOM:</span><span>{productDetails.uom || 'N/A'}</span></div>
                    <div className="detail-row"><span>Work Order:</span><span>{productDetails.workOrderList?.join(', ') || 'None'}</span></div>
                    <div className="detail-row"><span>Required WO QTY:</span><span>{productDetails.requiredWoQty || 0}</span></div>
                    <div className="detail-row"><span>Issued WO Qty:</span><span>{productDetails.issuedWoQty || 0}</span></div>
                    <div className="detail-row"><span>Open WO QTY:</span><span>{productDetails.openWoQty || 0}</span></div>
                    <div className="detail-row"><span>Internal Requisition:</span><span>{productDetails.internalRequisition || 0}</span></div>
                    <div className="detail-row"><span>Intransit Shipment:</span><span>{productDetails.intransitShipment || 0}</span></div>
                    <div className="detail-row"><span>Intransit Receipts:</span><span>{productDetails.intransitReceipts || 0}</span></div>
                    <div className="detail-row"><span>Transfer Order:</span><span>{productDetails.transferOrder || 'N/A'}</span></div>
                    <div className="detail-row"><span>ATP:</span><span>{productDetails.atp || 0}</span></div>
                    <div className="detail-row"><span>Consumption 3M Avg:</span><span>{productDetails.consumption3MAvg || 0}</span></div>
                    <div className="detail-row"><span>Consumption 12M Avg:</span><span>{productDetails.consumption12MAvg || 0}</span></div>
                    <div className="detail-row"><span>Variance 12M to 3M:</span><span>{productDetails.variance12MTo3M || 0}</span></div>
                    <div className="detail-row"><span>On Hand Nettable:</span><span>{productDetails.onHandNettable || 0}</span></div>
                    <div className="detail-row"><span>Months Supply (Nettable):</span><span>{productDetails.monthsSupplyNettable || 0}</span></div>
                    <div className="detail-row"><span>On Hand Non-Nettable:</span><span>{productDetails.onHandNonNettable || 0}</span></div>
                    <div className="detail-row"><span>Months Supply (Non-Nettable):</span><span>{productDetails.monthsSupplyNonNettable || 0}</span></div>
                    <div className="detail-row"><span>On Hand to Safety Stock %:</span><span>{productDetails.onHandToSafetyStockPercent || 0}%</span></div>
                    <div className="detail-row"><span>OH - Expiry:</span><span>{productDetails.ohExpiry || 'N/A'}</span></div>
                  </>
                )}

                {/* Sub Assembly WITHOUT BOM - Show Purchase Order Fields */}
                {productDetails?.itemType === 'Sub assembly' && !productDetails?.hasBOM && (
                  <>
                    <div className="detail-row"><span>Buyer Code:</span><span>{productDetails.buyerCode || 'N/A'}</span></div>
                    <div className="detail-row"><span>Org:</span><span>{productDetails.org || 'N/A'}</span></div>
                    <div className="detail-row"><span>Item Description:</span><span>{productDetails.itemDescription || 'N/A'}</span></div>
                    <div className="detail-row"><span>UOM:</span><span>{productDetails.uom || 'N/A'}</span></div>
                    <div className="detail-row"><span>Open PO Qty:</span><span>{productDetails.openPoQty || 0}</span></div>
                    <div className="detail-row"><span>Purchase Order (PO):</span><span>{productDetails.purchaseOrderList?.join(', ') || 'None'}</span></div>
                    <div className="detail-row"><span>Purchase Requisition (PR):</span><span>{productDetails.purchaseRequisitionList?.join(', ') || 'None'}</span></div>
                    <div className="detail-row"><span>PO In Receiving:</span><span>{productDetails.poInReceiving || 0}</span></div>
                    <div className="detail-row"><span>PO Acknowledgement:</span><span>{Array.isArray(productDetails.poAcknowledgementList) ? productDetails.poAcknowledgementList.join(', ') : (productDetails.poAcknowledgementList || 'None')}</span></div>

                    {/* Two Column Flow Section */}
                    <div className="two-column-section">
                      <div className="flow-column">
                        <div className="flow-header">Supplier → Warehouse</div>
                        <div className="detail-row"><span>Requested Inbound Shipment:</span><span>{productDetails.requestedInboundShipment || 0}</span></div>
                        <div className="detail-row"><span>Planned Inbound Shipment:</span><span>{productDetails.plannedInboundShipment || 0}</span></div>
                        <div className="detail-row"><span>Intransit Shipment:</span><span>{productDetails.intransitShipment || 0}</span></div>
                        <div className="detail-row"><span>Intransit Receipts:</span><span>{productDetails.intransitReceipts || 0}</span></div>
                      </div>
                      <div className="flow-column">
                        <div className="flow-header">Warehouse ↔ Warehouse</div>
                        <div className="detail-row"><span>Internal Requisition:</span><span>{productDetails.internalRequisition || 0}</span></div>
                        <div className="detail-row"><span>Transfer Order:</span><span>{productDetails.transferOrder || 'N/A'}</span></div>
                        <div className="detail-row"><span>Intransit Shipment:</span><span>{productDetails.intransitShipment || 0}</span></div>
                        <div className="detail-row"><span>Intransit Receipts:</span><span>{productDetails.intransitReceipts || 0}</span></div>
                      </div>
                    </div>

                    <div className="detail-row"><span>ATP:</span><span>{productDetails.atp || 0}</span></div>
                    <div className="detail-row"><span>Consumption 3M Avg:</span><span>{productDetails.consumption3MAvg || 0}</span></div>
                    <div className="detail-row"><span>Consumption 12M Avg:</span><span>{productDetails.consumption12MAvg || 0}</span></div>
                    <div className="detail-row"><span>Variance 12M to 3M:</span><span>{productDetails.variance12MTo3M || 0}</span></div>
                    <div className="detail-row"><span>On Hand Nettable:</span><span>{productDetails.onHandNettable || 0}</span></div>
                    <div className="detail-row"><span>Months Supply (Nettable):</span><span>{productDetails.monthsSupplyNettable || 0}</span></div>
                    <div className="detail-row"><span>On Hand Non-Nettable:</span><span>{productDetails.onHandNonNettable || 0}</span></div>
                    <div className="detail-row"><span>Months Supply (Non-Nettable):</span><span>{productDetails.monthsSupplyNonNettable || 0}</span></div>
                    <div className="detail-row"><span>On Hand to Safety Stock %:</span><span>{productDetails.onHandToSafetyStockPercent || 0}%</span></div>
                    <div className="detail-row"><span>OH - Expiry:</span><span>{productDetails.ohExpiry || 'N/A'}</span></div>
                  </>
                )}

                {/* Raw Material Fields */}
                {productDetails?.itemType === 'Raw material' && (
                  <>
                    <div className="detail-row"><span>Buyer Code:</span><span>{productDetails.buyerCode || 'N/A'}</span></div>
                    <div className="detail-row"><span>Org:</span><span>{productDetails.org || 'N/A'}</span></div>
                    <div className="detail-row"><span>Item Description:</span><span>{productDetails.itemDescription || 'N/A'}</span></div>
                    <div className="detail-row"><span>UOM:</span><span>{productDetails.uom || 'N/A'}</span></div>
                    <div className="detail-row"><span>Open PO Qty:</span><span>{productDetails.openPoQty || 0}</span></div>
                    <div className="detail-row"><span>Purchase Order (PO):</span><span>{productDetails.purchaseOrderList?.join(', ') || 'None'}</span></div>
                    <div className="detail-row"><span>Purchase Requisition (PR):</span><span>{productDetails.purchaseRequisitionList?.join(', ') || 'None'}</span></div>
                    <div className="detail-row"><span>PO In Receiving:</span><span>{productDetails.poInReceiving || 0}</span></div>
                    <div className="detail-row"><span>PO Acknowledgement:</span><span>{productDetails.poAcknowledgementList?.join(', ') || 'None'}</span></div>

                    {/* Two Column Flow Section */}
                    <div className="two-column-section">
                      <div className="flow-column">
                        <div className="flow-header">Supplier → Warehouse</div>
                        <div className="detail-row"><span>Requested Inbound Shipment:</span><span>{productDetails.requestedInboundShipment || 0}</span></div>
                        <div className="detail-row"><span>Planned Inbound Shipment:</span><span>{productDetails.plannedInboundShipment || 0}</span></div>
                        <div className="detail-row"><span>Intransit Shipment:</span><span>{productDetails.intransitShipment || 0}</span></div>
                        <div className="detail-row"><span>Intransit Receipts:</span><span>{productDetails.intransitReceipts || 0}</span></div>
                      </div>
                      <div className="flow-column">
                        <div className="flow-header">Warehouse ↔ Warehouse</div>
                        <div className="detail-row"><span>Internal Requisition:</span><span>{productDetails.internalRequisition || 0}</span></div>
                        <div className="detail-row"><span>Transfer Order:</span><span>{productDetails.transferOrder || 'N/A'}</span></div>
                        <div className="detail-row"><span>Intransit Shipment:</span><span>{productDetails.intransitShipment || 0}</span></div>
                        <div className="detail-row"><span>Intransit Receipts:</span><span>{productDetails.intransitReceipts || 0}</span></div>
                      </div>
                    </div>

                    <div className="detail-row"><span>ATP:</span><span>{productDetails.atp || 0}</span></div>
                    <div className="detail-row"><span>Consumption 3M Avg:</span><span>{productDetails.consumption3MAvg || 0}</span></div>
                    <div className="detail-row"><span>Consumption 12M Avg:</span><span>{productDetails.consumption12MAvg || 0}</span></div>
                    <div className="detail-row"><span>Variance 12M to 3M:</span><span>{productDetails.variance12MTo3M || 0}</span></div>
                    <div className="detail-row"><span>On Hand Nettable:</span><span>{productDetails.onHandNettable || 0}</span></div>
                    <div className="detail-row"><span>Months Supply (Nettable):</span><span>{productDetails.monthsSupplyNettable || 0}</span></div>
                    <div className="detail-row"><span>On Hand Non-Nettable:</span><span>{productDetails.onHandNonNettable || 0}</span></div>
                    <div className="detail-row"><span>Months Supply (Non-Nettable):</span><span>{productDetails.monthsSupplyNonNettable || 0}</span></div>
                    <div className="detail-row"><span>On Hand to Safety Stock %:</span><span>{productDetails.onHandToSafetyStockPercent || 0}%</span></div>
                    <div className="detail-row"><span>OH - Expiry:</span><span>{productDetails.ohExpiry || 'N/A'}</span></div>
                  </>
                )}
              </div>
            ) : (
              <div className="modal-error">Failed to load product details</div>
            )}
          </div>
        </div>
      )}
      {/* Forecast/Safety Stock Drawer */}
      {showForecastDrawer && drawerData && (
        <ForecastDrawer
          data={drawerData}
          type={drawerType}
          onClose={() => setShowForecastDrawer(false)}
        />
      )}
    </div>
  );
};

// Forecast/Safety Stock Drawer Component
const ForecastDrawer = ({ data, type, onClose }) => {
  const { product, details, dateRange } = data;

  if (!details) return null;

  React.useEffect(() => {
    const handleMouseOver = (e) => {
      if (e.target.classList.contains('chart-point')) {
        const tooltip = document.getElementById('chart-tooltip');
        const tooltipText = e.target.getAttribute('data-tooltip');
        const rect = e.target.getBoundingClientRect();
        const container = e.target.closest('.drawer-section');
        const containerRect = container.getBoundingClientRect();

        tooltip.textContent = tooltipText;
        tooltip.style.display = 'block';
        tooltip.style.left = (rect.left - containerRect.left + rect.width / 2) + 'px';
        tooltip.style.top = (rect.top - containerRect.top) + 'px';
      }
    };

    const handleMouseOut = (e) => {
      if (e.target.classList.contains('chart-point')) {
        const tooltip = document.getElementById('chart-tooltip');
        tooltip.style.display = 'none';
      }
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, []);

  // Prepare chart data
  const monthEntries = Object.entries(details).map(([month, value]) => ({
    month: month.split(' ')[0], // Short month name
    value: value || 0
  }));

  // Calculate insights
  const values = monthEntries.map(e => e.value);
  const peak = Math.max(...values);
  const peakMonth = monthEntries.find(e => e.value === peak)?.month;
  const avgValue = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  const firstValue = values[0];
  const lastValue = values[values.length - 1];
  const growth = firstValue > 0 ? (((lastValue - firstValue) / firstValue) * 100).toFixed(1) : 0;

  // Variance data (month-over-month change %)
  const varianceData = monthEntries.map((entry, idx) => {
    if (idx === 0) return { ...entry, change: 0 };
    const prevValue = monthEntries[idx - 1].value;
    const change = prevValue > 0 ? (((entry.value - prevValue) / prevValue) * 100).toFixed(1) : 0;
    return { ...entry, change: parseFloat(change) };
  });

  return (
    <>
      <div className="forecast-drawer-overlay" onClick={onClose}></div>
      <div className="forecast-drawer">
        {/* Header */}
        <div className="drawer-header">
          <div>
            <h3>{product.product_name}</h3>
            <p className="drawer-subtitle">
              {product.sku} • {type === 'forecast' ? 'Forecast' : 'Safety Stock'} • {dateRange}
            </p>
          </div>
          <button className="drawer-close" onClick={onClose}>×</button>
        </div>

        {/* Line Chart - 12 Month Trend */}
        <div className="drawer-section">
          <h4><LineChart size={16} style={{ display: 'inline', marginRight: '8px' }} /> Month {type === 'forecast' ? 'Forecast' : 'Safety Stock'} Trend</h4>
          <div style={{ width: '100%', height: 200, position: 'relative', padding: '0 40px 0 20px' }}>
            {/* Area Chart with Gradient */}
            <svg width="100%" height="100%" viewBox="0 0 600 180" preserveAspectRatio="none">
              <defs>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 0.3 }} />
                  <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 0.05 }} />
                </linearGradient>
              </defs>

              {/* Y-Axis */}
              <line x1="30" y1="10" x2="30" y2="150" stroke="#e5e7eb" strokeWidth="1" />

              {/* X-Axis */}
              <line x1="30" y1="150" x2="570" y2="150" stroke="#e5e7eb" strokeWidth="1" />

              {/* Grid Lines (Horizontal) */}
              {[0, 1, 2, 3, 4].map(i => (
                <line
                  key={`grid-${i}`}
                  x1="30"
                  y1={10 + (i * 35)}
                  x2="570"
                  y2={10 + (i * 35)}
                  stroke="#f3f4f6"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              ))}

              {/* Y-Axis Labels */}
              {[0, 1, 2, 3, 4].map(i => {
                const value = Math.round(peak - (i * peak / 4));
                return (
                  <text
                    key={`ylabel-${i}`}
                    x="25"
                    y={10 + (i * 35) + 4}
                    textAnchor="end"
                    fontSize="11"
                    fill="#6b7280"
                  >
                    {value}
                  </text>
                );
              })}

              {/* Area Fill */}
              <polygon
                points={[
                  ...monthEntries.map((d, i) =>
                    `${(i / (monthEntries.length - 1)) * 540 + 30},${150 - ((d.value / peak) * 130)}`
                  ),
                  `${540 + 30},150`, // Bottom right
                  `30,150` // Bottom left
                ].join(' ')}
                fill="url(#areaGradient)"
              />

              {/* Line */}
              <polyline
                points={monthEntries.map((d, i) =>
                  `${(i / (monthEntries.length - 1)) * 540 + 30},${150 - ((d.value / peak) * 130)}`
                ).join(' ')}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
              />

              {/* Data Points */}
              {monthEntries.map((d, i) => {
                const fullMonth = Object.keys(details)[i];
                return (
                  <g key={i}>
                    <circle
                      cx={(i / (monthEntries.length - 1)) * 540 + 30}
                      cy={150 - ((d.value / peak) * 130)}
                      r="4"
                      fill="white"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      className="chart-point"
                      data-tooltip={`${fullMonth} - ${d.value}`}
                    />
                  </g>
                );
              })}

              {/* X-Axis Labels */}
              {monthEntries.map((d, i) => (
                <text
                  key={`xlabel-${i}`}
                  x={(i / (monthEntries.length - 1)) * 540 + 30}
                  y="168"
                  textAnchor="middle"
                  fontSize="11"
                  fill="#6b7280"
                >
                  {d.month}
                </text>
              ))}
            </svg>
            <div id="chart-tooltip" className="chart-tooltip"></div>
          </div>
        </div>

        {/* Bar Chart - Monthly Forecast Values */}
        <div className="drawer-section">
          <h4><BarChart3 size={16} style={{ display: 'inline', marginRight: '8px' }} /> Monthly {type === 'forecast' ? 'Forecast' : 'Safety Stock'} Values</h4>
          <div className="variance-bars">
            {monthEntries.map((item, idx) => (
              <div key={idx} className="variance-bar-item">
                <span className="variance-month">{item.month}</span>
                <div className="variance-bar-track">
                  <div
                    className="variance-bar-fill positive"
                    style={{ width: `${(item.value / peak) * 100}%`, maxWidth: '100%' }}
                  >
                    <span className="variance-label">{item.value}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <div className="drawer-section">
          <h4><ClipboardList size={16} style={{ display: 'inline', marginRight: '8px' }} /> Monthly Breakdown</h4>
          <table className="drawer-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Value</th>
                <th>Change</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {varianceData.map((item, idx) => (
                <tr key={idx}>
                  <td>{Object.keys(details)[idx]}</td>
                  <td><strong>{item.value}</strong></td>
                  <td className={item.change >= 0 ? 'text-green' : 'text-red'}>
                    {idx === 0 ? '--' : `${item.change > 0 ? '+' : ''}${item.change}%`}
                  </td>
                  <td>
                    {item.value >= avgValue ?
                      <span style={{ color: '#059669' }}>✓</span> :
                      <span style={{ color: '#d97706' }}>⚠</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Key Insights */}
        <div className="drawer-section insights-section">
          <h4><Lightbulb size={16} style={{ display: 'inline', marginRight: '8px' }} /> Key Insights</h4>
          <ul className="insights-list">
            <li><strong>Peak:</strong> {peakMonth} ({peak} units)</li>
            <li><strong>Average:</strong> {avgValue} units/month</li>
            <li>
              <strong>Trend:</strong>
              <span className={growth >= 0 ? 'text-green' : 'text-red'}>
                {growth >= 0 ? ' ↑' : ' ↓'} {Math.abs(growth)}% {growth >= 0 ? 'growth' : 'decline'}
              </span>
            </li>
            <li><strong>Volatility:</strong> {Math.abs(growth) > 10 ? 'High' : Math.abs(growth) > 5 ? 'Moderate' : 'Low'}</li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default InventoryPage;