import React, { useState, useEffect } from 'react';
import {
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuth } from '../context/AuthContext.tsx';
import { reportApi } from '../services/api.ts';
import { formatCurrency, formatDate } from '../utils/format.ts';

const CATEGORY_COLORS = [
  '#2563EB',
  '#059669',
  '#D97706',
  '#DC2626',
  '#7C3AED',
  '#0D9488',
  '#EA580C',
  '#475569',
  '#DB2777',
];

export const Reports: React.FC = () => {
  const { user, activeScope } = useAuth();
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [loading, setLoading] = useState<boolean>(true);

  const [overview, setOverview] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any>(null);

  useEffect(() => {
    fetchReportData();
  }, [activeScope, selectedYear]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      if (activeScope === 'family' && !user?.familyId) {
        setOverview(null);
        setMonthlyData([]);
        setCategoryData(null);
        setLoading(false);
        return;
      }

      const [overviewRes, monthlyRes, categoryRes] = await Promise.all([
        reportApi.getOverview({ scope: activeScope, year: selectedYear }),
        reportApi.getMonthly({ scope: activeScope, year: selectedYear }),
        reportApi.getCategories({ scope: activeScope, year: selectedYear, type: 'expense' }),
      ]);

      if (overviewRes.success) setOverview(overviewRes.data);
      if (monthlyRes.success) setMonthlyData(monthlyRes.data);
      if (categoryRes.success) setCategoryData(categoryRes.data);
    } catch (err) {
      console.warn('Lỗi tải báo cáo:', err);
    } finally {
      setLoading(false);
    }
  };

  const years = [currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1];

  const categories = categoryData?.categories || [];
  const topExpenses = categoryData?.topTransactions || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Báo cáo Thống kê Tài chính {selectedYear}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Phạm vi: {activeScope === 'personal' ? 'Chi tiêu cá nhân' : `Gia đình (${user?.family?.name || 'Chưa tham gia'})`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent font-medium text-slate-800 focus:outline-hidden py-1 px-1 mr-1"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  Năm {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium mb-1">Tổng thu cả năm</div>
          <div className="text-xl font-bold text-emerald-700 font-mono tabular-nums">
            +{formatCurrency(overview?.totalIncome || 0)}
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium mb-1">Tổng chi cả năm</div>
          <div className="text-xl font-bold text-rose-600 font-mono tabular-nums">
            -{formatCurrency(overview?.totalExpense || 0)}
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium mb-1">Số dư ròng tích lũy</div>
          <div
            className={`text-xl font-bold font-mono tabular-nums ${
              (overview?.netBalance || 0) >= 0 ? 'text-slate-900' : 'text-rose-600'
            }`}
          >
            {formatCurrency(overview?.netBalance || 0)}
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium mb-1">Chi tiêu trung bình / tháng</div>
          <div className="text-xl font-bold text-slate-800 font-mono tabular-nums">
            {formatCurrency(overview?.averageMonthlyExpense || 0)}
          </div>
        </div>
      </div>

      {/* Main Bar Chart: 12 Months Comparison */}
      <div className="bg-white p-5 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-900">
              Biểu đồ Thu nhập và Chi tiêu 12 tháng năm {selectedYear}
            </h3>
          </div>
        </div>

        {loading ? (
          <div className="h-72 flex items-center justify-center text-xs text-slate-400">
            Đang tải dữ liệu biểu đồ...
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="monthName" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
                />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value)), '']}
                  labelFormatter={(label) => `Tháng ${label}`}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                />
                <Bar dataKey="income" name="Thu nhập" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Bar dataKey="expense" name="Chi tiêu" fill="#DC2626" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Grid: Category Breakdown + Top Largest Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart: Category structure */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <PieIcon className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-900">
              Cơ cấu Chi tiêu theo danh mục cả năm
            </h3>
          </div>

          {categories.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              Chưa có dữ liệu chi tiêu trong năm {selectedYear}.
            </div>
          ) : (
            <div>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categories}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="amount"
                    >
                      {categories.map((_: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(Number(val)), 'Tổng chi']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-3 divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {categories.map((c: any, index: number) => (
                  <div key={c.id} className="py-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
                      />
                      <span className="text-slate-700 font-medium truncate">{c.name}</span>
                      <span className="text-slate-400">({c.percentage}%)</span>
                    </div>
                    <span className="font-mono tabular-nums text-slate-900 font-semibold ml-2">
                      {formatCurrency(c.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top 5 Largest Expenses */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <TrendingDown className="w-4 h-4 text-rose-500" />
            <h3 className="text-sm font-semibold text-slate-900">
              Top 5 khoản chi lớn nhất năm {selectedYear}
            </h3>
          </div>

          {topExpenses.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              Chưa có khoản chi nào được ghi nhận.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {topExpenses.map((t: any, index: number) => (
                <div key={t.id || index} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                      #{index + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 truncate">
                        {t.note}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <span>{t.categoryName}</span>
                        <span>·</span>
                        <span>{formatDate(t.date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono tabular-nums text-sm font-semibold text-rose-600">
                      -{formatCurrency(t.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 12-Month Table Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-semibold text-slate-900">
            Bảng tổng hợp chi tiết theo từng tháng
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Tháng</th>
                <th className="py-3 px-4 text-right">Tổng thu</th>
                <th className="py-3 px-4 text-right">Tổng chi</th>
                <th className="py-3 px-4 text-right">Chênh lệch (Số dư)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthlyData.map((m) => (
                <tr key={m.month} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-900">{m.fullName}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-700">
                    {formatCurrency(m.income)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-rose-600">
                    {formatCurrency(m.expense)}
                  </td>
                  <td
                    className={`py-3 px-4 text-right font-mono tabular-nums font-semibold ${
                      m.balance >= 0 ? 'text-slate-900' : 'text-rose-600'
                    }`}
                  >
                    {m.balance > 0 ? '+' : ''}
                    {formatCurrency(m.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
