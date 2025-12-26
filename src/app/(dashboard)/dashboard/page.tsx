'use client';

import { useEffect, useState } from 'react';
import { Users, TrendingUp, User, Briefcase, Loader2, } from 'lucide-react';

export default function DashboardHome() {
  const [data, setData] = useState({
    userName: 'User',
    stats: {
      totalLeads: 0,
      activeDeals: 0,
      totalUsers: 0
    },
    isLoading: true
  });

  useEffect(() => {
    async function initDashboard() {
      try {
        // 1. Get User from LocalStorage
        const storedUser = localStorage.getItem('user');
        let name = 'User';
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          name = parsed.firstName || 'User';
        }

        // 2. Fetch Stats from API
        const response = await fetch('/api/dashboard/stats');
        const result = await response.json();

        setData({
          userName: name,
          stats: result.success ? result.data : { totalLeads: 0, activeDeals: 0, totalUsers: 0 },
          isLoading: false
        });
      } catch (error) {
        console.error("Dashboard init error:", error);
        setData(prev => ({ ...prev, isLoading: false }));
      }
    }

    initDashboard();
  }, []);

  // Format numbers with commas (e.g., 1,284)
  const fmt = (num: number) => new Intl.NumberFormat().format(num);

  const statCards = [
    { 
      label: 'System Users', 
      value: fmt(data.stats.totalUsers), 
      icon: User, 
      color: 'text-purple-600', 
      bg: 'bg-purple-50' 
    },
    { 
        label: 'Total Leads', 
        value: fmt(data.stats.totalLeads), 
        icon: Users, 
        color: 'text-yellow-600', 
        bg: 'bg-yellow-50' 
    },
    { 
        label: 'Active Deals', 
        value: fmt(data.stats.activeDeals), 
        icon: Briefcase, 
        color: 'text-blue-600', 
        bg: 'bg-blue-50' 
    },

    { 
        label: 'Growth Rate', 
        value: '+12.5%', 
        icon: TrendingUp, 
        color: 'text-green-600', 
        bg: 'bg-green-50' 
    },
  ];

  if (data.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className="mb-10">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">
          Hello, {data.userName}! 👋
        </h1>
        <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-[0.3em] font-bold">
          CRM Analytics Overview
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div 
            key={index} 
            className="bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-default"
          >
            <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:rotate-6`}>
              <stat.icon className="w-7 h-7" />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
            <h2 className="text-3xl font-black text-gray-900 mt-1">{stat.value}</h2>
          </div>
        ))}
      </div>

      {/* Visual Placeholders */}
      <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-[3rem] p-8 h-80 flex flex-col items-center justify-center text-gray-300 border-dashed">
          <TrendingUp className="w-12 h-12 mb-2 opacity-10" />
          <p className="text-[10px] font-black uppercase tracking-widest">Performance Chart Coming Soon</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-[3rem] p-8 h-80 flex flex-col items-center justify-center text-gray-300 border-dashed">
          <Users className="w-12 h-12 mb-2 opacity-10" />
          <p className="text-[10px] font-black uppercase tracking-widest">Recent Activity Feed</p>
        </div>
      </div>
    </div>
  );
}