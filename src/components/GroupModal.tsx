import React, { useState, useEffect } from 'react';
import { Group } from '@/types';
import { X, Check } from 'lucide-react';

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Group>) => void;
  initialData?: Group | null;
}

const ICON_OPTIONS = [
  '📁', '🏠', '💼', '🔧', '🎮', '🎬', '🎵', '📚', 
  '🛒', '💰', '📰', '🔬', '🎨', '✈️', '🍔', '⚽',
  '💻', '📱', '🌐', '🔒', '📧', '📷', '🎯', '⭐',
  '🚀', '💡', '🔥', '❤️', '🌟', '🎁', '🏆', '📌'
];

export default function GroupModal({ isOpen, onClose, onSubmit, initialData }: GroupModalProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📁');
  const [showIconPicker, setShowIconPicker] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setIcon(initialData.icon);
    } else {
      setName('');
      setIcon('📁');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, icon, sort_order: initialData?.sort_order || 0 });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl transform transition-all overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">
            {initialData ? 'Edit Group' : 'New Group'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Group Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm placeholder:text-slate-400"
              placeholder="e.g., Social Media"
              required
              autoFocus
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Icon
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="w-12 h-12 text-2xl border border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 transition-all focus:ring-2 focus:ring-blue-500/20"
              >
                {icon}
              </button>
              <span className="text-sm text-slate-500">
                Click the box to choose an icon
              </span>
            </div>
            
            {showIconPicker && (
              <div className="absolute top-full left-0 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl p-3 grid grid-cols-8 gap-1 z-10 max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200">
                {ICON_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setIcon(opt);
                      setShowIconPicker(false);
                    }}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-lg ${
                      icon === opt ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-100'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
            >
              <Check size={16} />
              Save Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
