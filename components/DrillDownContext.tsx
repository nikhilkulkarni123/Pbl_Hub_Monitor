'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { MonitorFilters } from '@/lib/types';
import DrillDownModal, { type DrillDownConfig } from './DrillDownModal';

type DrillDownContextType = {
  openDrillDown: (config: DrillDownConfig) => void;
  closeDrillDown: () => void;
};

const DrillDownContext = createContext<DrillDownContextType | null>(null);

export function useDrillDown() {
  const ctx = useContext(DrillDownContext);
  if (!ctx) {
    throw new Error('useDrillDown must be used within a DrillDownProvider');
  }
  return ctx;
}

export function DrillDownProvider({
  children,
  filters,
}: {
  children: ReactNode;
  filters: MonitorFilters;
}) {
  const [config, setConfig] = useState<DrillDownConfig | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openDrillDown = (newConfig: DrillDownConfig) => {
    setConfig(newConfig);
    setIsOpen(true);
  };

  const closeDrillDown = () => {
    setIsOpen(false);
  };

  return (
    <DrillDownContext.Provider value={{ openDrillDown, closeDrillDown }}>
      {children}
      <DrillDownModal isOpen={isOpen} config={config} filters={filters} onClose={closeDrillDown} />
    </DrillDownContext.Provider>
  );
}
