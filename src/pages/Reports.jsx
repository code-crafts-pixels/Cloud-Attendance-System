import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { Download, Calendar, TrendingUp, Users, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import GlassCard from '@/components/ui/GlassCard';
import StatCard from '@/components/dashboard/StatCard';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Reports() {
  const [dateRange, setDateRange] = useState('7days');

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: records = [] } = useQuery({
    queryKey: ['attendance-all'],
    queryFn: () => base44.entities.AttendanceRecord.list('-date', 500),
  });

  // Calculate date range
  const getDateRange = () => {
    const end = new Date();
    let start;
    switch (dateRange) {
      case '7days':
        start = subDays(end, 7);
        break;
      case '30days':
        start = subDays(end, 30);
        break;
      case 'month':
        start = startOfMonth(end);
        break;
      default:
        start = subDays(end, 7);
    }
    return { start, end };
  };

  const { start, end } = getDateRange();

  const filteredRecords = records.filter(r => {
    const date = new Date(r.date);
    return isWithinInterval(date, { start, end });
  });

  // Stats calculations
  const presentCount = filteredRecords.filter(r => r.status === 'present').length;
  const lateCount = filteredRecords.filter(r => r.status === 'late').length;
  const absentCount = filteredRecords.filter(r => r.status === 'absent').length;
  const onLeaveCount = filteredRecords.filter(r => r.status === 'on_leave').length;

  const totalRecords = filteredRecords.length;
  const attendanceRate = totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(1) : 0;

  // Pie chart data
  const pieData = [
    { name: 'Present', value: presentCount, color: '#10b981' },
    { name: 'Late', value: lateCount, color: '#f59e0b' },
    { name: 'Absent', value: absentCount, color: '#ef4444' },
    { name: 'On Leave', value: onLeaveCount, color: '#8b5cf6' },
  ].filter(d => d.value > 0);

  // Department breakdown
  const deptData = employees.reduce((acc, emp) => {
    const dept = emp.department || 'Other';
    const deptRecords = filteredRecords.filter(r => {
      const employee = employees.find(e => e.id === r.employee_id);
      return employee?.department === dept;
    });
    const existing = acc.find(d => d.department === dept);
    if (existing) {
      existing.present += deptRecords.filter(r => r.status === 'present').length;
      existing.late += deptRecords.filter(r => r.status === 'late').length;
    } else {
      acc.push({
        department: dept,
        present: deptRecords.filter(r => r.status === 'present').length,
        late: deptRecords.filter(r => r.status === 'late').length,
      });
    }
    return acc;
  }, []);

  const exportCSV = () => {
    const headers = ['Date', 'Employee', 'Check In', 'Check Out', 'Status'];
    const rows = filteredRecords.map(r => [
      r.date,
      r.employee_name,
      r.check_in_time ? format(new Date(r.check_in_time), 'HH:mm') : '-',
      r.check_out_time ? format(new Date(r.check_out_time), 'HH:mm') : '-',
      r.status
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">Attendance analytics and insights</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Records"
          value={totalRecords}
          icon={FileText}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Attendance Rate"
          value={`${attendanceRate}%`}
          icon={TrendingUp}
          trend="2.5%"
          trendUp={true}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Late Arrivals"
          value={lateCount}
          icon={Clock}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Active Employees"
          value={employees.filter(e => e.status === 'active').length}
          icon={Users}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Attendance Distribution */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Distribution</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Department Comparison */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Comparison</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="department" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Bar dataKey="present" fill="#10b981" name="Present" radius={[4, 4, 0, 0]} />
                <Bar dataKey="late" fill="#f59e0b" name="Late" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Detailed Summary */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Status Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Present', value: presentCount, color: 'bg-emerald-500', percent: totalRecords > 0 ? (presentCount / totalRecords * 100).toFixed(0) : 0 },
            { label: 'Late', value: lateCount, color: 'bg-amber-500', percent: totalRecords > 0 ? (lateCount / totalRecords * 100).toFixed(0) : 0 },
            { label: 'Absent', value: absentCount, color: 'bg-red-500', percent: totalRecords > 0 ? (absentCount / totalRecords * 100).toFixed(0) : 0 },
            { label: 'On Leave', value: onLeaveCount, color: 'bg-purple-500', percent: totalRecords > 0 ? (onLeaveCount / totalRecords * 100).toFixed(0) : 0 },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className={`w-16 h-16 rounded-2xl ${item.color} flex items-center justify-center mx-auto mb-3`}>
                <span className="text-2xl font-bold text-white">{item.value}</span>
              </div>
              <p className="font-medium text-gray-900">{item.label}</p>
              <p className="text-sm text-gray-500">{item.percent}% of total</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}