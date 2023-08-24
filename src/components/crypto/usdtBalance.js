import React, { createContext, useContext, useState } from "react";

const UsdtBalanceContext = createContext();

export const UsdtBalanceProvider = ({ children }) => {
  const [usdtBalance, setUsdtBalance] = useState(20000);

  return (
    <UsdtBalanceContext.Provider value={{ usdtBalance, setUsdtBalance }}>
      {children}
    </UsdtBalanceContext.Provider>
  );
};

export const useUsdtBalance = () => {
  return useContext(UsdtBalanceContext);
};
