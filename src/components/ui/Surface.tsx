import React from 'react';

export const Panel: React.FC<React.HTMLAttributes<HTMLElement> & { muted?: boolean }> = ({
  muted = false,
  className = '',
  children,
  ...props
}) => (
  <section className={`${muted ? 'sv-panel-muted' : 'sv-panel'} ${className}`.trim()} {...props}>
    {children}
  </section>
);

export const IconButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  className = '',
  type = 'button',
  children,
  ...props
}) => (
  <button type={type} className={`sv-icon-button ${className}`.trim()} {...props}>
    {children}
  </button>
);
