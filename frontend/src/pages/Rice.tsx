import React, { useState } from 'react';
import SEO from '../components/SEO';
import '../styles/animations.css';

// Tableau viz component type declaration
interface TableauVizProps extends React.HTMLAttributes<HTMLElement> {
  src?: string;
  'hide-tabs'?: boolean;
  toolbar?: string;
  device?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'tableau-viz': TableauVizProps;
    }
  }
}

export function Rice() {

  return (
    <div className="w-full h-screen flex flex-col">
      <SEO 
        title="Rice University Salary Data | OffersPlus" 
        description="View and analyze salary data for Rice University graduates and employees"
      />
      <div className="flex-1 w-full">
        <iframe 
          src="https://docs.google.com/spreadsheets/d/e/2PACX-1vSg3Wh05CgFeOQAd_jojLa6nbgRlC_YvqYcYd9X8WNg-O-iYLfCuyOYyQV_eMJOSnSHxr8JP8ZYnPxN/pubhtml?gid=0&single=true&widget=true&headers=false"
          title="Rice University Salary Data"
          className="w-full h-full border-0"
          loading="lazy"
          allowFullScreen
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      </div>
    </div>
  );
}