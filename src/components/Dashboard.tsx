'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AUTH_KEY } from '@/lib/auth';
import { Group, Website } from '@/types';
import LoginModal from './LoginModal';
import GroupModal from './GroupModal';
import WebsiteModal from './WebsiteModal';
import SettingsModal from './SettingsModal';
import ChangePasswordModal from './ChangePasswordModal';
import { 
  Search, Plus, Settings, LogOut, Trash2, Edit2, 
  LayoutGrid, FolderOpen, Globe, ChevronRight,
  Menu, X
} from 'lucide-react';


const WebsiteLogo = ({ website }: { website: Website }) => {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!website.logo_url) {
        setFailed(true);
        return;
    }
    
    if (website.logo_url.startsWith('https://')) {
        setImgSrc(website.logo_url);
        setFailed(false);
    } else {
        // Upgrade HTTP to Google Favicon to avoid Mixed Content
        try {
            const domain = new URL(website.url).hostname;
            setImgSrc(`https://www.google.com/s2/favicons?domain=${domain}&sz=64`);
            setFailed(false);
        } catch {
            setFailed(true);
        }
    }
  }, [website.logo_url, website.url]);

  const handleError = () => {
      // If we are already using Google Favicon, or if we were using original HTTPS and it failed,
      // let's try Google Favicon if we haven't yet.
      
      if (imgSrc && imgSrc.includes('google.com/s2/favicons')) {
          setFailed(true);
      } else {
          // Try Google Favicon fallback
          try {
            const domain = new URL(website.url).hostname;
            const fallbackUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
            if (imgSrc !== fallbackUrl) {
                setImgSrc(fallbackUrl);
            } else {
                setFailed(true);
            }
          } catch {
            setFailed(true);
          }
      }
  };

  if (failed || !imgSrc) {
    return <Globe className="text-slate-300" size={24} />;
  }

  return (
    <img 
      src={imgSrc} 
      alt={website.name} 
      className="w-10 h-10 object-contain"
      onError={handleError}
    />
  );
};

