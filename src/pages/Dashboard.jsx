import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Users, UserCheck, Clock, UserX } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import AttendanceChart from '@/components/dashboard/AttendanceChart';
import RecentActivity from '@/components/dashboard/RecentActivity';
import AttendanceTable from '@/components/attendance/AttendanceTable';

export default function Dashboard() {
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: todayRecords = [], isLoading } = useQuery({
    queryKey: ['attendance', today],
    queryFn: () => base44.entities.AttendanceRecord.filter({ date: today }),
  });

  const { data: allRecords = [] } = useQuery({
    queryKey: ['attendance-all'],
    queryFn: () => base44.entities.AttendanceRecord.list('-created_date', 50),
  });

  // Calculate stats
  const totalEmployees = employees.filter(e => e.status === 'active').length;
  const presentToday = todayRecords.filter(r => r.status === 'present').length;
  const lateToday = todayRecords.filter(r => r.status === 'late').length;
  const absentToday = totalEmployees - presentToday - lateToday;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Employees"
          value={totalEmployees}
          icon={Users}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Present Today"
          value={presentToday}
          icon={UserCheck}
          trend="3%"
          trendUp={true}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Late Arrivals"
          value={lateToday}
          icon={Clock}
          trend="5%"
          trendUp={false}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Absent"
          value={absentToday > 0 ? absentToday : 0}
          icon={UserX}
          iconBg="bg-red-100"
          iconColor="text-red-600"
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <AttendanceChart />
        </div>
        <div className="lg:col-span-1">
          <RecentActivity records={allRecords} />
        </div>
      </div>

      {/* Today's Attendance Table */}
      <AttendanceTable records={todayRecords} loading={isLoading} />
    </div>
  );
}