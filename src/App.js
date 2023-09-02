import React from "react";
import "./App.css";
import TradingStrategy from "./components/crypto/TradingStrategy";
import cryptoList from "./components/crypto/crypto.json";
import { UsdtBalanceProvider } from "./components/crypto/usdtBalance";

const App = () => {
  return (
    <>
      <UsdtBalanceProvider>
        <div className="page">
          <div className="crypto-name-list">
            <TradingStrategy cryptoList={cryptoList} />
          </div>
        </div>
      </UsdtBalanceProvider>
    </>
  );
};

export default App;
