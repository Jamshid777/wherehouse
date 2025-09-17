import React from 'react';

export const WarehouseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M22 21V9l-10-5L2 9v12h20z" />
    <path d="M15 21v-8h-6v8" />
    <path d="M15 13h-6" />
    <path d="M15 17h-6" />
  </svg>
);