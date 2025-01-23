import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export default function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="relative bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="absolute -top-3 -left-3 bg-indigo-50 rounded-lg p-3">
        <Icon className="w-6 h-6 text-indigo-500" />
      </div>
      <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">
        {title}
      </h3>
      <p className="mt-2 text-base text-gray-500">
        {description}
      </p>
    </div>
  );
}