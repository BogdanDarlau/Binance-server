import React, { useEffect, useState } from "react";
import axios from "axios";
import { useUsdtBalance } from "./usdtBalance";
import "./TradingStrategy.css";

const TradingStrategy = ({ cryptoList }) => {
  const [cryptoPrices, setCryptoPrices] = useState({});
  const [strategyDataList, setStrategyDataList] = useState({});
  const { usdtBalance, setUsdtBalance } = useUsdtBalance();
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [popupOpen, setPopupOpen] = useState(false);

  const fetchCryptoPrices = async () => {
    try {
      const response = await axios.get(
        "https://api.binance.com/api/v3/ticker/price"
      );
      const priceData = response.data;

      const prices = {};
      priceData.forEach((crypto) => {
        prices[crypto.symbol] = parseFloat(crypto.price);
      });

      setCryptoPrices(prices);
    } catch (error) {
      console.error("Error fetching crypto prices:", error);
    }
  };

  useEffect(() => {
    const interval = setInterval(fetchCryptoPrices, 2000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (Object.keys(cryptoPrices).length > 0) {
      const updatedStrategyData = {};

      cryptoList.forEach((symbol) => {
        const currentPrice = cryptoPrices[symbol];
        const currentStrategyData = strategyDataList[symbol] || {
          min: 0.95,
          max: 1.05,
          plusMin: 0.985,
          plusMax: 1.015,
          usdtIn: 5,
          lastOrder: 750000,
          totCoin: 0,
          reference: 0,
          stopLoss: 0,
          takeProfit: 0,
          start: true,
          firstPurchase: false,
          purchase: false,
          sellMinus: false,
          buyPlus: false,
          sale: false,
          saleWon: false,
          saleLost: false,
          lastOperation: "",
        };

        if (
          currentStrategyData.start &&
          currentPrice <=
            currentStrategyData.lastOrder * currentStrategyData.min &&
          usdtBalance >= currentStrategyData.usdtIn &&
          currentPrice !== 0
        ) {
          const updatedReference =
            currentStrategyData.reference + currentStrategyData.usdtIn;
          const updatedTotCoin = (
            (updatedReference / currentPrice) *
            0.999
          ).toFixed(5);
          setUsdtBalance((prevBalance) => prevBalance - updatedReference);

          // Esempio di modifica dello stato
          updatedStrategyData[symbol] = {
            ...currentStrategyData,
            lastOrder: currentPrice,
            reference: updatedReference,
            totCoin: updatedTotCoin,
            firstPurchase: true,
            start: false,
            lastOperation: "First Purchase",
          };
        } else {
          updatedStrategyData[symbol] = currentStrategyData;
        }
      });

      setStrategyDataList(updatedStrategyData);
    }
  }, [cryptoPrices, cryptoList, strategyDataList, usdtBalance, setUsdtBalance]);

  const handleOpenPopup = (symbol) => {
    setSelectedCrypto(symbol);
    setPopupOpen(true);
  };

  const handleClosePopup = () => {
    setSelectedCrypto(null);
    setPopupOpen(false);
  };

  return (
    <div>
      <p className="usdt">USDT Balance: {usdtBalance}</p>
      {cryptoList.map((symbol) => (
        <div key={symbol}>
          <div className="crypto-btn" onClick={() => handleOpenPopup(symbol)}>
            {symbol}
          </div>
        </div>
      ))}
      {popupOpen && selectedCrypto && (
        <div className="popup">
          <p className="crypto-name">{selectedCrypto}</p>
          <p>Last Order: {strategyDataList[selectedCrypto]?.lastOrder}</p>
          <p>Reference: {strategyDataList[selectedCrypto]?.reference}</p>
          <p>Total Coin: {strategyDataList[selectedCrypto]?.totCoin}</p>
          <p>
            Last Operation: {strategyDataList[selectedCrypto]?.lastOperation}{" "}
          </p>
          <div className="btn">
            <button onClick={handleClosePopup}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingStrategy;
