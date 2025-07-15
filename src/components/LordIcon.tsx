import React, { useEffect } from 'react';

interface LordIconProps {
  src: string;
  trigger?: 'hover' | 'click' | 'loop' | 'loop-on-hover' | 'morph' | 'morph-two-way';
  style?: React.CSSProperties;
  className?: string;
  colors?: string;
}

const LordIcon: React.FC<LordIconProps> = ({ 
  src, 
  trigger = 'hover', 
  style = { width: '250px', height: '250px' },
  className = '',
  colors
}) => {
  useEffect(() => {
    // Load LordIcon script if not already loaded
    if (!document.querySelector('script[src="https://cdn.lordicon.com/lordicon.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://cdn.lordicon.com/lordicon.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <lord-icon
      src={src}
      trigger={trigger}
      style={style}
      class={className}
      colors={colors}
    />
  );
};

// Add TypeScript declaration for the custom element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'lord-icon': {
        src: string;
        trigger?: string;
        style?: React.CSSProperties;
        class?: string;
        colors?: string;
      };
    }
  }
}

export default LordIcon;