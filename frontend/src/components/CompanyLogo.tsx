import React, { useState } from 'react';
import { getCompanyLogo, getCompanyDomain } from '../utils/companyLogo';

interface CompanyLogoProps {
  companyName: string;
  companyLink?: string;
  size?: number;
  className?: string;
}

export function CompanyLogo({ companyName, companyLink, size = 40, className = '' }: CompanyLogoProps) {
  const [hasError, setHasError] = useState(false);

  let domain = companyName.toLowerCase();
  if (companyLink) {
    try {
      domain = getCompanyDomain(new URL(companyLink).hostname);
    } catch {
      domain = companyName.toLowerCase();
    }
  }

  const logoUrl = getCompanyLogo(domain, size);

  const handleError = () => {
    setHasError(true);
  };

  if (hasError) {
    return (
      <div
        className={`rounded-full bg-gray-100 flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-xl font-medium text-gray-500">
          {companyName.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={`${companyName} logo`}
      onError={handleError}
      className={`rounded-full object-contain bg-gray-50 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
