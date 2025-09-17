import React from 'react';

export const ProductionIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M2 17h20"></path>
    <path d="M12 2a8 8 0 0 0-8 8v7h16v-7a8 8 0 0 0-8-8z"></path>
    <path d="M12 2v2"></path>
  </svg>
);
