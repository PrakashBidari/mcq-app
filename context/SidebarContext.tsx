// context/SidebarContext.tsx
import React, { createContext, useCallback, useContext, useState } from "react";

// Split into two contexts so consumers that only call setSidebarVisible
// (e.g. _layout.tsx) do NOT re-render when the sidebar opens or closes.
const SidebarStateContext = createContext<boolean>(false);
const SidebarActionsContext = createContext<(visible: boolean) => void>(() => {});

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [sidebarVisible, setSidebarVisibleState] = useState(false);
  // Stable reference — never triggers re-renders in consumers that only write
  const setSidebarVisible = useCallback((v: boolean) => setSidebarVisibleState(v), []);

  return (
    <SidebarActionsContext.Provider value={setSidebarVisible}>
      <SidebarStateContext.Provider value={sidebarVisible}>
        {children}
      </SidebarStateContext.Provider>
    </SidebarActionsContext.Provider>
  );
};

// Use this in components that only need to open/close the sidebar (_layout.tsx).
// These components will NOT re-render when sidebarVisible changes.
export const useSidebarSetter = () => useContext(SidebarActionsContext);

// Backwards-compatible hook for components that need both values (GlobalSidebar).
export const useSidebar = () => ({
  sidebarVisible: useContext(SidebarStateContext),
  setSidebarVisible: useContext(SidebarActionsContext),
});
