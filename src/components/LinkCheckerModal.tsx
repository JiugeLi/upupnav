'use client';

import React, { useState, useRef, useCallback } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, Loader2, Trash2, CheckSquare, Square } from 'lucide-react';
import { apiClient, apiGet } from '@/lib/api-client';
import { getUserSession, USER_SESSION_KEY } from '@/lib/user-auth';
import { Website } from '@/types';

interface CheckResult {
  id: number;
  name: string;
  url: string;
  status: 'checking' | 'ok' | 'error' | 'timeout';
  statusCode?: number;
  error?: string;
}

interface LinkCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => void;
}

interface BatchResponse {
  total: number;
  batchIndex: number;
  batchSize: number;
  isLastBatch: boolean;
  results: CheckResult[];
  progress: number;
}

export default function LinkCheckerModal({ isOpen, onClose, onDataChanged }: LinkCheckerModalProps) {
  const [checking, setChecking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [results, setResults] = useState<CheckResult[]>([]);
  const [checkedCount, setCheckedCount] = useState(0);
  const [totalWebsites, setTotalWebsites] = useState(0);
  const [progress, setProgress] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const abortControllerRef = useRef<AbortController | null>(null);

  const resetState = useCallback(() => {
    setResults([]);
    setCheckedCount(0);
    setTotalWebsites(0);
    setProgress(0);
    setSelectedIds(new Set());
  }, []);

  // Custom fetch with abort support for apiClient
  const fetchWithAuth = async (url: string, signal?: AbortSignal): Promise<Response> => {
    const session = getUserSession();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (session) {
      headers['X-User-Id'] = session.userId.toString();
      headers['X-Is-Admin'] = session.isAdmin.toString();
    }

    return fetch(url, {
      method: 'GET',
      headers,
      signal,
    });
  };

  const handleCheck = async () => {
    resetState();
    setChecking(true);

    // Create abort controller for this check session
    abortControllerRef.current = new AbortController();

    try {
      // First, fetch all websites to initialize the UI
      const websitesResponse = await fetchWithAuth('/api/websites', abortControllerRef.current.signal);
      if (!websitesResponse.ok) {
        throw new Error('Failed to fetch websites');
      }

      const websites: Website[] = await websitesResponse.json();

      if (!websites || websites.length === 0) {
        setChecking(false);
        alert('没有找到需要检查的网站');
        return;
      }

      setTotalWebsites(websites.length);

      // Initialize results with 'checking' status
      const initialResults: CheckResult[] = websites.map(w => ({
        id: w.id,
        name: w.name || 'Unknown',
        url: w.url || '',
        status: 'checking' as const,
      }));
      setResults(initialResults);

      // Check links in batches
      let batchIndex = 0;
      let allResults: CheckResult[] = [...initialResults];

      while (true) {
        // Check if aborted
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }

        const batchResponse = await fetchWithAuth(
          `/api/websites/check?batch=${batchIndex}`,
          abortControllerRef.current.signal
        );

        if (!batchResponse.ok) {
          throw new Error('Failed to check batch');
        }

        const batchData: BatchResponse = await batchResponse.json();

        // Update results with batch results
        // Find the correct indices to update based on website ID
        for (const result of batchData.results) {
          const index = allResults.findIndex(r => r.id === result.id);
          if (index !== -1) {
            allResults[index] = result;
          }
        }

        setResults([...allResults]);
        setCheckedCount(batchData.total > 0 ? Math.min((batchIndex + 1) * batchData.batchSize, batchData.total) : 0);
        setProgress(batchData.progress);

        if (batchData.isLastBatch) {
          break;
        }

        batchIndex++;
      }

      // Auto-select all bad links after checking completes
      const badLinkIds = allResults
        .filter(r => r.status !== 'ok' && r.status !== 'checking')
        .map(r => r.id);
      setSelectedIds(new Set(badLinkIds));

    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        console.error('Link check failed:', error);
        alert('链接检查失败，请稍后重试');
      }
    } finally {
      setChecking(false);
      setCheckedCount(0);
    }
  };

  const handleStopCheck = () => {
    abortControllerRef.current?.abort();
    setChecking(false);
  };

  const toggleSelection = (id: number) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAllBadLinks = () => {
    const badLinkIds = results
      .filter(r => r.status !== 'ok' && r.status !== 'checking')
      .map(r => r.id);
    setSelectedIds(new Set(badLinkIds));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleDeleteBadLinks = async () => {
    if (selectedIds.size === 0) {
      alert('请先选择要删除的链接');
      return;
    }

    if (!confirm(`确定删除选中的 ${selectedIds.size} 个链接吗？`)) return;

    setDeleting(true);
    try {
      const idsToDelete = Array.from(selectedIds);
      const response = await apiClient('/api/websites/check', {
        method: 'DELETE',
        body: JSON.stringify({ ids: idsToDelete }),
      });
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      alert(`成功删除 ${idsToDelete.length} 个链接`);
      onDataChanged();
      onClose();
    } catch (error) {
      console.error('Delete failed:', error);
      alert('删除失败，请稍后重试');
    } finally {
      setDeleting(false);
    }
  };

  const badLinks = results.filter(r => r.status !== 'ok' && r.status !== 'checking');
  const okLinks = results.filter(r => r.status === 'ok');
  const checkingLinks = results.filter(r => r.status === 'checking');
  const isComplete = !checking && results.length > 0;

  const getStatusIcon = (result: CheckResult) => {
    if (result.status === 'checking') {
      return <Loader2 className="text-blue-500 animate-spin" size={20} />;
    }
    if (result.status === 'ok') {
      return <CheckCircle className="text-green-500" size={20} />;
    }
    if (result.status === 'timeout') {
      return <AlertCircle className="text-orange-500" size={20} />;
    }
    return <XCircle className="text-red-500" size={20} />;
  };

  const getStatusText = (result: CheckResult) => {
    if (result.status === 'checking') {
      return <span className="text-blue-600 text-xs">检查中...</span>;
    }
    if (result.status === 'ok') {
      return <span className="text-green-600 text-xs">正常 ({result.statusCode})</span>;
    }
    if (result.status === 'timeout') {
      return <span className="text-orange-600 text-xs">超时</span>;
    }
    return <span className="text-red-600 text-xs">错误 ({result.statusCode || result.error})</span>;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              {checking ? (
                <Loader2 className="text-blue-600 animate-spin" size={20} />
              ) : isComplete ? (
                <CheckCircle className="text-blue-600" size={20} />
              ) : (
                <CheckCircle className="text-blue-600" size={20} />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">链接检查器</h2>
              <p className="text-sm text-slate-500">检查所有网站链接的有效性</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            disabled={checking || deleting}
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {results.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="text-slate-400" size={48} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">开始检查链接</h3>
              <p className="text-slate-500 mb-6">
                点击下方按钮开始检查所有网站链接的有效性<br />
                检测 404、301、超时等异常情况
              </p>
              <button
                onClick={handleCheck}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-blue-500/30 mx-auto"
              >
                <CheckCircle size={18} />
                <span>开始检查</span>
              </button>
            </div>
          ) : (
            <div>
              {/* Progress Bar */}
              {checking && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">
                      正在检查... ({checkedCount}/{totalWebsites})
                    </span>
                    <span className="text-sm font-medium text-blue-600">{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2 transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-slate-900">{results.length}</div>
                  <div className="text-xs text-slate-500">总链接数</div>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-green-600">{okLinks.length}</div>
                  <div className="text-xs text-slate-500">正常链接</div>
                </div>
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-red-600">{badLinks.length}</div>
                  <div className="text-xs text-slate-500">失效链接</div>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-blue-600">{checkingLinks.length}</div>
                  <div className="text-xs text-slate-500">待检查</div>
                </div>
              </div>

              {/* Selection Actions */}
              {!checking && badLinks.length > 0 && (
                <div className="mb-4 flex items-center justify-between bg-slate-50 rounded-xl p-3">
                  <span className="text-sm text-slate-600">
                    已选择 <span className="font-bold text-red-600">{selectedIds.size}</span> 个链接待删除
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAllBadLinks}
                      className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      全选失效链接
                    </button>
                    <button
                      onClick={deselectAll}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      取消全选
                    </button>
                  </div>
                </div>
              )}

              {/* Results List */}
              <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                {results.map((link) => {
                  const isBad = link.status !== 'ok' && link.status !== 'checking';
                  const isSelected = selectedIds.has(link.id);

                  return (
                    <div
                      key={link.id}
                      className={`rounded-xl p-3 flex items-start gap-3 transition-all ${
                        link.status === 'checking'
                          ? 'bg-blue-50 border border-blue-100'
                          : link.status === 'ok'
                            ? 'bg-green-50 border border-green-100'
                            : isSelected
                              ? 'bg-red-100 border-2 border-red-300'
                              : 'bg-red-50 border border-red-100'
                      }`}
                    >
                      {/* Checkbox for bad links */}
                      {isBad && !checking && (
                        <button
                          onClick={() => toggleSelection(link.id)}
                          className="flex-shrink-0 mt-0.5 hover:scale-110 transition-transform"
                        >
                          {isSelected ? (
                            <CheckSquare className="text-red-600" size={20} />
                          ) : (
                            <Square className="text-slate-400" size={20} />
                          )}
                        </button>
                      )}

                      {getStatusIcon(link)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-slate-900 truncate">{link.name}</div>
                        </div>
                        <div className="text-sm text-slate-500 truncate">{link.url}</div>
                        {getStatusText(link)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {results.length > 0 && (
          <div className="p-6 border-t border-slate-100 flex justify-between">
            <div className="flex gap-2">
              {checking && (
                <button
                  onClick={handleStopCheck}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  停止检查
                </button>
              )}
              {!checking && (
                <button
                  onClick={handleCheck}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  重新检查
                </button>
              )}
            </div>
            {selectedIds.size > 0 && !checking && (
              <button
                onClick={handleDeleteBadLinks}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>删除中...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={18} />
                    <span>删除选中的 {selectedIds.size} 个链接</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
