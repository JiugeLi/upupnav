'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserSession, clearUserSession } from '@/lib/user-auth';
import { apiClient, apiGet, apiDelete } from '@/lib/api-client';
import {
  Users, Link2, MousePointerClick, FolderOpen, Trash2, Edit2, ArrowLeft,
  RefreshCw, Calendar, Clock, Mail, UserPlus, BarChart3
} from 'lucide-react';

interface User {
  id: number;
  email: string;
  name: string | null;
  avatar: string | null;
  created_at: string;
  last_login: string | null;
  linkCount: number;
  groupCount: number;
  totalClicks: number;
}

interface AdminStats {
  totalUsers: number;
  totalLinks: number;
  totalGroups: number;
  totalClicks: number;
  newUsersThisWeek: number;
  newLinksThisWeek: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalLinks: 0,
    totalGroups: 0,
    totalClicks: 0,
    newUsersThisWeek: 0,
    newLinksThisWeek: 0,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'links'>('overview');

  useEffect(() => {
    const session = getUserSession();
    if (!session?.isAdmin) {
      router.push('/');
      return;
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData] = await Promise.all([
        apiGet<AdminStats>('/api/admin/stats'),
        apiGet<User[]>('/api/admin/users'),
      ]);
      setStats(statsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to fetch admin data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: number, email: string) => {
    if (!confirm(`确定删除用户 "${email}" 吗？这将删除该用户的所有数据（分组、网站等）。`)) return;

    try {
      await apiClient('/api/admin/users', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      });
      fetchData();
    } catch (error) {
      console.error('Failed to delete user', error);
      alert('删除失败');
    }
  };

  const handleLogout = () => {
    clearUserSession();
    router.push('/');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-slate-600" />
            </button>
            <h1 className="text-2xl font-bold text-slate-900">管理后台</h1>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            退出登录
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-xl p-2 inline-flex">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart3 size={18} className="inline mr-2" />
            概览
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users size={18} className="inline mr-2" />
            用户管理
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">总用户数</p>
                    <p className="text-3xl font-bold mt-2">{stats.totalUsers}</p>
                    <p className="text-blue-200 text-xs mt-1">+{stats.newUsersThisWeek} 本周新增</p>
                  </div>
                  <Users size={32} className="opacity-80" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-sm font-medium">总链接数</p>
                    <p className="text-3xl font-bold mt-2">{stats.totalLinks}</p>
                    <p className="text-emerald-200 text-xs mt-1">+{stats.newLinksThisWeek} 本周新增</p>
                  </div>
                  <Link2 size={32} className="opacity-80" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl p-6 text-white shadow-lg shadow-violet-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-violet-100 text-sm font-medium">总分组数</p>
                    <p className="text-3xl font-bold mt-2">{stats.totalGroups}</p>
                  </div>
                  <FolderOpen size={32} className="opacity-80" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg shadow-amber-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-100 text-sm font-medium">总点击量</p>
                    <p className="text-3xl font-bold mt-2">{stats.totalClicks}</p>
                  </div>
                  <MousePointerClick size={32} className="opacity-80" />
                </div>
              </div>
            </div>

            {/* Recent Users */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">用户列表</h2>
                <button
                  onClick={fetchData}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <RefreshCw size={18} className="text-slate-600" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">用户</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">链接数</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">分组数</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">点击量</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">注册时间</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">最后登录</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {user.avatar ? (
                              <img src={user.avatar} alt={user.name || ''} className="w-10 h-10 rounded-full" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold">
                                {(user.name || user.email)[0].toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-slate-900">{user.name || '未命名用户'}</div>
                              <div className="text-sm text-slate-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Link2 size={12} className="mr-1" />
                            {user.linkCount}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-800">
                            <FolderOpen size={12} className="mr-1" />
                            {user.groupCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-900">{user.totalClicks}</td>
                        <td className="px-6 py-4 text-slate-500 text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            {formatDate(user.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-sm">
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            {formatDate(user.last_login)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {users.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  暂无用户
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">用户管理</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchData}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <RefreshCw size={18} className="text-slate-600" />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">用户</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">邮箱</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">链接数</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">分组数</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">点击量</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">注册时间</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name || ''} className="w-10 h-10 rounded-full" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold">
                              {(user.name || user.email)[0].toUpperCase()}
                            </div>
                          )}
                          <span className="font-medium text-slate-900">{user.name || '未命名'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{user.email}</td>
                      <td className="px-6 py-4">{user.linkCount}</td>
                      <td className="px-6 py-4">{user.groupCount}</td>
                      <td className="px-6 py-4">{user.totalClicks}</td>
                      <td className="px-6 py-4 text-slate-500 text-sm">{formatDate(user.created_at)}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                          title="删除用户"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
