import React from 'react';

export const SupplierIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
    <path d="M15 18H9" />
    <path d="M19 18h2a1 1 0 0 0 1-1v-3.34a1 1 0 0 0-.17-.53l-1.58-3.95A1 1 0 0 0 19.33 8H14Z" />
    <circle cx="6.5" cy="18.5" r="2.5" />
    <circle cx="16.5" cy="18.5" r="2.5" />
  </svg>
);