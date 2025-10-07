import "../styles/dashboard.css";
import React, { useState, useEffect } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  Users,
  ShoppingCart,
  Factory,
  Truck,
} from "lucide-react";

const EnhancedDashboard = () => {
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalUnitsSold: 0,
    totalComponentSpend: 0,
    newOrders: 0,
    supplierCount: 0,
  });
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [manufacturingData, setManufacturingData] = useState([]);
  const [currentOrdersCount, setCurrentOrdersCount] = useState({
    manufacture: 0,
    purchase: 0,
  });
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [
          metricsRes,
          vendorsRes,
          manufacturingRes,
          orderSummaryRes,
        ] = await Promise.all([
          // fetch("http://127.0.0.1:8000/api/vendors_metrics"),
          // fetch("http://127.0.0.1:8000/api/odoo_vendors"),
          // fetch("http://127.0.0.1:8000/api/manufacturing-summary"),
          // fetch("http://127.0.0.1:8000/api/order-type-summary"),

          fetch("https://odooerp.staunchtec.com/api/vendors_metrics"),
          fetch("https://odooerp.staunchtec.com/api/odoo_vendors"),
          fetch("https://odooerp.staunchtec.com/api/manufacturing-summary"),
          fetch("https://odooerp.staunchtec.com/api/order-type-summary"),
        ]);

        if (
          !metricsRes.ok ||
          !vendorsRes.ok ||
          !manufacturingRes.ok ||
          !orderSummaryRes.ok
        ) {
          throw new Error("Failed to fetch some API data");
        }

        const metricsData = await metricsRes.json();
        const vendorsData = await vendorsRes.json();
        const manufacturingSummaryData = await manufacturingRes.json();
        const orderSummaryData = await orderSummaryRes.json();

        setMetrics(metricsData);
        setVendors(vendorsData);
        processManufacturingData(manufacturingSummaryData);
        setCurrentOrdersCount({
          manufacture: orderSummaryData.manufacture_count,
          purchase: orderSummaryData.purchase_count,
        });

        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const processManufacturingData = (orders) => {
    const monthlyData = {};

    orders.forEach((order) => {
      if (!order.date_start) return;
      const date = new Date(order.date_start);
      const monthKey = date.toLocaleString("default", { month: "short", year: "numeric" });

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: date.toLocaleString("default", { month: "short" }),
          fullDate: date,
          completed: 0,
          inProgress: 0,
          planned: 0,
        };
      }

      const qty = order.product_qty || 0;
      switch (order.state) {
        case "done":
          monthlyData[monthKey].completed += qty;
          break;
        case "progress":
        case "to_close":
          monthlyData[monthKey].inProgress += qty;
          break;
        case "confirmed":
        case "draft":
          monthlyData[monthKey].planned += qty;
          break;
        default:
          break;
      }
    });

    const sortedData = Object.values(monthlyData).sort((a, b) => a.fullDate - b.fullDate);
    setManufacturingData(sortedData);
  };

  const supplierPerformance = vendors.map((v) => {
    const scores = [v.delivery, v.quality, v.efficiency].filter(
      (score) => typeof score === "number"
    );
    const averageScore =
      scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return {
      name: v.vendor_name,
      performance: Math.round(averageScore),
      orders: v.totalOrders || 0,
    };
  });

  const currentManufacturing = [
    { name: "Manufacture", value: currentOrdersCount.manufacture, color: "#3B82F6" },
    { name: "Purchase", value: currentOrdersCount.purchase, color: "#10B981" },
  ];

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getPerformanceClass = (performance) => {
    if (performance >= 90) return "excellent";
    if (performance >= 80) return "good";
    return "poor";
  };

  const MetricCard = ({ title, value, change, icon: Icon, color, prefix = "", tooltip = "" }) => (
    <div
      className="metric-card"
      onMouseEnter={() => tooltip && setHoveredCard(title)}
      onMouseLeave={() => setHoveredCard(null)}
    >
      {hoveredCard === title && tooltip && (
        <div className="metric-tooltip">{tooltip}</div>
      )}
      <div className="metric-card-header">
        <div className="metric-icon" style={{ background: `${color}15` }}>
          <Icon size={24} color={color} />
        </div>
        {change && (
          <div className={`metric-change ${change > 0 ? "positive" : "negative"}`}>
            {change > 0 ? <TrendingUp size={14} color="#16a34a" /> : <TrendingDown size={14} color="#dc2626" />}
            <span className={`metric-change-text ${change > 0 ? "positive" : "negative"}`}>
              {Math.abs(change)}%
            </span>
          </div>
        )}
      </div>
      <div>
        <h3 className="metric-value">{prefix}{loading ? "..." : formatNumber(value)}</h3>
        <p className="metric-title">{title}</p>
      </div>
    </div>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="tooltip-item">
              <div className="tooltip-color" style={{ backgroundColor: entry.color }} />
              <span className="tooltip-name">{entry.name}:</span>
              <span className="tooltip-value">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Supply Chain Dashboard</h1>
        <p className="dashboard-subtitle">Overview of key metrics and performance indicators</p>
      </div>

      <div className="metrics-grid">
        <MetricCard title="Total Revenue" value={metrics.totalRevenue} change={12.5} icon={DollarSign} color="#10b981" prefix="$" />
        <MetricCard title="Total Units Sold" value={metrics.totalUnitsSold} change={8.2} icon={Package} color="#3b82f6"  />
        <MetricCard title="Component Spend" value={metrics.totalComponentSpend} change={-3.1} icon={ShoppingCart} color="#f59e0b" prefix="$"  />
        <MetricCard title="Sales Orders (from past 10 days)" value={metrics.newOrders} change={15.7} icon={Truck} color="#ef4444" />
        <MetricCard title="Active Suppliers" value={metrics.supplierCount} change={2.3} icon={Users} color="#8b5cf6" />
      </div>

      <div className="charts-grid-half">
        <div className="chart-container">
          <div className="chart-header">
            <Factory size={24} color="#3b82f6" className="chart-icon" />
            <h3 className="chart-title">Manufacturing Products</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={manufacturingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="completed" fill="#10b981" name="Completed" stackId="a" />
              <Bar dataKey="inProgress" fill="#f59e0b" name="In Progress" stackId="a" />
              <Bar dataKey="planned" fill="#3b82f6" name="Planned" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <Package size={24} color="#8b5cf6" className="chart-icon" />
            <h3 className="chart-title">Current Orders</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={currentManufacturing} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                {currentManufacturing.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="charts-grid-full">
        <div className="chart-container">
          <div className="chart-header">
            <Users size={24} color="#10b981" className="chart-icon" />
            <h3 className="chart-title">Supplier Performance</h3>
          </div>
          <div className="supplier-list">
            {supplierPerformance.map((supplier, index) => (
              <div key={index} className="supplier-item">
                <div className="supplier-info">
                  <div className="supplier-name">{supplier.name}</div>
                  <div className="supplier-orders">{supplier.orders} orders</div>
                </div>
                <div className="supplier-performance">
                  <div className="performance-bar">
                    <div
                      className={`performance-fill ${getPerformanceClass(supplier.performance)}`}
                      style={{ width: `${supplier.performance}%` }}
                    />
                  </div>
                  <span className="performance-text">{supplier.performance}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;