import React, { useState } from 'react';
import { useH1BCacheMonitor } from '../../hooks/useH1BCached';

interface H1BCacheMonitorProps {
  cacheHitRate?: number;
  onClearCache?: () => Promise<void>;
}

export function H1BCacheMonitor({ cacheHitRate = 0, onClearCache }: H1BCacheMonitorProps) {
  const { cacheStats, updateStats, clearCache } = useH1BCacheMonitor();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      await clearCache();
      if (onClearCache) {
        await onClearCache();
      }
      await updateStats();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    if (timestamp === 0) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  const getCacheHealthColor = (hitRate: number): string => {
    if (hitRate >= 70) return 'text-green-600 bg-green-100';
    if (hitRate >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getCacheHealthIcon = (hitRate: number): string => {
    if (hitRate >= 70) return '🚀';
    if (hitRate >= 40) return '⚡';
    return '🐌';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getCacheHealthIcon(cacheHitRate)}</span>
            <span className="text-sm font-medium text-gray-700">IndexedDB Cache</span>
          </div>
          
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getCacheHealthColor(cacheHitRate)}`}>
            {Math.round(cacheHitRate)}% Hit Rate
          </div>

          {cacheStats.totalEntries > 0 && (
            <div className="text-xs text-gray-500">
              {cacheStats.totalEntries} entries • {formatBytes(cacheStats.totalSize)}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            {isExpanded ? 'Hide Details' : 'Show Details'}
          </button>
          
          {cacheStats.totalEntries > 0 && (
            <button
              type="button"
              onClick={handleClearCache}
              disabled={isClearing}
              className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-red-400 transition-colors"
            >
              {isClearing ? 'Clearing...' : 'Clear Cache'}
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Cache Performance */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Performance</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Hit Rate:</span>
                  <span className={`font-medium ${getCacheHealthColor(cacheStats.hitRate).split(' ')[0]}`}>
                    {Math.round(cacheStats.hitRate)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Miss Rate:</span>
                  <span className="font-medium text-gray-900">
                    {Math.round(cacheStats.missRate)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Cache Storage */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Storage</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Entries:</span>
                  <span className="font-medium text-gray-900">
                    {cacheStats.totalEntries.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Size:</span>
                  <span className="font-medium text-gray-900">
                    {formatBytes(cacheStats.totalSize)}
                  </span>
                </div>
              </div>
            </div>

            {/* Cache Age */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Age</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Oldest:</span>
                  <span className="font-medium text-gray-900">
                    {cacheStats.oldestEntry ? 
                      Math.round((Date.now() - cacheStats.oldestEntry) / 60000) + 'm' : 
                      'N/A'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Newest:</span>
                  <span className="font-medium text-gray-900">
                    {cacheStats.newestEntry ? 
                      Math.round((Date.now() - cacheStats.newestEntry) / 1000) + 's' : 
                      'N/A'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Cache Status */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Status</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${
                    cacheStats.totalEntries > 0 ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                  <span className="text-gray-600">
                    {cacheStats.totalEntries > 0 ? 'Active' : 'Empty'}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${
                    cacheStats.hitRate > 50 ? 'bg-green-500' : 
                    cacheStats.hitRate > 20 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-gray-600">
                    {cacheStats.hitRate > 50 ? 'Efficient' : 
                     cacheStats.hitRate > 20 ? 'Moderate' : 'Poor'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Cache Benefits */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <svg className="w-4 h-4 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-xs text-blue-800">
                <p className="font-medium mb-1">IndexedDB Cache Benefits:</p>
                <ul className="space-y-0.5 text-blue-700">
                  <li>• Instant results for repeated filter combinations</li>
                  <li>• Reduced server load and bandwidth usage</li>
                  <li>• Works offline for cached data</li>
                  <li>• Automatic cleanup of expired entries</li>
                  <li>• Compressed storage for efficiency</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}