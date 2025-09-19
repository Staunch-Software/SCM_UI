import "../styles/dashboard.css";
import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
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
  AreaChart,
  Area,
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
  const [plannedOrders, setPlannedOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch metrics, planned orders, vendors
        const [metricsRes, plannedOrdersRes, vendorsRes] = await Promise.all([
          fetch("/api/metrics"),
          fetch("/api/planned-orders"),
          fetch("/api/vendors"),
        ]);

        if (!metricsRes.ok || !plannedOrdersRes.ok || !vendorsRes.ok) {
          throw new Error("Failed to fetch some API data");
        }

        const metricsData = await metricsRes.json();
        const plannedOrdersData = await plannedOrdersRes.json();
        const vendorsData = await vendorsRes.json();

        setMetrics(metricsData);
        setPlannedOrders(plannedOrdersData);
        setVendors(vendorsData);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Prepare data for charts from backend
  const manufacturingData = plannedOrders
    .filter((o) => o.item_type === "Manufacture")
    .map((mo) => ({
      month: new Date(mo.suggested_due_date).toLocaleString("default", {
        month: "short",
      }),
      completed: 0, // You can fetch completed qty from Odoo if available
      inProgress: 0, // Or calculate dynamically
      planned: mo.quantity,
    }));

  const supplierPerformance = vendors.map((v) => ({
    name: v.vendor_name,
    performance: Math.round((v.delivery + v.quality + v.efficiency) / 3),
    orders: v.totalOrders || 0,
  }));

  const currentManufacturing = [
    { name: "Manufacture", value: plannedOrders.filter(o => o.item_type==="Manufacture").length, color: "#3B82F6" },
    { name: "Purchase", value: plannedOrders.filter(o => o.item_type==="Purchase").length, color: "#10B981" },
  ];

  const kpiTrends = [
    {
      period: "W1",
      efficiency: metrics.totalUnitsSold,
      quality: metrics.totalRevenue,
      delivery: metrics.totalComponentSpend,
    },
    {
      period: "W2",
      efficiency: metrics.totalUnitsSold,
      quality: metrics.totalRevenue,
      delivery: metrics.totalComponentSpend,
    },
  ]; // Replace with better backend KPI if available

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

  const MetricCard = ({ title, value, change, icon: Icon, color, prefix = "" }) => (
    <div className="metric-card">
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
      {/* Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">Supply Chain Dashboard</h1>
        <p className="dashboard-subtitle">Overview of key metrics and performance indicators</p>
      </div>

      {/* Metrics Cards */}
      <div className="metrics-grid">
        <MetricCard title="Total Revenue" value={metrics.totalRevenue} change={12.5} icon={DollarSign} color="#10b981" prefix="$" />
        <MetricCard title="Total Units Sold" value={metrics.totalUnitsSold} change={8.2} icon={Package} color="#3b82f6" />
        <MetricCard title="Component Spend" value={metrics.totalComponentSpend} change={-3.1} icon={ShoppingCart} color="#f59e0b" prefix="$" />
        <MetricCard title="New Orders" value={metrics.newOrders} change={15.7} icon={Truck} color="#ef4444" />
        <MetricCard title="Active Suppliers" value={metrics.supplierCount} change={2.3} icon={Users} color="#8b5cf6" />
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Manufacturing Overview */}
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
              <Bar dataKey="completed" fill="#10b981" name="Completed" />
              <Bar dataKey="inProgress" fill="#f59e0b" name="In Progress" />
              <Bar dataKey="planned" fill="#3b82f6" name="Planned" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Supplier Performance */}
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

      {/* Bottom Row Charts */}
      <div className="bottom-charts-grid">
        {/* Current Manufacturing */}
        <div className="chart-container">
          <div className="chart-header">
            <Package size={24} color="#8b5cf6" className="chart-icon" />
            <h3 className="chart-title">Current Manufacturing</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
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

        {/* KPI Analytics Overview */}
        <div className="chart-container">
          <div className="chart-header">
            <TrendingUp size={24} color="#f59e0b" className="chart-icon" />
            <h3 className="chart-title">Key KPI Analytics</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={kpiTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="period" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="efficiency" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Efficiency" />
              <Area type="monotone" dataKey="quality" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Quality" />
              <Area type="monotone" dataKey="delivery" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} name="Delivery" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;