export default function Dashboard() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modals
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showWebsiteModal, setShowWebsiteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editingWebsite, setEditingWebsite] = useState<Website | null>(null);

  // 初始化数据
  useEffect(() => {
    fetchData();
    // 检查本地登录状态
    const authStatus = localStorage.getItem(AUTH_KEY);
    setIsAdmin(authStatus === 'true');
  }, []);

  const fetchData = async (force = false) => {
    if (!force && groups.length > 0 && websites.length > 0) {
      return;
    }

    try {
      const groupsRes = await fetch('/api/groups');
      if (groupsRes.ok) {
        const groupsData = await groupsRes.json() as Group[];
        setGroups(groupsData);
        if (groupsData.length > 0 && !activeGroupId) {
          setActiveGroupId(groupsData[0].id);
        }
        setLoading(false);
      }

      const websitesRes = await fetch('/api/websites');
      if (websitesRes.ok) {
        const websitesData = await websitesRes.json() as Website[];
        setWebsites(websitesData);
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
      setLoading(false);
    }
  };

  const handleLogin = () => {
    localStorage.setItem(AUTH_KEY, 'true');
    setIsAdmin(true);
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY);
    setIsAdmin(false);
  };

  // CRUD Handlers
  const handleGroupSubmit = async (data: Partial<Group>) => {
    try {
      if (editingGroup) {
        await fetch(`/api/groups/${editingGroup.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      } else {
        await fetch('/api/groups', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      }
      fetchData(true);
      setShowGroupModal(false);
      setEditingGroup(null);
    } catch (error) {
      console.error('Error saving group', error);
    }
  };

  const handleDeleteGroup = async (id: number) => {
    if (!confirm('确定删除此分组及其所有网站吗？')) return;
    try {
      await fetch(`/api/groups/${id}`, { method: 'DELETE' });
      fetchData(true);
      if (activeGroupId === id) setActiveGroupId(groups[0]?.id || null);
    } catch (error) {
      console.error('Error deleting group', error);
    }
  };

  const handleWebsiteSubmit = async (data: Partial<Website>) => {
    try {
      if (editingWebsite) {
        await fetch(`/api/websites/${editingWebsite.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      } else {
        await fetch('/api/websites', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      }
      fetchData(true);
      setShowWebsiteModal(false);
      setEditingWebsite(null);
    } catch (error) {
      console.error('Error saving website', error);
    }
  };

  const handleDeleteWebsite = async (id: number) => {
    if (!confirm('确定删除此网站吗？')) return;
    try {
      await fetch(`/api/websites/${id}`, { method: 'DELETE' });
      fetchData(true);
    } catch (error) {
      console.error('Error deleting website', error);
    }
  };

  const handleWebsiteClick = async (website: Website) => {
    try {
      fetch(`/api/websites/${website.id}/click`, { method: 'POST' });
    } catch (e) {}
    window.open(website.url, '_blank');
  };

  // Filtering
  const filteredWebsites = useMemo(() => {
    let result = websites;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        w => 
          w.name.toLowerCase().includes(q) || 
          w.url.toLowerCase().includes(q) || 
          w.description?.toLowerCase().includes(q)
      );
    } else if (activeGroupId) {
      result = result.filter(w => w.group_id === activeGroupId);
    }
    return result;
  }, [websites, activeGroupId, searchQuery]);

  const activeGroup = groups.find(g => g.id === activeGroupId);

  // 过滤掉没有网站的空分组（仅对非管理员生效，管理员需要看到空分组以便管理）
  const visibleGroups = useMemo(() => {
    if (isAdmin) return groups;
    return groups.filter(group => websites.some(w => w.group_id === group.id));
  }, [groups, websites, isAdmin]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200 
        transform transition-transform duration-300 ease-in-out lg:transform-none
        flex flex-col h-full shadow-2xl lg:shadow-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
              <LayoutGrid className="text-blue-600" size={24} />
              UpUpNav
            </h1>
            <button 
              className="lg:hidden p-2 text-slate-400 hover:text-slate-600"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={20} />
            </button>
          </div>
          <p className="text-xs text-slate-400 font-medium tracking-wider uppercase">Your Personal Navigation</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          <div className="flex items-center justify-between px-2 mb-2">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Groups</h2>
            {isAdmin && (
              <button 
                onClick={() => { setEditingGroup(null); setShowGroupModal(true); }}
                className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                title="Create Group"
              >
                <Plus size={16} />
              </button>
            )}
          </div>
          
          {visibleGroups.map(group => (
            <div 
              key={group.id}
              className={`group flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 ${
                activeGroupId === group.id 
                  ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
              onClick={() => {
                setActiveGroupId(group.id);
                setSidebarOpen(false);
              }}
            >
              <div className="flex items-center gap-3 truncate">
                <span className={`text-lg transition-transform duration-200 ${activeGroupId === group.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {group.icon || '📁'}
                </span>
                <span className="font-medium truncate">{group.name}</span>
              </div>
              
              {isAdmin && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingGroup(group); setShowGroupModal(true); }}
                    className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-blue-600 shadow-sm transition-all hover:scale-105"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }}
                    className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-red-600 shadow-sm transition-all hover:scale-105"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
              
              {!isAdmin && activeGroupId === group.id && (
                <ChevronRight size={16} className="text-blue-400" />
              )}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          {isAdmin ? (
            <div className="space-y-2">
              <button
                onClick={() => setShowSettingsModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl transition-all shadow-sm"
              >
                <Settings size={18} />
                <span>设置</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
              >
                <LogOut size={18} />
                <span>退出登录</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl transition-all shadow-sm"
            >
              <Settings size={18} />
              <span>管理员登录</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-slate-50/50">
        {/* Background Decorations */}
        <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none z-0" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 left-20 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />
        
        {/* Header */}
        <header className="px-6 lg:px-8 py-4 lg:py-6 flex items-center justify-between sticky top-0 z-20 glass mb-6">
          <div className="flex items-center gap-4 lg:hidden">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Menu size={24} />
            </button>
            <span className="font-bold text-slate-900">UpUpNav</span>
          </div>

          <div className="hidden lg:block relative w-full max-w-md group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
            </div>
            <input
              type="text"
              placeholder="搜索网站..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-100/50 border-none rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all text-sm text-slate-800 placeholder:text-slate-400"
            />
          </div>
          
          <div className="flex items-center gap-4 ml-auto lg:ml-0">
            {isAdmin && (
              <button
                onClick={() => { setEditingWebsite(null); setShowWebsiteModal(true); }}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">添加网站</span>
              </button>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 lg:px-8 pb-8 z-10 custom-scrollbar">
          <div className="max-w-[1920px] mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl lg:text-3xl font-bold text-slate-800 flex items-center gap-3">
                {searchQuery ? (
                  <>
                    <Search className="text-blue-500" size={28} />
                    搜索结果
                  </>
                ) : (
                  <>
                    <span className="text-4xl shadow-sm bg-white rounded-xl p-1">{activeGroup?.icon}</span>
                    <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                      {activeGroup?.name}
                    </span>
                  </>
                )}
              </h2>
              <p className="text-slate-500 mt-2 ml-1">
                共 {filteredWebsites.length} 个网站
              </p>
            </div>

            {filteredWebsites.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <FolderOpen size={64} className="text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">暂无网站</h3>
                <p className="text-slate-500 max-w-sm mx-auto leading-relaxed mb-6">
                  {searchQuery ? `未找到 "${searchQuery}" 相关的网站` : "该分组暂无网站，点击下方按钮添加！"}
                </p>
                {isAdmin && !searchQuery && (
                  <div className="flex gap-4">
                    {!activeGroupId && (
                      <button
                        onClick={() => setShowGroupModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-all shadow-md hover:shadow-indigo-500/30"
                      >
                        <Plus size={20} />
                        创建第一个分组
                      </button>
                    )}
                    {(activeGroupId || groups.length > 0) && (
                       <button
                        onClick={() => { setEditingWebsite(null); setShowWebsiteModal(true); }}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-blue-500/30"
                      >
                        <Plus size={20} />
                        添加网站
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-20">
                {filteredWebsites.map(website => (
                  <div
                    key={website.id}
                    onClick={() => handleWebsiteClick(website)}
                    className="group bg-white rounded-2xl p-5 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.1)] transition-all duration-300 border border-slate-100 hover:border-blue-100 relative cursor-pointer hover:-translate-y-1"
                  >
                    <div className="flex items-center gap-4 h-full">
                      <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 group-hover:scale-105 transition-transform duration-300">
                        <WebsiteLogo website={website} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                          {website.name}
                        </h3>
                        {website.click_count > 0 && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                            <span>🔥</span>
                            <span>{website.click_count}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Description Overlay */}
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl z-10 text-center pointer-events-none group-hover:pointer-events-auto">
                        <p className="text-sm text-slate-600 font-medium line-clamp-3 leading-relaxed">
                            {website.description || website.url}
                        </p>
                    </div>

                    {isAdmin && (
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white shadow-sm rounded-lg p-1 border border-slate-100 z-20">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingWebsite(website); setShowWebsiteModal(true); }}
                          className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-md transition-colors"
                          title="编辑"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteWebsite(website.id); }}
                          className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-md transition-colors"
                          title="删除"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
        onLogin={handleLogin} 
      />
      
      <GroupModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        onSubmit={handleGroupSubmit}
        initialData={editingGroup}
      />

      {showWebsiteModal && (
        <WebsiteModal
          isOpen={showWebsiteModal}
          onClose={() => {
            setShowWebsiteModal(false);
            setEditingWebsite(null);
          }}
          onSubmit={handleWebsiteSubmit}
          initialData={editingWebsite}
          groupId={activeGroupId || 0}
          groups={groups}
        />
      )}

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onDataChange={fetchData}
        onOpenChangePassword={() => setShowChangePasswordModal(true)}
      />

      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
    </div>
  );
}
