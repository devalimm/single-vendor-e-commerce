import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../utils/api';
import { Calendar, TrendingUp, ShoppingBag, DollarSign, Download, FileText, FileSpreadsheet, ChevronDown, XCircle, RefreshCw } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';
import flatpickr from 'flatpickr';
import { Turkish } from 'flatpickr/dist/l10n/tr.js';
import 'flatpickr/dist/flatpickr.min.css';

const PRESET_RANGES = [
   { key: 'today', label: 'Bugün' },
   { key: 'yesterday', label: 'Dün' },
   { key: 'last7', label: 'Son 7 Gün' },
   { key: 'thisMonth', label: 'Bu Ay' },
   { key: 'custom', label: 'Özel Aralık' },
];

const GRANULARITY_OPTIONS = [
   { key: 'daily', label: 'Günlük' },
   { key: 'weekly', label: 'Haftalık' },
   { key: 'monthly', label: 'Aylık' },
];

// Use local date components instead of toISOString() to avoid UTC shift
const formatLocalDate = (date) => {
   const y = date.getFullYear();
   const m = String(date.getMonth() + 1).padStart(2, '0');
   const d = String(date.getDate()).padStart(2, '0');
   return `${y}-${m}-${d}`;
};

const getPresetDates = (key) => {
   const now = new Date();
   const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

   switch (key) {
      case 'today':
         return { start: today, end: today };
      case 'yesterday': {
         const yesterday = new Date(today);
         yesterday.setDate(yesterday.getDate() - 1);
         return { start: yesterday, end: yesterday };
      }
      case 'last7': {
         const weekAgo = new Date(today);
         weekAgo.setDate(weekAgo.getDate() - 6);
         return { start: weekAgo, end: today };
      }
      case 'thisMonth': {
         const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
         return { start: monthStart, end: today };
      }
      default:
         return { start: today, end: today };
   }
};

const formatCurrency = (value) => {
   return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
};

// Auto-select best granularity based on day count
const autoGranularity = (startStr, endStr) => {
   const s = new Date(startStr);
   const e = new Date(endStr);
   const days = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
   if (days <= 14) return 'daily';
   if (days <= 90) return 'weekly';
   return 'monthly';
};

// ─── Skeleton Components ───
const MetricSkeleton = () => (
   <div className="report-metric-card skeleton-card">
      <div className="skeleton-circle" />
      <div className="skeleton-text-group">
         <div className="skeleton-line wide" />
         <div className="skeleton-line narrow" />
      </div>
   </div>
);

const ChartSkeleton = () => (
   <div className="report-chart-section skeleton-card">
      <div className="skeleton-line wide" style={{ marginBottom: '1.5rem' }} />
      <div className="report-skeleton-bars">
         {[60, 80, 45, 90, 70, 55, 85, 40, 75, 65].map((h, i) => (
            <div key={i} className="skeleton-bar" style={{ height: `${h}%` }} />
         ))}
      </div>
   </div>
);

// ─── Custom Recharts Tooltip ───
const CustomTooltip = ({ active, payload, label, formatter }) => {
   if (!active || !payload || !payload.length) return null;
   return (
      <div className="report-recharts-tooltip">
         <p className="report-recharts-tooltip-label">{label}</p>
         {payload.map((entry, i) => (
            <p key={i} className="report-recharts-tooltip-value" style={{ color: entry.color }}>
               {entry.name}: {formatter ? formatter(entry.value) : entry.value}
            </p>
         ))}
      </div>
   );
};

