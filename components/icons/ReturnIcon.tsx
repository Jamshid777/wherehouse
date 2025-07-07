import React from 'react';

export const ReturnIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M15.75 5.25a.75.75 0 01.75.75v10.5a.75.75 0 01-1.5 0V6.75a.75.75 0 01.75-.75z" />
        <path d="M8.25 5.25a.75.75 0 01.75.75v10.5a.75.75 0 01-1.5 0V6a.75.75 0 01.75-.75zM3 10.5a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75z" />
        <path fillRule="evenodd" d="M12 2.25a.75.75 0 01-.75.75.75.75 0 00-.75.75v11.25a.75.75 0 00.75.75h.75a.75.75 0 00.75-.75V6.44l3.22 3.22a.75.75 0 101.06-1.06l-4.5-4.5a.75.75 0 00-1.06 0l-4.5 4.5a.75.75 0 101.06 1.06l3.22-3.22V3a.75.75 0 01.75-.75z" clipRule="evenodd" />
    </svg>
);