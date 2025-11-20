import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, ChevronLeft, ChevronRight, Package, AlertTriangle, ChevronDown } from 'lucide-react';
import '../styles/InventoryHub.css';
import apiClient from '../services/apiclient'; // --- 1. IMPORT apiClient ---

// Utility function for class names
const cn = (...classes) => classes.filter(Boolean).join(' ');

// ... (All sub-components like usePagination, CSSLineChart, RevenueCard, etc., remain unchanged) ...
// Pagination Hook
const usePagination = ({ currentPage, totalPages, paginationItemsToDisplay = 5 }) => {
  const half = Math.floor(paginationItemsToDisplay / 2);
  let start = Math.max(currentPage - half, 1);
  let end = Math.min(start + paginationItemsToDisplay - 1, totalPages);

  if (end - start + 1 < paginationItemsToDisplay) {
    start = Math.max(end - paginationItemsToDisplay + 1, 1);
  }

  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  const showLeftEllipsis = pages[0] > 1;
  const showRightEllipsis = pages[pages.length - 1] < totalPages;

  return { pages, showLeftEllipsis, showRightEllipsis };
};

// CSS Line Chart Component with Month Labels
const CSSLineChart = ({ data, months }) => {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || maxValue * 0.1; // Use 10% of max if all values are same

  return (
    <div className="css-line-chart">
      {data.map((value, index) => {
        // Calculate height percentage relative to min/max range
        // Scale to 20-80% range for better visualization
        const normalizedHeight = ((value - minValue) / range) * 60 + 20;
        const heightPercentage = Math.min(Math.max(normalizedHeight, 20), 80);
        
        return (
          <div
            key={index}
            className="chart-point"
            style={{
              '--height': `${heightPercentage}%`,
              '--index': index
            }}
          >
            <div 
              className="chart-bar" 
              style={{ height: `${heightPercentage}%` }}
            />
            <div className="chart-tooltip">
              <span className="chart-tooltip-month">{months[index]}</span>
              <span className="chart-tooltip-value">
                ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Revenue Card Component
const RevenueCard = ({ totalRevenue, percentageChange, monthlyData, monthLabels }) => {
  return (
    <div className="kpi-card revenue-card">
      <div className="revenue-content">
        <span className="kpi-label">Total Revenue</span>
        <span className="kpi-value">${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        <span className={`percentage-change ${percentageChange >= 0 ? 'positive' : 'negative'}`}>
          {percentageChange >= 0 ? '+' : ''}{percentageChange}% from last month
        </span>
      </div>
      <div className="revenue-chart">
        <CSSLineChart data={monthlyData} months={monthLabels} />
      </div>
    </div>
  );
};

// Excess/Shortage Card Component - Shows ALL items
const ExcessShortageCard = ({ title, totalValue, items, type }) => {
  return (
    <div className="kpi-card excess-shortage-card">
      <div className="card-header">
        <div className="header-content">
          {type === 'excess' ? (
            <Package className="card-icon" size={20} />
          ) : (
            <AlertTriangle className="card-icon" size={20} />
          )}
          <div>
            <span className="kpi-label">{title}</span>
            <span className="kpi-value">{totalValue}</span>
          </div>
        </div>
      </div>

      <div className="items-list-container">
        <div className="items-list">
          {items.length === 0 ? (
            <div className="no-items">No items found</div>
          ) : (
            items.map((item, index) => (
              <div key={index} className="item-row">
                <span className="item-name">{item.name}</span>
                <span className={`item-qty ${type}`}>
                  {Math.abs(item.quantity)} units
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Custom Dropdown Component
const CustomDropdown = ({ options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="custom-dropdown" ref={dropdownRef}>
      <button 
        className="dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{value || placeholder}</span>
        <ChevronDown size={16} className={`chevron ${isOpen ? 'open' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="dropdown-menu">
          <div 
            className={`dropdown-item ${!value ? 'active' : ''}`}
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
          >
            All
          </div>
          {options.map((option, index) => (
            <div
              key={index}
              className={`dropdown-item ${value === option ? 'active' : ''}`}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const getStatusStyle = (status) => {
    const lowerStatus = status?.toLowerCase() || '';
    if (lowerStatus.includes('active') && !lowerStatus.includes('inactive')) return 'status-active';
    if (lowerStatus.includes('inactive')) return 'status-inactive';
    if (lowerStatus.includes('obsolete')) return 'status-obsolete';
    return 'status-default';
  };

  return (
    <span className={`status-badge ${getStatusStyle(status)}`}>
      {status}
    </span>
  );
};

// Centered Pagination Component
const CenteredPagination = ({ currentPage, totalPages, onPageChange }) => {
  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage,
    totalPages,
    paginationItemsToDisplay: 5,
  });

  const handlePageChange = (page) => (e) => {
    e.preventDefault();
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  return (
    <div className="pagination-wrapper">
      <div className="pagination">
        <button
          className={cn("pagination-btn", currentPage === 1 && "disabled")}
          onClick={handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft size={16} />
        </button>

        {showLeftEllipsis && <span className="pagination-ellipsis">...</span>}

        {pages.map((page) => (
          <button
            key={page}
            className={cn("pagination-btn", page === currentPage && "active")}
            onClick={handlePageChange(page)}
          >
            {page}
          </button>
        ))}

        {showRightEllipsis && <span className="pagination-ellipsis">...</span>}

        <button
          className={cn("pagination-btn", currentPage === totalPages && "disabled")}
          onClick={handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

// Helper function to generate month labels (last 6 months)
const generateMonthLabels = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const labels = [];
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(months[date.getMonth()]);
  }
  
  return labels;
};

// IMPROVED: Generate realistic mock revenue data for last 6 months
const generateMockRevenueData = (currentRevenue) => {
  const monthlyData = [];
  
  // Create more realistic data with growth pattern
  // Start at about 70% of current and grow towards current
  const startRevenue = currentRevenue * 0.70;
  const growth = (currentRevenue - startRevenue) / 5; // Growth per month
  
  for (let i = 0; i < 5; i++) {
    // Add some random variation (±5%) to make it look natural
    const randomVariation = 1 + (Math.random() * 0.1 - 0.05);
    const value = (startRevenue + (growth * i)) * randomVariation;
    monthlyData.push(parseFloat(value.toFixed(2)));
  }
  
  // Add current month's actual revenue
  monthlyData.push(currentRevenue);
  
  return monthlyData;
};


// Main Inventory Hub Component
const InventoryHub = () => {
  const [inventory, setInventory] = useState([]);
  const [kpiData, setKpiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const monthLabels = useMemo(() => generateMonthLabels(), []);

  // --- 2. REFACTOR KPI FETCH ---
  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const response = await apiClient.get('/api/inventory-kpis');
        const data = response.data;
        
        const monthlyRevenue = generateMockRevenueData(data.total_revenue);
        
        setKpiData({
          ...data,
          monthly_revenue: monthlyRevenue
        });
      } catch (error) {
        console.error('Failed to fetch KPIs:', error);
        setKpiData(null); 
      }
    };

    fetchKPIs();
  }, []);

  // --- 3. REFACTOR INVENTORY FETCH ---
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get("/api/inventory-hub");
        setInventory(response.data);
      } catch (error) {
        console.error('Failed to fetch inventory:', error);
        setInventory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  // Get unique statuses and types for filters
  const uniqueStatuses = useMemo(() => {
    if (!Array.isArray(inventory)) return [];
    return [...new Set(inventory.map(item => item.itemStatus).filter(Boolean))].sort();
  }, [inventory]);

  const uniqueTypes = useMemo(() => {
    if (!Array.isArray(inventory)) return [];
    return [...new Set(inventory.map(item => item.itemType).filter(Boolean))].sort();
  }, [inventory]);

  // Filter inventory
  const filteredInventory = useMemo(() => {
    if (!Array.isArray(inventory)) return [];
    
    return inventory.filter(item => {
      const matchesSearch = !searchTerm || 
        item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = !statusFilter || item.itemStatus === statusFilter;
      const matchesType = !typeFilter || item.itemType === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [searchTerm, statusFilter, typeFilter, inventory]);

  const totalPages = Math.ceil(filteredInventory.length / ITEMS_PER_PAGE);
  const paginatedInventory = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredInventory.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredInventory, currentPage]);

  if (loading || !kpiData) return <div className="hub-loading">Loading Inventory Hub...</div>;

  return (
    <div className="inventory-hub-page">
      <div className="hub-kpis">
        <RevenueCard
          totalRevenue={kpiData.total_revenue}
          percentageChange={kpiData.percentage_change}
          monthlyData={kpiData.monthly_revenue}
          monthLabels={monthLabels}
        />

        <ExcessShortageCard
          title="Items with Excess"
          totalValue={kpiData.excess.total_count.toString()}
          items={kpiData.excess.items}
          type="excess"
        />

        <ExcessShortageCard
          title="Items with Shortage"
          totalValue={kpiData.shortage.total_count.toString()}
          items={kpiData.shortage.items}
          type="shortage"
        />
      </div>

      <div className="data-table-wrapper">
        <div className="table-toolbar">
          <div className="search-container">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search by SKU or Product Name"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          
          <div className="filters-containers">
            <CustomDropdown
              options={uniqueStatuses}
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
              placeholder="Status"
            />
            
            <CustomDropdown
              options={uniqueTypes}
              value={typeFilter}
              onChange={(value) => {
                setTypeFilter(value);
                setCurrentPage(1);
              }}
              placeholder="Type"
            />
          </div>
        </div>

        <div className="table-container">
          <table className="hub-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Status</th>
                <th className="text-right">On Hand</th>
                <th>Location</th>
                <th>Item Type</th>
                <th className="text-right">Total Value</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="animated-tbody">
              {paginatedInventory.map((item, index) => (
                <tr key={item.product_id} className="animated-row" style={{ animationDelay: `${index * 0.05}s` }}>
                  <td className="font-medium">{item.sku}</td>
                  <td>{item.product_name}</td>
                  <td><StatusBadge status={item.itemStatus} /></td>
                  <td className="text-right">{item.onHand}</td>
                  <td>{item.location || 'N/A'}</td>
                  <td>{item.itemType || 'N/A'}</td>
                  <td className="text-right">${item.totalValue?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="text-center">
                    <button
                      className="view-details-btn"
                      onClick={() => window.location.href = `/products/${item.product_id}`}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <CenteredPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default InventoryHub;

// import React, { useState, useEffect, useMemo, useRef } from 'react';
// import { Search, ChevronLeft, ChevronRight, Package, AlertTriangle, ChevronDown } from 'lucide-react';
// import '../styles/InventoryHub.css';
// import apiClient from '../services/apiclient';

// // Utility function for class names
// const cn = (...classes) => classes.filter(Boolean).join(' ');

// // Pagination Hook
// const usePagination = ({ currentPage, totalPages, paginationItemsToDisplay = 5 }) => {
//   const half = Math.floor(paginationItemsToDisplay / 2);
//   let start = Math.max(currentPage - half, 1);
//   let end = Math.min(start + paginationItemsToDisplay - 1, totalPages);

//   if (end - start + 1 < paginationItemsToDisplay) {
//     start = Math.max(end - paginationItemsToDisplay + 1, 1);
//   }

//   const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
//   const showLeftEllipsis = pages[0] > 1;
//   const showRightEllipsis = pages[pages.length - 1] < totalPages;

//   return { pages, showLeftEllipsis, showRightEllipsis };
// };

// // CSS Line Chart Component with Month Labels
// const CSSLineChart = ({ data, months }) => {
//   if (!data || data.length === 0) return null;

//   const maxValue = Math.max(...data);
//   const minValue = Math.min(...data);
//   const range = maxValue - minValue || maxValue * 0.1; // Use 10% of max if all values are same

//   return (
//     <div className="css-line-chart">
//       {data.map((value, index) => {
//         // Calculate height percentage relative to min/max range
//         // Scale to 20-80% range for better visualization
//         const normalizedHeight = ((value - minValue) / range) * 60 + 20;
//         const heightPercentage = Math.min(Math.max(normalizedHeight, 20), 80);
        
//         return (
//           <div
//             key={index}
//             className="chart-point"
//             style={{
//               '--height': `${heightPercentage}%`,
//               '--index': index
//             }}
//           >
//             <div 
//               className="chart-bar" 
//               style={{ height: `${heightPercentage}%` }}
//             />
//             <div className="chart-tooltip">
//               <span className="chart-tooltip-month">{months[index]}</span>
//               <span className="chart-tooltip-value">
//                 ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//               </span>
//             </div>
//           </div>
//         );
//       })}
//     </div>
//   );
// };

// // Revenue Card Component
// const RevenueCard = ({ totalRevenue, percentageChange, monthlyData, monthLabels }) => {
//   return (
//     <div className="kpi-card revenue-card">
//       <div className="revenue-content">
//         <span className="kpi-label">Total Revenue</span>
//         <span className="kpi-value">${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
//         <span className={`percentage-change ${percentageChange >= 0 ? 'positive' : 'negative'}`}>
//           {percentageChange >= 0 ? '+' : ''}{percentageChange}% from last month
//         </span>
//       </div>
//       <div className="revenue-chart">
//         <CSSLineChart data={monthlyData} months={monthLabels} />
//       </div>
//     </div>
//   );
// };

// // Excess/Shortage Card Component - Shows ALL items
// const ExcessShortageCard = ({ title, totalValue, items, type }) => {
//   return (
//     <div className="kpi-card excess-shortage-card">
//       <div className="card-header">
//         <div className="header-content">
//           {type === 'excess' ? (
//             <Package className="card-icon" size={20} />
//           ) : (
//             <AlertTriangle className="card-icon" size={20} />
//           )}
//           <div>
//             <span className="kpi-label">{title}</span>
//             <span className="kpi-value">{totalValue}</span>
//           </div>
//         </div>
//       </div>

//       <div className="items-list-container">
//         <div className="items-list">
//           {items.length === 0 ? (
//             <div className="no-items">No items found</div>
//           ) : (
//             items.map((item, index) => (
//               <div key={index} className="item-row">
//                 <span className="item-name">{item.name}</span>
//                 <span className={`item-qty ${type}`}>
//                   {Math.abs(item.quantity)} units
//                 </span>
//               </div>
//             ))
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// // Custom Dropdown Component
// const CustomDropdown = ({ options, value, onChange, placeholder }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const dropdownRef = useRef(null);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//         setIsOpen(false);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   return (
//     <div className="custom-dropdown" ref={dropdownRef}>
//       <button 
//         className="dropdown-trigger"
//         onClick={() => setIsOpen(!isOpen)}
//       >
//         <span>{value || placeholder}</span>
//         <ChevronDown size={16} className={`chevron ${isOpen ? 'open' : ''}`} />
//       </button>
      
//       {isOpen && (
//         <div className="dropdown-menu">
//           <div 
//             className={`dropdown-item ${!value ? 'active' : ''}`}
//             onClick={() => {
//               onChange('');
//               setIsOpen(false);
//             }}
//           >
//             All
//           </div>
//           {options.map((option, index) => (
//             <div
//               key={index}
//               className={`dropdown-item ${value === option ? 'active' : ''}`}
//               onClick={() => {
//                 onChange(option);
//                 setIsOpen(false);
//               }}
//             >
//               {option}
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// // Status Badge Component
// const StatusBadge = ({ status }) => {
//   const getStatusStyle = (status) => {
//     const lowerStatus = status?.toLowerCase() || '';
//     if (lowerStatus.includes('active') && !lowerStatus.includes('inactive')) return 'status-active';
//     if (lowerStatus.includes('inactive')) return 'status-inactive';
//     if (lowerStatus.includes('obsolete')) return 'status-obsolete';
//     return 'status-default';
//   };

//   return (
//     <span className={`status-badge ${getStatusStyle(status)}`}>
//       {status}
//     </span>
//   );
// };

// // Centered Pagination Component
// const CenteredPagination = ({ currentPage, totalPages, onPageChange }) => {
//   const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
//     currentPage,
//     totalPages,
//     paginationItemsToDisplay: 5,
//   });

//   const handlePageChange = (page) => (e) => {
//     e.preventDefault();
//     if (page >= 1 && page <= totalPages) {
//       onPageChange(page);
//     }
//   };

//   return (
//     <div className="pagination-wrapper">
//       <div className="pagination">
//         <button
//           className={cn("pagination-btn", currentPage === 1 && "disabled")}
//           onClick={handlePageChange(currentPage - 1)}
//           disabled={currentPage === 1}
//         >
//           <ChevronLeft size={16} />
//         </button>

//         {showLeftEllipsis && <span className="pagination-ellipsis">...</span>}

//         {pages.map((page) => (
//           <button
//             key={page}
//             className={cn("pagination-btn", page === currentPage && "active")}
//             onClick={handlePageChange(page)}
//           >
//             {page}
//           </button>
//         ))}

//         {showRightEllipsis && <span className="pagination-ellipsis">...</span>}

//         <button
//           className={cn("pagination-btn", currentPage === totalPages && "disabled")}
//           onClick={handlePageChange(currentPage + 1)}
//           disabled={currentPage === totalPages}
//         >
//           <ChevronRight size={16} />
//         </button>
//       </div>
//     </div>
//   );
// };

// // Helper function to generate month labels (last 6 months)
// const generateMonthLabels = () => {
//   const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
//   const now = new Date();
//   const labels = [];
  
//   for (let i = 5; i >= 0; i--) {
//     const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
//     labels.push(months[date.getMonth()]);
//   }
  
//   return labels;
// };

// // IMPROVED: Generate realistic mock revenue data for last 6 months
// const generateMockRevenueData = (currentRevenue) => {
//   const monthlyData = [];
  
//   // Create more realistic data with growth pattern
//   // Start at about 70% of current and grow towards current
//   const startRevenue = currentRevenue * 0.70;
//   const growth = (currentRevenue - startRevenue) / 5; // Growth per month
  
//   for (let i = 0; i < 5; i++) {
//     // Add some random variation (±5%) to make it look natural
//     const randomVariation = 1 + (Math.random() * 0.1 - 0.05);
//     const value = (startRevenue + (growth * i)) * randomVariation;
//     monthlyData.push(parseFloat(value.toFixed(2)));
//   }
  
//   // Add current month's actual revenue
//   monthlyData.push(currentRevenue);
  
//   return monthlyData;
// };

// // Main Inventory Hub Component
// const InventoryHub = () => {
//   const [inventory, setInventory] = useState([]);
//   const [kpiData, setKpiData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [statusFilter, setStatusFilter] = useState('');
//   const [typeFilter, setTypeFilter] = useState('');
//   const [currentPage, setCurrentPage] = useState(1);
//   const ITEMS_PER_PAGE = 10;

//   // Generate month labels
//   const monthLabels = useMemo(() => generateMonthLabels(), []);

//   // Fetch KPI data
//   useEffect(() => {
//     const fetchKPIs = async () => {
//       try {
//         const response = await fetch('/api/inventory-kpis');
        
//         if (!response.ok) {
//           throw new Error(`HTTP error! Status: ${response.status}`);
//         }
        
//         const data = await response.json();
        
//         // Generate monthly revenue data with mock values for last 5 months
//         const monthlyRevenue = generateMockRevenueData(data.total_revenue);
        
//         setKpiData({
//           ...data,
//           monthly_revenue: monthlyRevenue
//         });
//       } catch (error) {
//         console.error('Failed to fetch KPIs:', error);
//         setKpiData(null); 
//       }
//     };

//     fetchKPIs();
//   }, []);

//   // Fetch inventory data
//   useEffect(() => {
//     const fetchInventory = async () => {
//       try {
//         setLoading(true);
//         //const response = await fetch("https://odooerp.staunchtec.com/api/inventory-hub");
//         const response = await fetch("http://127.0.0.1:8000/api/inventory-hub");
//         if (!response.ok) {
//           throw new Error(`HTTP error! Status: ${response.status}`);
//         }

//         const data = await response.json();
//         setInventory(data);
//       } catch (error) {
//         console.error('Failed to fetch inventory:', error);
//         setInventory([]);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchInventory();
//   }, []);

//   // Get unique statuses and types for filters
//   const uniqueStatuses = useMemo(() => {
//     if (!Array.isArray(inventory)) return [];
//     return [...new Set(inventory.map(item => item.itemStatus).filter(Boolean))].sort();
//   }, [inventory]);

//   const uniqueTypes = useMemo(() => {
//     if (!Array.isArray(inventory)) return [];
//     return [...new Set(inventory.map(item => item.itemType).filter(Boolean))].sort();
//   }, [inventory]);

//   // Filter inventory
//   const filteredInventory = useMemo(() => {
//     if (!Array.isArray(inventory)) return [];
    
//     return inventory.filter(item => {
//       const matchesSearch = !searchTerm || 
//         item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         item.product_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
//       const matchesStatus = !statusFilter || item.itemStatus === statusFilter;
//       const matchesType = !typeFilter || item.itemType === typeFilter;
      
//       return matchesSearch && matchesStatus && matchesType;
//     });
//   }, [searchTerm, statusFilter, typeFilter, inventory]);

//   const totalPages = Math.ceil(filteredInventory.length / ITEMS_PER_PAGE);
//   const paginatedInventory = useMemo(() => {
//     const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
//     return filteredInventory.slice(startIndex, startIndex + ITEMS_PER_PAGE);
//   }, [filteredInventory, currentPage]);

//   if (loading || !kpiData) return <div className="hub-loading">Loading Inventory Hub...</div>;

//   return (
//     <div className="inventory-hub-page">
//       <div className="hub-kpis">
//         <RevenueCard
//           totalRevenue={kpiData.total_revenue}
//           percentageChange={kpiData.percentage_change}
//           monthlyData={kpiData.monthly_revenue}
//           monthLabels={monthLabels}
//         />

//         <ExcessShortageCard
//           title="Items with Excess"
//           totalValue={kpiData.excess.total_count.toString()}
//           items={kpiData.excess.items}
//           type="excess"
//         />

//         <ExcessShortageCard
//           title="Items with Shortage"
//           totalValue={kpiData.shortage.total_count.toString()}
//           items={kpiData.shortage.items}
//           type="shortage"
//         />
//       </div>

//       <div className="data-table-wrapper">
//         <div className="table-toolbar">
//           <div className="search-container">
//             <Search className="search-icon" size={18} />
//             <input
//               type="text"
//               placeholder="Search by SKU or Product Name"
//               value={searchTerm}
//               onChange={(e) => {
//                 setSearchTerm(e.target.value);
//                 setCurrentPage(1);
//               }}
//             />
//           </div>
          
//           <div className="filters-containers">
//             <CustomDropdown
//               options={uniqueStatuses}
//               value={statusFilter}
//               onChange={(value) => {
//                 setStatusFilter(value);
//                 setCurrentPage(1);
//               }}
//               placeholder="Status"
//             />
            
//             <CustomDropdown
//               options={uniqueTypes}
//               value={typeFilter}
//               onChange={(value) => {
//                 setTypeFilter(value);
//                 setCurrentPage(1);
//               }}
//               placeholder="Type"
//             />
//           </div>
//         </div>

//         <div className="table-container">
//           <table className="hub-table">
//             <thead>
//               <tr>
//                 <th>SKU</th>
//                 <th>Product Name</th>
//                 <th>Status</th>
//                 <th className="text-right">On Hand</th>
//                 <th>Location</th>
//                 <th>Item Type</th>
//                 <th className="text-right">Total Value</th>
//                 <th className="text-center">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="animated-tbody">
//               {paginatedInventory.map((item, index) => (
//                 <tr key={item.product_id} className="animated-row" style={{ animationDelay: `${index * 0.05}s` }}>
//                   <td className="font-medium">{item.sku}</td>
//                   <td>{item.product_name}</td>
//                   <td><StatusBadge status={item.itemStatus} /></td>
//                   <td className="text-right">{item.onHand}</td>
//                   <td>{item.location || 'N/A'}</td>
//                   <td>{item.itemType || 'N/A'}</td>
//                   <td className="text-right">${item.totalValue?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
//                   <td className="text-center">
//                     <button
//                       className="view-details-btn"
//                       onClick={() => window.location.href = `/products/${item.product_id}`}
//                     >
//                       View Details
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         <CenteredPagination
//           currentPage={currentPage}
//           totalPages={totalPages}
//           onPageChange={setCurrentPage}
//         />
//       </div>
//     </div>
//   );
// };

// export default InventoryHub;