// ─── Custom Recharts XAxis Tick ───
const CustomXAxisTick = ({ x, y, payload }) => {
   const val = payload.value;
   if (!val) return null;

   // Weekly format: "23 Şub - 01 Mar"
   if (val.includes(' - ')) {
      const parts = val.split(' - ');
      return (
         <g transform={`translate(${x},${y})`}>
            <text x={0} y={0} dy={14} textAnchor="middle" fill="hsl(0, 0%, 50%)" fontSize={11}>
               {parts[0]}
            </text>
            <text x={0} y={0} dy={28} textAnchor="middle" fill="hsl(0, 0%, 50%)" fontSize={11}>
               {parts[1]}
            </text>
         </g>
      );
   }

   // Daily or Monthly format: "23 Şub" / "Mar 2026"
   const parts = val.split(' ');
   if (parts.length === 2) {
      return (
         <g transform={`translate(${x},${y})`}>
            <text x={0} y={0} dy={14} textAnchor="middle" fill="hsl(0, 0%, 50%)" fontSize={11}>
               {parts[0]}
            </text>
            <text x={0} y={0} dy={28} textAnchor="middle" fill="hsl(0, 0%, 50%)" fontSize={11}>
               {parts[1]}
            </text>
         </g>
      );
   }

   return (
      <g transform={`translate(${x},${y})`}>
         <text x={0} y={0} dy={18} textAnchor="middle" fill="hsl(0, 0%, 50%)" fontSize={11}>
            {val}
         </text>
      </g>
   );
};

// ─── Horizontal Bar Chart (for categories — stays CSS) ───
const HorizontalBarChart = ({ data, nameKey, valueKey, formatValue, title }) => {
   const maxValue = Math.max(...data.map(d => d[valueKey]), 1);
   const colors = [
      'hsl(340, 82%, 52%)',
      'hsl(280, 40%, 50%)',
      'hsl(199, 89%, 48%)',
      'hsl(142, 71%, 45%)',
      'hsl(38, 92%, 50%)',
      'hsl(15, 80%, 55%)',
      'hsl(210, 60%, 50%)',
      'hsl(160, 60%, 45%)',
   ];

   return (
      <div className="report-chart-section">
         <h3 className="report-chart-title">{title}</h3>
         <div className="report-h-bar-chart">
            {data.map((item, index) => {
               const widthPercent = (item[valueKey] / maxValue) * 100;
               const barColor = colors[index % colors.length];
               return (
                  <div key={index} className="report-h-bar-row">
                     <span className="report-h-bar-name">{item[nameKey]}</span>
                     <div className="report-h-bar-track">
                        <div
                           className="report-h-bar-fill"
                           style={{
                              width: `${widthPercent}%`,
                              background: barColor,
                              animationDelay: `${index * 80}ms`
                           }}
                        />
                     </div>
                     <span className="report-h-bar-value">
                        {formatValue ? formatValue(item[valueKey]) : item[valueKey]}
                     </span>
                  </div>
               );
            })}
            {data.length === 0 && (
               <div className="empty-state" style={{ padding: '2rem' }}>
                  <p style={{ margin: 0 }}>Bu tarih aralığında kategori verisi bulunmuyor.</p>
               </div>
            )}
         </div>
      </div>
   );
};

