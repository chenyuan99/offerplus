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
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
                Rice STEM 找工作交流
            </h1>
            <a
                href="https://docs.google.com/spreadsheets/d/1PEebPo6zZqsy-P2gdw6aOZYlPOZOui8Yz89yRNi7pDw/edit?gid=0#gid=0"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                Contribute to the List
            </a>
        </div>
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