/**
 * SKELETON LOADER COMPONENT
 * Displays loading placeholders for different content types
 * Features: Card, stats, task skeletons with animations
 */
import React from 'react';

export default function SkeletonLoader({ type = 'card', count = 1 }) {
  const CardSkeleton = () => (
    <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100 fade-in-up">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 skeleton-enhanced rounded w-3/4"></div>
        <div className="flex gap-2">
          <div className="w-8 h-8 skeleton-enhanced rounded"></div>
          <div className="w-8 h-8 skeleton-enhanced rounded"></div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-4 skeleton-enhanced rounded w-full"></div>
        <div className="h-4 skeleton-enhanced rounded w-2/3"></div>
        <div className="h-4 skeleton-enhanced rounded w-1/2"></div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between">
          <div className="h-4 skeleton-enhanced rounded w-1/4"></div>
          <div className="h-4 skeleton-enhanced rounded w-1/4"></div>
        </div>
      </div>
    </div>
  );

  const StatsSkeleton = () => (
    <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100 fade-in-up">
      <div className="flex items-center">
        <div className="p-4 rounded-full skeleton-enhanced w-16 h-16"></div>
        <div className="ml-6 flex-1">
          <div className="h-5 skeleton-enhanced rounded w-20 mb-2"></div>
          <div className="h-8 skeleton-enhanced rounded w-12"></div>
        </div>
      </div>
    </div>
  );

  const TaskSkeleton = () => (
    <div className="border border-gray-200 rounded-lg p-6 fade-in-up">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="h-6 skeleton-enhanced rounded w-3/4 mb-2"></div>
          <div className="h-4 skeleton-enhanced rounded w-1/2"></div>
        </div>
        <div className="h-6 skeleton-enhanced rounded w-16"></div>
      </div>
      <div className="space-y-2">
        <div className="h-4 skeleton-enhanced rounded w-full"></div>
        <div className="h-4 skeleton-enhanced rounded w-2/3"></div>
      </div>
      <div className="mt-4 flex gap-4">
        <div className="h-4 skeleton-enhanced rounded w-20"></div>
        <div className="h-4 skeleton-enhanced rounded w-24"></div>
        <div className="h-4 skeleton-enhanced rounded w-16"></div>
      </div>
    </div>
  );

  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return <CardSkeleton />;
      case 'stats':
        return <StatsSkeleton />;
      case 'task':
        return <TaskSkeleton />;
      default:
        return <CardSkeleton />;
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>
          {renderSkeleton()}
        </div>
      ))}
    </>
  );
}
