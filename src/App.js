import React from "react";
import "./App.css";
import Crypto from "./components/crypto/Crypto";
import TradingStrategy from "./components/crypto/TradingStrategy";
import cryptoList from "./components/crypto/crypto.json";
import { UsdtBalanceProvider } from "./components/crypto/usdtBalance";

const App = () => {
  return (
    <>
      <UsdtBalanceProvider>
        <Crypto cryptoList={cryptoList} />
        <TradingStrategy cryptoList={cryptoList} />
      </UsdtBalanceProvider>
    </>
  );
};

export default App;
