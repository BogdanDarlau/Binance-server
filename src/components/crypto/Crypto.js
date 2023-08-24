import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./Crypto.css";

const Crypto = ({ cryptoList }) => {
  const [cryptoValues, setCryptoValues] = useState({});

  const fetchCryptoValues = useCallback(async () => {
    try {
      const response = await axios.get(
        `https://api.binance.com/api/v3/ticker/price`
      );
      const priceData = response.data;

      const values = {};
      cryptoList.forEach((symbol) => {
        const cryptoPrice = priceData.find((entry) => entry.symbol === symbol);
        if (cryptoPrice) {
          values[symbol] = parseFloat(cryptoPrice.price).toFixed(4);
        }
      });

      setCryptoValues(values);
    } catch (error) {
      console.error("Error fetching crypto values:", error);
    }
  }, [cryptoList]);

  useEffect(() => {
    fetchCryptoValues();
    const interval = setInterval(fetchCryptoValues, 2000); // Aggiorna ogni 3 secondi
    return () => {
      clearInterval(interval);
    };
  }, [fetchCryptoValues]);

  return (
    <div>
      {Object.entries(cryptoValues).map(([symbol, price]) => (
        <div className="price-box" key={symbol}>
          {symbol}: {price}
        </div>
      ))}
    </div>
  );
};

export default Crypto;
