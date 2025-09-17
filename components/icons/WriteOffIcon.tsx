import React from 'react';

export const WriteOffIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M12 22V12" />
    <path d="m16 16-4-4-4 4" />
    <path d="M4 12h16v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2z"/>
  </svg>
);