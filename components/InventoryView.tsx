
import React from 'react';
import { NFTItem, NFTClass } from '../types';

interface InventoryViewProps {
  items: NFTItem[];
}

const InventoryView: React.FC<InventoryViewProps> = ({ items }) => {
  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xl mb-4 border-b border-[#32cd32] pb-2">DATA ARCHIVE // INVENTORY</h2>
      
      {items.length === 0 ? (
        <div className="flex-1 flex items-center justify-center opacity-50 italic">
          No artifacts detected in local vault...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="border border-[#32cd32] p-3 flex flex-col gap-2 hover:bg-[#32cd3211] cursor-pointer transition-colors">
              <div className="flex justify-between items-start">
                <div className="text-xs px-1 border border-[#32cd32] bg-[#32cd3233]">
                  {item.type.replace('_', ' ')}
                </div>
                <div className={`text-[10px] font-bold ${item.rarity === 'LEGENDARY' ? 'text-yellow-400' : 'text-[#32cd32]'}`}>
                  {item.rarity}
                </div>
              </div>
              <div className="text-lg font-bold truncate">{item.name}</div>
              <div className="text-xs opacity-80 h-12 overflow-hidden line-clamp-3">
                {item.description}
              </div>
              {item.durability !== undefined && (
                <div className="mt-2 text-[10px]">
                  DURABILITY: 
                  <div className="w-full h-1 bg-[#32cd3233] mt-1">
                    <div className="h-full bg-[#32cd32]" style={{ width: `${item.durability}%` }}></div>
                  </div>
                </div>
              )}
              <button className="mt-2 text-[10px] border border-[#32cd32] py-1 uppercase hover:bg-[#32cd32] hover:text-[#0a0c0a] transition-all">
                Details / Trade
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InventoryView;
