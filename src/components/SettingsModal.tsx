import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, Download, Upload, AlertTriangle, Check, Loader2, Lock, Shield } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChange: () => void;
  onOpenChangePassword: () => void;
  isAdmin?: boolean;
}

export default function SettingsModal({ isOpen, onClose, onDataChange, onOpenChangePassword, isAdmin = false }: SettingsModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/groups/export');
      const data = await res.json();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jiugenav-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setMessage({ type: 'success', text: 'Data exported successfully' });
    } catch (error) {
      console.error('Export failed', error);
      setMessage({ type: 'error', text: 'Failed to export data' });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('Importing data will MERGE with existing data. Are you sure?')) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      const res = await fetch('/api/groups/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: json.data, mode: 'merge' }),
      });

      if (!res.ok) throw new Error('Import failed');

      setMessage({ type: 'success', text: 'Data imported successfully' });
      onDataChange();
      setTimeout(onClose, 1500);
    } catch (error) {
      console.error('Import failed', error);
      setMessage({ type: 'error', text: 'Failed to import data. Invalid file format.' });
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl transform transition-all overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">Settings & Data</h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {message && (
            <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
              message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
            }`}>
              {message.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
              {message.text}
            </div>
          )}

          {isAdmin && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">账号安全</h3>

              <button
                onClick={() => {
                  onClose();
                  router.push('/admin');
                }}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm text-red-600 group-hover:scale-110 transition-transform">
                    <Shield size={20} />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-slate-900">管理后台</div>
                    <div className="text-xs text-slate-500">用户、链接、数据管理</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenChangePassword();
                }}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm text-purple-600 group-hover:scale-110 transition-transform">
                    <Lock size={20} />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-slate-900">修改密码</div>
                    <div className="text-xs text-slate-500">更改管理员密码</div>
                  </div>
                </div>
              </button>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">数据管理</h3>
            
            <button
              onClick={handleExport}
              disabled={loading}
              className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm text-blue-600 group-hover:scale-110 transition-transform">
                  <Download size={20} />
                </div>
                <div className="text-left">
                  <div className="font-medium text-slate-900">导出数据</div>
                  <div className="text-xs text-slate-500">下载备份 JSON</div>
                </div>
              </div>
            </button>

            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm text-indigo-600 group-hover:scale-110 transition-transform">
                    {loading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-slate-900">导入数据</div>
                    <div className="text-xs text-slate-500">从 JSON 备份恢复</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center">
              NavDev v1.0.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
