import React, { useEffect, useState } from "react";
import axios from "axios";
import { useUsdtBalance } from "./usdtBalance";

const TradingStrategy = ({ cryptoList }) => {
  const [cryptoPrices, setCryptoPrices] = useState({});
  const [strategyDataList, setStrategyDataList] = useState({});
  const { usdtBalance, setUsdtBalance } = useUsdtBalance();

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
    const interval = setInterval(fetchCryptoPrices, 3000); // Aggiorna ogni 3 secondi

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

  return (
    <div>
      <p>USDT Balance: {usdtBalance}</p>
      {cryptoList.map((symbol) => (
        <div key={symbol}>
          <p>Crypto Name: {symbol}</p>
          <p>Last Order: {strategyDataList[symbol]?.lastOrder}</p>
          <p>reference: {strategyDataList[symbol]?.reference}</p>
          <p>Total Coin: {strategyDataList[symbol]?.totCoin}</p>
          <p>Last Operation: {strategyDataList[symbol]?.lastOperation} </p>
        </div>
      ))}
    </div>
  );
};

export default TradingStrategy;
