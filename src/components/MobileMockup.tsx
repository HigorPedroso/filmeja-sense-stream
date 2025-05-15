import React from 'react';

interface MobileMockupProps {
  children?: React.ReactNode;
}

const MobileMockup: React.FC<MobileMockupProps> = ({ children }) => {
  return (
    <svg viewBox="0 0 300 600" className=" w-48 md:w-64 -left-5" style={{ filter: 'drop-shadow(0px 0px 20px rgba(0, 0, 0, 0.3))' }}>
      <rect x="30" y="50" width="240" height="500" rx="40" fill="#2a2a2c" />
      <rect x="35" y="55" width="230" height="490" rx="35" fill="#1a1a1c" />
      <rect x="105" y="65" width="90" height="25" rx="12.5" fill="#000000" />
      <rect x="40" y="100" width="220" height="440" rx="30" fill="#000000">
        <animate 
          attributeName="opacity" 
          values="0.8;1;0.8" 
          dur="3s" 
          repeatCount="indefinite"
        />
      </rect>
      <foreignObject x="40" y="100" width="220" height="440">
        <div className="w-full h-full overflow-hidden">
          {children}
        </div>
      </foreignObject>
    </svg>
  );
};

export default MobileMockup;