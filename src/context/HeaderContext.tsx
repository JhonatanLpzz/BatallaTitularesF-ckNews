import React, { createContext, useContext, useState, useCallback } from "react";

interface HeaderContextType {
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
  showAdminButton: boolean;
  setHeaderContent: (content: { leftContent?: React.ReactNode; rightContent?: React.ReactNode; showAdminButton?: boolean }) => void;
  resetHeader: () => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export function HeaderProvider({ children }: { children: React.ReactNode }) {
  const [leftContent, setLeftContent] = useState<React.ReactNode>(null);
  const [rightContent, setRightContent] = useState<React.ReactNode>(null);
  const [showAdminButton, setShowAdminButton] = useState(false);

  const setHeaderContent = useCallback((content: { leftContent?: React.ReactNode; rightContent?: React.ReactNode; showAdminButton?: boolean }) => {
    if (content.leftContent !== undefined) setLeftContent(content.leftContent);
    if (content.rightContent !== undefined) setRightContent(content.rightContent);
    if (content.showAdminButton !== undefined) setShowAdminButton(content.showAdminButton);
  }, []);

  const resetHeader = useCallback(() => {
    setLeftContent(null);
    setRightContent(null);
    setShowAdminButton(false);
  }, []);

  return (
    <HeaderContext.Provider value={{ leftContent, rightContent, showAdminButton, setHeaderContent, resetHeader }}>
      {children}
    </HeaderContext.Provider>
  );
}

export function useHeader() {
  const context = useContext(HeaderContext);
  if (context === undefined) {
    throw new Error("useHeader must be used within a HeaderProvider");
  }
  return context;
}
