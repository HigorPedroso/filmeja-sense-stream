import React from 'react';

interface DesktopMockupProps {
  children?: React.ReactNode;
}

const DesktopMockup: React.FC<DesktopMockupProps> = ({ children }) => {
  return (
    <svg viewBox="100 0 800 600" className="max-w-3xl mx-auto" style={{ filter: 'drop-shadow(0px 0px 30px rgba(0, 0, 0, 0.3))' }}>
      {/* Stand/Base */}
      <path 
        d="M150 450 L650 450 C670 450 680 460 680 470 L680 480 C680 490 670 500 650 500 L150 500 C130 500 120 490 120 480 L120 470 C120 460 130 450 150 450 Z" 
        fill="#2a2a2c" 
        className="drop-shadow-lg"
      />
      <path 
        d="M300 475 L500 475 C510 475 515 480 515 485 L515 490 C515 495 510 500 500 500 L300 500 C290 500 285 495 285 490 L285 485 C285 480 290 475 300 475 Z" 
        fill="#1a1a1c"
      />
      
      {/* Monitor */}
      <g>
        <rect x="150" y="100" width="500" height="350" rx="20" fill="#2a2a2c" />
        <rect x="160" y="110" width="480" height="330" rx="15" fill="#1a1a1c" />
        <rect x="170" y="140" width="460" height="290" fill="#000000">
          <animate 
            attributeName="opacity" 
            values="0.8;1;0.8" 
            dur="3s" 
            repeatCount="indefinite"
          />
        </rect>
        <circle cx="400" cy="125" r="3" fill="#1a1a1c" />
      </g>
      
      {/* Content Area */}
      <foreignObject x="170" y="140" width="460" height="290">
        <div className="w-full h-full overflow-hidden">
          {children}
        </div>
      </foreignObject>
    </svg>
  );
};

export default DesktopMockup;