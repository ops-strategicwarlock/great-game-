
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  reputation: number;
  sol: number;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, reputation, sol }) => {
  return (
    <div className="h-screen w-screen p-4 flex flex-col bg-[#0a0c0a] relative overflow-hidden">
      {/* Header Info */}
      <div className="flex justify-between items-center mb-4 px-4 py-2 border-b-2 border-[#32cd32]">
        <div className="text-xl font-bold tracking-widest flicker">STRAND OS v1.0 // BAKERSFIELD PILOT</div>
        <div className="flex gap-8 text-sm uppercase">
          <div>REP: <span className="text-white">{reputation}</span></div>
          <div>SOL: <span className="text-white">{sol.toFixed(2)}</span></div>
          <div className="hidden md:block">LOC: <span className="text-white">35.3733° N, 119.0187° W</span></div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
        {/* Navigation Sidebar */}
        <div className="w-full md:w-48 flex md:flex-col gap-2 border-r-0 md:border-r-2 border-[#32cd32] pr-0 md:pr-4">
          <TabButton id="MAP" active={activeTab === 'MAP'} onClick={() => onTabChange('MAP')}>[MAP]</TabButton>
          <TabButton id="INV" active={activeTab === 'INV'} onClick={() => onTabChange('INV')}>[INV]</TabButton>
          <TabButton id="OSINT" active={activeTab === 'OSINT'} onClick={() => onTabChange('OSINT')}>[OSINT]</TabButton>
          <TabButton id="COMM" active={activeTab === 'COMM'} onClick={() => onTabChange('COMM')}>[COMM]</TabButton>
          <TabButton id="VAULT" active={activeTab === 'VAULT'} onClick={() => onTabChange('VAULT')}>[VAULT]</TabButton>
        </div>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto p-4 border-2 border-[#32cd32] rounded-lg shadow-[inset_0_0_15px_rgba(50,205,50,0.2)] bg-[#0d110d]">
          {children}
        </div>
      </div>

      {/* Footer Status */}
      <div className="mt-4 flex justify-between items-center text-xs uppercase opacity-70">
        <div>System: ONLINE</div>
        <div>Solana Mainnet: CONNECTED</div>
        <div>Vaultmint Program: ACTIVE</div>
      </div>
    </div>
  );
};

const TabButton: React.FC<{ id: string; active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`flex-1 py-2 px-4 text-left transition-all ${active ? 'active-tab shadow-[0_0_10px_#32cd32]' : 'hover:bg-[#32cd3222] text-[#32cd32]'}`}
  >
    {children}
  </button>
);

export default Layout;
