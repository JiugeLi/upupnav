import React, { useState, useEffect } from 'react';
import { Website, Group } from '@/types';
import { X, Globe, ImageIcon, Link as LinkIcon, FileText, Check, Loader2, Sparkles, FolderOpen } from 'lucide-react';

interface WebsiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Website>) => void;
  initialData?: Website | null;
  groupId: number;
  groups: Group[];
}

export default function WebsiteModal({ isOpen, onClose, onSubmit, initialData, groupId, groups }: WebsiteModalProps) {
  const [formData, setFormData] = useState<Partial<Website>>({
    name: '',
    url: '',
    description: '',
    logo_url: '',
    logo_type: 'default',
    sort_order: 0,
    group_id: groupId,
  });
  const [analyzing, setAnalyzing] = useState(false);

  const [localGroups, setLocalGroups] = useState<Group[]>(groups);
  const [tempNewGroupName, setTempNewGroupName] = useState<string | null>(null);

  useEffect(() => {
    setLocalGroups(groups);
  }, [groups]);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: '',
        url: '',
        description: '',
        logo_url: '',
        logo_type: 'default',
        sort_order: 0,
        group_id: groupId,
      });
    }
  }, [initialData, isOpen, groupId]);

  if (!isOpen) return null;

  const analyzeUrl = async () => {
    if (!formData.url) return;
    setAnalyzing(true);
    try {
      const res = await fetch('/api/websites/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: formData.url }),
      });
      const data = await res.json() as { title?: string; description?: string; category?: string; logoUrl?: string; url?: string };
      
      let newGroupId = formData.group_id;
      let matched = false;

      // 1. Try exact match with category from AI
      if (data.category) {
        const cat = data.category.toLowerCase();
        for (const group of localGroups) {
           if (group.name.toLowerCase() === cat) {
             newGroupId = group.id;
             matched = true;
             break;
           }
        }
        
        // If no match found, prepare to create new group
        if (!matched) {
           newGroupId = -1; // Temporary ID for new group
           setTempNewGroupName(data.category);
           // Add temporary group to list if not exists
           setLocalGroups(prev => {
             if (prev.some(g => g.id === -1)) return prev;
             return [...prev, { id: -1, name: data.category || '', icon: '✨', sort_order: 0, created_at: new Date().toISOString() }];
           });
           matched = true;
        }
      }

      // 2. Fallback to fuzzy match if no category or category matching logic failed/skipped
      // (Though if we created a new group above, matched is true)
      if (!matched && localGroups.length > 0) {
          const text = (data.title + ' ' + data.description).toLowerCase();
          for (const group of localGroups) {
              if (group.id !== -1 && text.includes(group.name.toLowerCase())) {
                  newGroupId = group.id;
                  break;
              }
          }
      }

      setFormData((prev) => ({ 
        ...prev, 
        name: data.title || prev.name,
        description: data.description || prev.description,
        logo_url: data.logoUrl || prev.logo_url,
        url: data.url || prev.url,
        logo_type: 'auto',
        group_id: newGroupId
      }));
    } catch (error) {
      console.error('Error analyzing url:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalGroupId = formData.group_id;

    // Handle new group creation
    if (finalGroupId === -1 && tempNewGroupName) {
      try {
        const res = await fetch('/api/groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: tempNewGroupName, icon: '✨' }),
        });
        if (res.ok) {
          const newGroup = await res.json() as { id: number };
          finalGroupId = newGroup.id;
        } else {
          console.error('Failed to create new group');
          // Fallback to default or first group if creation fails? 
          // For now let's just alert or keep -1 (which will likely fail on backend)
          // Actually if we fail, we probably shouldn't proceed.
          alert('Failed to auto-create group. Please select an existing group.');
          return;
        }
      } catch (error) {
        console.error('Error creating group:', error);
        return;
      }
    }

    onSubmit({ ...formData, group_id: finalGroupId });
  };

  const handleUrlBlur = () => {
    // Only auto-analyze if we are adding a new website and name is empty
    if (!initialData && !formData.name && formData.url) {
        analyzeUrl();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-2xl transform transition-all overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            {initialData ? <><Globe size={20} className="text-blue-500"/> Edit Website</> : <><Sparkles size={20} className="text-blue-500"/> Add Website</>}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* URL Input First */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <LinkIcon size={16} className="text-slate-400" />
                URL <span className="text-slate-400 font-normal text-xs ml-auto">输入网址自动识别</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm placeholder:text-slate-400"
                  placeholder="example.com"
                  required
                  onBlur={handleUrlBlur}
                />
                <button
                  type="button"
                  onClick={analyzeUrl}
                  disabled={analyzing || !formData.url}
                  className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium whitespace-nowrap"
                >
                  {analyzing ? <Loader2 size={18} className="animate-spin" /> : <><Sparkles size={16} /> 智能识别</>}
                </button>
              </div>
            </div>

            {/* Group Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <FolderOpen size={16} className="text-slate-400" />
                Group
              </label>
              <select
                value={formData.group_id}
                onChange={(e) => setFormData({ ...formData, group_id: Number(e.target.value) })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm bg-white"
              >
                {localGroups.map(g => (
                    <option key={g.id} value={g.id}>
                        {g.id === -1 ? `✨ 新建分组: ${g.name}` : g.name}
                    </option>
                ))}
              </select>
            </div>

            <div className="border-t border-slate-100 pt-4">
                <div className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">Details</div>
                
                <div className="space-y-4">
                    <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <Globe size={16} className="text-slate-400" />
                        Name
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm placeholder:text-slate-400"
                        placeholder="Website Name"
                        required
                    />
                    </div>

                    <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <ImageIcon size={16} className="text-slate-400" />
                        Logo URL
                    </label>
                    <div className="flex items-center gap-3">
                        <input
                        type="text"
                        value={formData.logo_url}
                        onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                        className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm placeholder:text-slate-400"
                        placeholder="https://example.com/logo.png"
                        />
                        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {formData.logo_url ? (
                            <img src={formData.logo_url} alt="Preview" className="w-8 h-8 object-contain" />
                        ) : (
                            <Globe className="text-slate-300" size={20} />
                        )}
                        </div>
                    </div>
                    </div>

                    <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <FileText size={16} className="text-slate-400" />
                        Description
                    </label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm placeholder:text-slate-400 min-h-[80px] resize-none"
                        placeholder="Optional description..."
                    />
                    </div>
                </div>
            </div>

          </form>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
          >
            <Check size={16} />
            Save Website
          </button>
        </div>
      </div>
    </div>
  );
}
