import React from "react";
import "./App.css";
import TradingStrategy from "./components/crypto/TradingStrategy";
import cryptoList from "./components/crypto/allCrypto.json";

const App = () => {
  return (
    <>
      <div className="page">
        <div className="crypto-name-list">
          <TradingStrategy cryptoList={cryptoList} />
        </div>
      </div>
    </>
  );
};

export default App;
