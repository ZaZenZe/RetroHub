import React from 'react';

const Footer = () => {
  return (
    <footer className="app-footer hud-footer" role="contentinfo">
      <span>MEM: 64KB OK</span>
      <span className="hud-copy">COPYRIGHT 199X-202X RETRO_HUB INC.</span>
      <span className="hud-coin">_INSERT COIN</span>

      {/* Debug overlay removed — no runtime diagnostics shown in UI. */}
    </footer>
  );
};

export default Footer;
