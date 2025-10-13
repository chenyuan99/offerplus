import React from 'react';
import { LoadingSpinner, BouncingDots } from '../ui/LoadingSpinner';

interface H1BLoadingOverlayProps {
  isLoading: boolean;
  loadingText?: string;
  cacheHitRate?: number;
  showCacheInfo?: boolean;
  overlay?: boolean;
}

export function H1BLoadingOverlay({ 
  isLoading, 
  loadingText = 'Loading H1B data...', 
  cacheHitRate = 0,
  showCacheInfo = false,
  overlay = true 
}: H1BLoadingOverlayProps) {
  if (!isLoading) return null;

  const getCacheStatusText = (hitRate: number): string => {
    if (hitRate >= 70) return 'Lightning fast results from cache';
    if (hitRate >= 40) return 'Fetching from cache and database';
    return 'Loading fresh data from database';
  };

  const getCacheIcon = (hitRate: number): string => {
    if (hitRate >= 70) return '⚡';
    if (hitRate >= 40) return '🔄';
    return '💾';
  };

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            {/* Main Loading Animation */}
            <div className="mb-6">
              <div className="relative">
                <LoadingSpinner size="xl" color="blue" />
                <div className="absolute -top-2 -right-2">
                  <span className="text-2xl">{getCacheIcon(cacheHitRate)}</span>
                </div>
              </div>
            </div>

            {/* Loading Text */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {loadingText}
            </h3>

            {/* Cache Information */}
            {showCacheInfo && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  {getCacheStatusText(cacheHitRate)}
                </p>
                {cacheHitRate > 0 && (
                  <div className="bg-gray-100 rounded-full h-2 mb-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${cacheHitRate}%` }}
                    ></div>
                  </div>
                )}
              </div>
            )}

            {/* Animated Dots */}
            <BouncingDots />

            {/* Progress Steps */}
            <div className="mt-6 text-xs text-gray-500 space-y-1">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Checking cache</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Fetching data</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <span>Processing results</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Inline loading (non-overlay)
  return (
    <div className="flex items-center justify-center py-8">
      <div className="text-center">
        <LoadingSpinner size="lg" color="blue" />
        <p className="mt-2 text-sm text-gray-600">{loadingText}</p>
        {showCacheInfo && cacheHitRate > 0 && (
          <p className="mt-1 text-xs text-gray-500">
            Cache hit rate: {Math.round(cacheHitRate)}%
          </p>
        )}
      </div>
    </div>
  );
}

export function H1BTableLoadingSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header Skeleton */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <div className="flex space-x-4">
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
        </div>
      </div>

      {/* Rows Skeleton */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={index} className="px-6 py-4">
            <div className="flex space-x-4">
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function H1BStatsLoadingSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="text-center">
            <div className="h-8 bg-gray-200 rounded w-16 mx-auto mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-24 mx-auto animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function H1BFiltersLoadingSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Search Input Skeleton */}
        <div className="col-span-full">
          <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Filter Dropdowns Skeleton */}
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index}>
            <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function H1BSmartLoadingIndicator({ 
  isLoading, 
  cacheHitRate = 0, 
  queryTime = 0 
}: { 
  isLoading: boolean; 
  cacheHitRate?: number; 
  queryTime?: number; 
}) {
  if (!isLoading) return null;

  const getLoadingMessage = (): string => {
    if (cacheHitRate >= 80) return 'Retrieving from cache...';
    if (cacheHitRate >= 50) return 'Checking cache and database...';
    if (queryTime > 1000) return 'Processing large dataset...';
    return 'Fetching data...';
  };

  const getLoadingColor = (): 'blue' | 'green' | 'purple' => {
    if (cacheHitRate >= 80) return 'green';
    if (cacheHitRate >= 50) return 'blue';
    return 'purple';
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 flex items-center space-x-3">
        <LoadingSpinner size="sm" color={getLoadingColor()} />
        <div>
          <p className="text-sm font-medium text-gray-900">
            {getLoadingMessage()}
          </p>
          {cacheHitRate > 0 && (
            <p className="text-xs text-gray-500">
              Cache: {Math.round(cacheHitRate)}% • {queryTime}ms
            </p>
          )}
        </div>
      </div>
    </div>
  );
}