import React from 'react';

export const ReceiptIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M4 12h16v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6z" />
    <path d="M12 2v10" />
    <path d="m16 8-4 4-4-4" />
  </svg>
);