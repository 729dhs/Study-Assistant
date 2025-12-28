
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid } from 'recharts';
import { AppData } from '../types';

interface StatsModuleProps {
  data: AppData;
}

export const StatsModule: React.FC<StatsModuleProps> = ({ data }) => {
  const totalFocusTime = data.pomodoroRecords.reduce((acc, r) => acc + r.duration, 0);
  const totalPosts = data.posts.length;
  const totalTodos = data.todos.length;
  const completedTodos = data.todos.filter(t => t.completed).length;

  // 7-Day Trend Logic
  const trendData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toDateString();
      const duration = data.pomodoroRecords
        .filter(r => new Date(r.startTime).toDateString() === dStr)
        .reduce((acc, curr) => acc + curr.duration, 0);
      days.push({ 
        name: `${d.getMonth() + 1}/${d.getDate()}`, 
        duration 
      });
    }
    return days;
  }, [data.pomodoroRecords]);

  const tagDistributionData = useMemo(() => {
    const stats: Record<string, number> = {};
    let uncategorizedTime = 0;

    data.pomodoroRecords.forEach(record => {
      if (record.tagIds.length === 0) {
        uncategorizedTime += record.duration;
      } else {
        record.tagIds.forEach(tagId => {
          stats[tagId] = (stats[tagId] || 0) + record.duration;
        });
      }
    });

    const result = Object.entries(stats).map(([id, value]) => {
      const tag = data.tags.find(t => t.id === id);
      return { name: tag?.name || '未知', value, color: tag?.color || '#cbd5e1' };
    });

    if (uncategorizedTime > 0) {
      result.push({ name: '未分类', value: uncategorizedTime, color: '#f1f5f9' });
    }

    return result.sort((a, b) => b.value - a.value);
  }, [data.pomodoroRecords, data.tags]);

  const blogTagData = useMemo(() => {
    const stats: Record<string, number> = {};
    data.posts.forEach(post => {
      if (post.tagIds.length === 0) {
        stats['uncategorized'] = (stats['uncategorized'] || 0) + 1;
      } else {
        post.tagIds.forEach(tagId => {
          stats[tagId] = (stats[tagId] || 0) + 1;
        });
      }
    });
    return Object.entries(stats).map(([id, value]) => {
        const tag = data.tags.find(t => t.id === id);
        return { 
          name: id === 'uncategorized' ? '未分类' : (tag?.name || '未知'), 
          count: value, 
          color: id === 'uncategorized' ? '#f1f5f9' : (tag?.color || '#cbd5e1') 
        };
    }).sort((a, b) => b.count - a.count);
  }, [data.posts, data.tags]);

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      <h2 className="text-3xl font-black">学习看板</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="累计专注" value={`${totalFocusTime} Min`} color="bg-blue-600" />
        <StatCard label="技术笔记" value={`${totalPosts} 篇`} color="bg-green-500" />
        <StatCard label="待办达成" value={`${totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0}%`} color="bg-orange-500" />
        <StatCard label="坚持天数" value={`${new Set(data.pomodoroRecords.map(r => r.startTime.split('T')[0])).size} 天`} color="bg-purple-500" />
      </div>

      {/* 7-Day Trend Chart */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-6">
        <h3 className="font-bold text-lg text-slate-800">近七日专注趋势 (分钟)</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#2563eb', fontWeight: 'bold' }}
              />
              <Line 
                type="monotone" 
                dataKey="duration" 
                stroke="#2563eb" 
                strokeWidth={4} 
                dot={{ r: 6, fill: '#fff', stroke: '#2563eb', strokeWidth: 2 }}
                activeDot={{ r: 8, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tag Distribution */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-6">
          <h3 className="font-bold text-lg text-slate-800">学习偏好分布</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tagDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {tagDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Blog Tags */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-6">
          <h3 className="font-bold text-lg text-slate-800">笔记领域统计</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={blogTagData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {blogTagData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color }: { label: string, value: string, color: string }) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6 group hover:scale-105 transition-transform">
    <div className={`w-12 h-12 ${color} rounded-2xl shadow-lg flex items-center justify-center text-white font-bold`}>
      {label[0]}
    </div>
    <div>
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black text-slate-800 tracking-tight">{value}</p>
    </div>
  </div>
);