// ─── Main Component ───
const AdminReports = () => {
   const [activePreset, setActivePreset] = useState('thisMonth');
   const [dateRange, setDateRange] = useState(() => {
      const { start, end } = getPresetDates('thisMonth');
      return { start: formatLocalDate(start), end: formatLocalDate(end) };
   });
   const [granularity, setGranularity] = useState(() => {
      const { start, end } = getPresetDates('thisMonth');
      return autoGranularity(formatLocalDate(start), formatLocalDate(end));
   });

   // Data states
   const [summary, setSummary] = useState(null);
   const [categories, setCategories] = useState(null);
   const [summaryLoading, setSummaryLoading] = useState(true);
   const [categoryLoading, setCategoryLoading] = useState(true);
   const [exportOpen, setExportOpen] = useState(false);
   const exportRef = useRef(null);
   const flatpickrRef = useRef(null);
   const flatpickrInstance = useRef(null);

   // Stable callback for flatpickr date selection
   const handleFlatpickrChange = useCallback((selectedDates) => {
      if (selectedDates.length === 2) {
         const startStr = formatLocalDate(selectedDates[0]);
         const endStr = formatLocalDate(selectedDates[1]);
         setDateRange({ start: startStr, end: endStr });
         setGranularity(autoGranularity(startStr, endStr));
      }
   }, []);

   // Initialize Flatpickr
   useEffect(() => {
      if (flatpickrRef.current && !flatpickrInstance.current) {
         flatpickrInstance.current = flatpickr(flatpickrRef.current, {
            mode: 'range',
            locale: Turkish,
            dateFormat: 'd M Y',
            defaultDate: [dateRange.start, dateRange.end],
            maxDate: 'today',
            disableMobile: true,
            onChange: handleFlatpickrChange,
         });
      }

      return () => {
         if (flatpickrInstance.current) {
            flatpickrInstance.current.destroy();
            flatpickrInstance.current = null;
         }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

   // Handle preset selection
   const handlePresetClick = (key) => {
      setActivePreset(key);
      if (key === 'custom') {
         // Open flatpickr calendar
         if (flatpickrInstance.current) {
            flatpickrInstance.current.open();
         }
      } else {
         const { start, end } = getPresetDates(key);
         const startStr = formatLocalDate(start);
         const endStr = formatLocalDate(end);
         setDateRange({ start: startStr, end: endStr });
         setGranularity(autoGranularity(startStr, endStr));
         // Sync flatpickr display
         if (flatpickrInstance.current) {
            flatpickrInstance.current.setDate([start, end], false);
         }
      }
   };

   // Close export dropdown on outside click
   useEffect(() => {
      const handleClickOutside = (e) => {
         if (exportRef.current && !exportRef.current.contains(e.target)) {
            setExportOpen(false);
         }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
   }, []);

   // Fetch summary (lazy)
   useEffect(() => {
      const fetchSummary = async () => {
         setSummaryLoading(true);
         try {
            const res = await api.get('/reports/summary', {
               params: {
                  startDate: dateRange.start,
                  endDate: dateRange.end,
                  granularity
               }
            });
            setSummary(res.data.data);
         } catch (err) {
            console.error('Summary fetch error:', err);
         } finally {
            setSummaryLoading(false);
         }
      };
      fetchSummary();
   }, [dateRange, granularity]);

   // Fetch categories (lazy — independent)
   useEffect(() => {
      const fetchCategories = async () => {
         setCategoryLoading(true);
         try {
            const res = await api.get('/reports/categories', {
               params: { startDate: dateRange.start, endDate: dateRange.end }
            });
            setCategories(res.data.data);
         } catch (err) {
            console.error('Category fetch error:', err);
         } finally {
            setCategoryLoading(false);
         }
      };
      fetchCategories();
   }, [dateRange]);

   // ─── Export Functions ───
   const exportExcel = () => {
      setExportOpen(false);
      const wb = XLSX.utils.book_new();

      if (summary) {
         const summaryRows = [
            ['Metrik', 'Değer'],
            ['Toplam Ciro', summary.totalRevenue],
            ['Toplam Sipariş', summary.totalOrders],
            ['Ortalama Sipariş', summary.avgOrderValue],
            ['İptal Edilen', summary.cancelledOrders],
            ['İade Oranı', `%${(summary.returnRate || 0).toFixed(1)}`],
         ];
         const ws1 = XLSX.utils.aoa_to_sheet(summaryRows);
         XLSX.utils.book_append_sheet(wb, ws1, 'Özet');
      }

      if (summary?.periodData) {
         const header = granularity === 'daily' ? 'Tarih' :
            granularity === 'weekly' ? 'Hafta' : 'Ay';
         const rows = [[header, 'Ciro (₺)', 'Sipariş Sayısı']];
         summary.periodData.forEach(d => {
            rows.push([d.label, d.revenue, d.orders]);
         });
         const ws2 = XLSX.utils.aoa_to_sheet(rows);
         XLSX.utils.book_append_sheet(wb, ws2, 'Dönemsel Veriler');
      }

      if (categories) {
         const catRows = [['Kategori', 'Ciro (₺)', 'Satılan Adet', 'Satış Sayısı']];
         categories.forEach(c => {
            catRows.push([c.categoryName, c.totalRevenue, c.totalQuantity, c.orderCount]);
         });
         const ws3 = XLSX.utils.aoa_to_sheet(catRows);
         XLSX.utils.book_append_sheet(wb, ws3, 'Kategoriler');
      }

      XLSX.writeFile(wb, `rapor_${dateRange.start}_${dateRange.end}.xlsx`);
   };

   const exportPDF = () => {
      setExportOpen(false);
      window.print();
   };

   const chartData = summary?.periodData || [];

   return (
      <div className="admin-page report-page">
         <div className="admin-header">
            <div>
               <h1>Raporlar</h1>
               <p className="text-muted" style={{ margin: 0 }}>
                  Satış performansınızı analiz edin
               </p>
            </div>

            {/* Export Dropdown */}
            <div className="report-export-dropdown" ref={exportRef}>
               <button
                  className="btn btn-secondary report-export-btn"
                  onClick={() => setExportOpen(!exportOpen)}
               >
                  <Download size={16} />
                  Dışa Aktar
                  <ChevronDown size={14} />
               </button>
               {exportOpen && (
                  <div className="report-export-menu">
                     <button onClick={exportExcel} className="report-export-item">
                        <FileSpreadsheet size={16} />
                        Excel (.xlsx)
                     </button>
                     <button onClick={exportPDF} className="report-export-item">
                        <FileText size={16} />
                        PDF (Yazdır)
                     </button>
                  </div>
               )}
            </div>
         </div>

         {/* Date Filters */}
         <div className="report-filters no-print">
            <div className="report-filter-row">
               <div className="report-preset-group">
                  {PRESET_RANGES.map(p => (
                     <button
                        key={p.key}
                        className={`report-preset-btn ${activePreset === p.key ? 'active' : ''}`}
                        onClick={() => handlePresetClick(p.key)}
                     >
                        {p.key === 'custom' && <Calendar size={14} />}
                        {p.label}
                     </button>
                  ))}
               </div>
               <div className="report-flatpickr-wrapper">
                  <Calendar size={15} className="report-flatpickr-icon" />
                  <input
                     ref={flatpickrRef}
                     className="form-input report-flatpickr-input"
                     placeholder="Tarih aralığı seçin..."
                     readOnly
                  />
               </div>
            </div>
            <div className="report-date-display">
               <Calendar size={14} />
               {new Date(dateRange.start + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
               {dateRange.start !== dateRange.end && (
                  <>
                     {' — '}
                     {new Date(dateRange.end + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </>
               )}
            </div>
         </div>

         {/* Metric Cards */}
         <div className="report-metrics-grid">
            {summaryLoading ? (
               <>
                  <MetricSkeleton />
                  <MetricSkeleton />
                  <MetricSkeleton />
                  <MetricSkeleton />
                  <MetricSkeleton />
               </>
            ) : (
               <>
                  <div className="report-metric-card metric-revenue">
                     <div className="report-metric-icon">
                        <DollarSign size={24} />
                     </div>
                     <div className="report-metric-info">
                        <span className="report-metric-value">{formatCurrency(summary?.totalRevenue || 0)}</span>
                        <span className="report-metric-label">Toplam Ciro</span>
                     </div>
                  </div>
                  <div className="report-metric-card metric-orders">
                     <div className="report-metric-icon">
                        <ShoppingBag size={24} />
                     </div>
                     <div className="report-metric-info">
                        <span className="report-metric-value">{summary?.totalOrders || 0}</span>
                        <span className="report-metric-label">Toplam Sipariş</span>
                     </div>
                  </div>
                  <div className="report-metric-card metric-avg">
                     <div className="report-metric-icon">
                        <TrendingUp size={24} />
                     </div>
                     <div className="report-metric-info">
                        <span className="report-metric-value">{formatCurrency(summary?.avgOrderValue || 0)}</span>
                        <span className="report-metric-label">Ortalama Sipariş</span>
                     </div>
                  </div>
                  <div className="report-metric-card metric-cancelled">
                     <div className="report-metric-icon">
                        <XCircle size={24} />
                     </div>
                     <div className="report-metric-info">
                        <span className="report-metric-value">{summary?.cancelledOrders || 0}</span>
                        <span className="report-metric-label">İptal Edilen</span>
                     </div>
                  </div>
               </>
            )}
         </div>

         {/* Charts Grid */}
         <div className="report-charts-grid">
            {/* Sales Trend Chart (Recharts) */}
            {summaryLoading ? (
               <ChartSkeleton />
            ) : (
               <div className="report-chart-section">
                  <div className="report-chart-header">
                     <h3 className="report-chart-title">Satış Trendi</h3>
                     <div className="report-granularity-group no-print">
                        {GRANULARITY_OPTIONS.map(g => (
                           <button
                              key={g.key}
                              className={`report-gran-btn ${granularity === g.key ? 'active' : ''}`}
                              onClick={() => setGranularity(g.key)}
                           >
                              {g.label}
                           </button>
                        ))}
                     </div>
                  </div>
                  {chartData.length > 0 ? (
                     <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                           <defs>
                              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="0%" stopColor="hsl(340, 82%, 52%)" stopOpacity={0.3} />
                                 <stop offset="100%" stopColor="hsl(340, 82%, 52%)" stopOpacity={0.02} />
                              </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 92%)" vertical={false} />
                           <XAxis
                              dataKey="label"
                              tick={<CustomXAxisTick />}
                              tickLine={false}
                              axisLine={{ stroke: 'hsl(0, 0%, 90%)' }}
                              interval={chartData.length > 15 ? Math.floor(chartData.length / 8) : 0}
                              height={45}
                           />
                           <YAxis
                              tick={{ fontSize: 11, fill: 'hsl(0, 0%, 50%)' }}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                           />
                           <Tooltip content={<CustomTooltip formatter={formatCurrency} />} />
                           <Area
                              type="monotone"
                              dataKey="revenue"
                              name="Ciro"
                              stroke="hsl(340, 82%, 52%)"
                              strokeWidth={2.5}
                              fill="url(#revenueGradient)"
                              dot={chartData.length <= 31}
                              activeDot={{ r: 5, stroke: 'white', strokeWidth: 2 }}
                           />
                        </AreaChart>
                     </ResponsiveContainer>
                  ) : (
                     <div className="empty-state" style={{ padding: '3rem' }}>
                        <p style={{ margin: 0 }}>Bu tarih aralığında satış verisi bulunmuyor.</p>
                     </div>
                  )}

                  {/* Order Count Bar Chart below the area chart */}
                  {chartData.length > 0 && (
                     <div style={{ marginTop: '1.5rem' }}>
                        <h4 style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '0 0 0.75rem 0', fontWeight: 500 }}>
                           Sipariş Sayıları
                        </h4>
                        <ResponsiveContainer width="100%" height={120}>
                           <BarChart data={chartData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 92%)" vertical={false} />
                              <XAxis
                                 dataKey="label"
                                 tick={<CustomXAxisTick />}
                                 tickLine={false}
                                 axisLine={{ stroke: 'hsl(0, 0%, 90%)' }}
                                 interval={chartData.length > 15 ? Math.floor(chartData.length / 8) : 0}
                                 height={45}
                              />
                              <YAxis
                                 tick={{ fontSize: 10, fill: 'hsl(0, 0%, 55%)' }}
                                 tickLine={false}
                                 axisLine={false}
                                 allowDecimals={false}
                              />
                              <Tooltip content={<CustomTooltip formatter={(v) => `${v} sipariş`} />} />
                              <Bar
                                 dataKey="orders"
                                 name="Sipariş"
                                 fill="hsl(199, 89%, 48%)"
                                 radius={[3, 3, 0, 0]}
                                 maxBarSize={40}
                              />
                           </BarChart>
                        </ResponsiveContainer>
                     </div>
                  )}
               </div>
            )}

            {/* Category Distribution */}
            {categoryLoading ? (
               <ChartSkeleton />
            ) : (
               <HorizontalBarChart
                  data={categories || []}
                  nameKey="categoryName"
                  valueKey="totalRevenue"
                  formatValue={formatCurrency}
                  title="Kategori Bazlı Satışlar"
               />
            )}
         </div>
      </div>
   );
};

export default AdminReports;
