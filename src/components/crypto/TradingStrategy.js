import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useUsdtBalance } from "./usdtBalance";
import "./TradingStrategy.css";

const TradingStrategy = ({ cryptoList }) => {
  const [cryptoValues, setCryptoValues] = useState({});
  const { usdtBalance, setUsdtBalance } = useUsdtBalance();
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [cryptoSavedData, setCryptoSavedData] = useState([]);
  const [allCryptoData, setAllCryptoData] = useState({});

  // Carica i dati da Gist all'avvio dell'app

  const fetchData = async () => {
    try {
      const gistResponse = await axios.get(
        "https://api.github.com/gists/fa20eee5fd7085085611bacf285126b3"
      );

      // Estrai il contenuto del file data.json dal Gist
      const dataJson = gistResponse.data.files["data.json"].content;
      const parsedData = JSON.parse(dataJson);
      // console.log(parsedData);
      setAllCryptoData(parsedData);
    } catch (error) {
      console.error("Error fetching data from Gist:", error);
    }
  };

  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, 500);

    return () => clearInterval(interval);
  }, []);

  // Aggiungi questa parte sotto gli altri import e hook
  const updateGistData = async (updatedAllCryptoData) => {
    const accessToken = "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"; // Sostituisci con il tuo token di accesso

    try {
      const gistUrl = `https://api.github.com/gists/fa20eee5fd7085085611bacf285126b3`;
      const response = await axios.patch(
        gistUrl,
        {
          files: {
            "data.json": {
              content: JSON.stringify(updatedAllCryptoData, null, 2), // 2 per indentare i dati
            },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error updating Gist data:", error);
      return null;
    }
  };

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

  useEffect(() => {
    const updatedAllCryptoData = { ...allCryptoData };
    const cryptoSymbolData = allCryptoData;
    const min = 0.95;
    // const max = 1.05;
    // const plusMax = 0.985;
    const plusMin = 1.105;
    const usdtIn = 5;

    cryptoList.forEach((symbol) => {
      const currentPrice = cryptoValues[symbol];
      // const cryptoSymbolData = updatedAllCryptoData[symbol];
      console.log(cryptoSymbolData.start);

      // FIRST PURCHASE
      if (cryptoSymbolData.start === false && usdtBalance >= usdtIn) {
        const newUsdtBalance = usdtBalance - usdtIn;
        setUsdtBalance(newUsdtBalance);
        const updatedReference = cryptoSymbolData.reference + usdtIn;
        const updatedTotCoin = (
          (updatedReference / currentPrice) *
          0.999
        ).toFixed(5);

        updatedAllCryptoData[symbol] = {
          ...allCryptoData,
          date: "01-09-2023 22:33:00",
          lastOrder: currentPrice,
          totCoin: updatedTotCoin,
          reference: updatedReference,
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
          lastOperation: "prima operazione",
          profit: 0,
        };

        if (JSON.stringify(allCryptoData) !== JSON.stringify(cryptoSavedData)) {
          console.log("Updating Gist data...");

          updateGistData(updatedAllCryptoData).then((updatedData) => {
            if (updatedData) {
              setCryptoSavedData(updatedAllCryptoData);
            }
          });
        }
        // OTHER PURCHASE ORDERS (PURCHASE)
      } else if (
        (cryptoSymbolData.sale ||
          cryptoSymbolData.sellMinus ||
          cryptoSymbolData.saleLost) &&
        currentPrice <= cryptoSymbolData.lastOrder * min &&
        usdtBalance >= usdtIn * 3
      ) {
        const newUsdtBalance = usdtBalance - usdtIn;
        setUsdtBalance(newUsdtBalance);
        const updatedReference = cryptoSymbolData.reference + usdtIn;
        const updatedTotCoin = (
          (updatedReference / currentPrice) *
          0.999
        ).toFixed(5);

        updatedAllCryptoData[symbol] = {
          ...allCryptoData,
          date: "01-09-2023 22:33:00",
          lastOrder: currentPrice,
          totCoin: updatedTotCoin,
          reference: updatedReference,
          stopLoss: 0,
          takeProfit: 0,
          start: false,
          firstPurchase: false,
          purchase: true,
          sellMinus: false,
          buyPlus: false,
          sale: false,
          saleWon: false,
          saleLost: false,
          lastOperation: "purchase",
          profit: 0,
        };

        if (JSON.stringify(allCryptoData) !== JSON.stringify(cryptoSavedData)) {
          console.log("Updating Gist data...");

          updateGistData(updatedAllCryptoData).then((updatedData) => {
            if (updatedData) {
              setCryptoSavedData(updatedAllCryptoData);
            }
          });
        }

        // SALE ORDER STOP LOSS (SALE MINUS)
      } else if (
        (cryptoSymbolData.firstPurchase ||
          cryptoSymbolData.purchase ||
          cryptoSymbolData.buyPlus) &&
        currentPrice <= cryptoSymbolData.lastOrder * plusMin
      ) {
        updatedAllCryptoData[symbol] = {
          ...allCryptoData,
          date: "01-09-2023 22:33:00",
          lastOrder: currentPrice,
          totCoin: cryptoSymbolData.totCoin,
          reference: cryptoSymbolData.reference,
          stopLoss: currentPrice,
          takeProfit: 0,
          start: false,
          firstPurchase: false,
          purchase: false,
          sellMinus: true,
          buyPlus: false,
          sale: false,
          saleWon: false,
          saleLost: false,
          lastOperation: "sold in stoploss",
          profit: 0,
        };

        if (JSON.stringify(allCryptoData) !== JSON.stringify(cryptoSavedData)) {
          console.log("Updating Gist data...");

          updateGistData(updatedAllCryptoData).then((updatedData) => {
            if (updatedData) {
              setCryptoSavedData(updatedAllCryptoData);
            }
          });
        }
      }
    });
  }, [
    cryptoList,
    cryptoValues,
    setUsdtBalance,
    usdtBalance,
    cryptoSavedData,
    allCryptoData,
  ]);

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
      {Object.entries(cryptoValues).map(([symbol, price]) => (
        <div key={symbol}>
          <div className="crypto-btn" onClick={() => handleOpenPopup(symbol)}>
            <div>{symbol}</div> <div className="prices">{price}</div>
          </div>
        </div>
      ))}
      {popupOpen && selectedCrypto && (
        <div className="popup">
          <p className="crypto-name">{selectedCrypto}</p>
          <p>Last Order: {allCryptoData[selectedCrypto]?.lastOrder}</p>
          <p>Reference: {allCryptoData[selectedCrypto]?.reference}</p>
          <p>Total Coin: {allCryptoData[selectedCrypto]?.totCoin}</p>
          <p>Last Operation: {allCryptoData[selectedCrypto]?.lastOperation}</p>
          <div className="btn">
            <button onClick={handleClosePopup}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingStrategy;
