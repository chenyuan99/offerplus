import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export default function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="relative p-6 bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-300">
      <div>
        <span className="inline-flex items-center justify-center p-3 bg-indigo-50 rounded-md">
          <Icon className="h-6 w-6 text-indigo-600" aria-hidden="true" aria-label={`${title} icon`} />
        </span>
      </div>
      <div className="mt-4">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <p className="mt-2 text-base text-gray-500">{description}</p>
      </div>
    </div>
  );
}
