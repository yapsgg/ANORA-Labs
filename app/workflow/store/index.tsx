'use client';

import React, {
  type ReactNode,
  createContext,
  useContext,
  useState,
} from 'react';
import { useStore } from 'zustand';

import {
  AppState,
  type AppStore,
  createAppStore,
} from '@/app/workflow/store/app-store';

export type AppStoreApi = ReturnType<typeof createAppStore>;

const AppStoreContext = createContext<AppStoreApi | undefined>(undefined);

export interface AppStoreProviderProps {
  children: ReactNode;
  initialState?: Partial<AppState>;
}

export const AppStoreProvider = ({
  children,
  initialState,
}: AppStoreProviderProps) => {
  const [store] = useState<AppStoreApi>(() => createAppStore(initialState));

  return (
    <AppStoreContext.Provider value={store}>
      {children}
    </AppStoreContext.Provider>
  );
};

export const useAppStore = <T,>(selector: (store: AppStore) => T): T => {
  const appStoreContext = useContext(AppStoreContext);

  if (!appStoreContext) {
    throw new Error(`useAppStore must be used within AppStoreProvider`);
  }

  return useStore(appStoreContext, selector);
};
