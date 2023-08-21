import React from "react";
import "./App.css";
import Crypto from "./components/crypto/Crypto";
import cryptoList from "./components/crypto/crypto.json";

const App = () => {
  return (
    <>
      <Crypto cryptoList={cryptoList} />
    </>
  );
};

export default App;
