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
  const [cryptoSavedData, setCryptoSavedData] = useState([]);
  const [allCryptoData, setAllCryptoData] = useState({});

  // Carica i dati da Gist all'avvio dell'app
  useEffect(() => {
    const fetchData = async () => {
      try {
        const gistResponse = await axios.get(
          "https://gist.github.com/BogdanDarlau/fa20eee5fd7085085611bacf285126b3"
        );

        // Estrai il contenuto del file data.json dal Gist
        const dataJson = gistResponse.data.files["data.json"].content;
        const parsedData = JSON.parse(dataJson);
        console.log(parsedData);
        setCryptoSavedData(parsedData);
        setAllCryptoData(parsedData);
      } catch (error) {
        console.error("Error fetching data from Gist:", error);
      }
    };

    fetchData();
  }, []);

  // Aggiungi questa parte sotto gli altri import e hook
  const updateGistData = async (updatedData) => {
    const gistUrl =
      "https://gist.github.com/BogdanDarlau/fa20eee5fd7085085611bacf285126b3"; // Sostituisci con l'URL del tuo Gist
    const accessToken = "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"; // Sostituisci con il tuo token di accesso

    try {
      const response = await axios.patch(
        gistUrl,
        {
          files: {
            "data.json": {
              content: JSON.stringify(updatedData, null, 2), // 2 per indentare i dati
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
    if (
      Object.keys(cryptoPrices).length > 0 &&
      Object.keys(cryptoSavedData).length > 0
    ) {
      const updatedStrategyData = {};
      const allCryptoData = { ...cryptoSavedData }; // Copia i dati dei cryptoSavedData

      cryptoList.forEach((symbol) => {
        const currentPrice = cryptoPrices[symbol];
        const cryptoSymbolData = allCryptoData[symbol];
        const currentStrategyData = strategyDataList[symbol] || {
          min: 0.95,
          max: 1.05,
          plusMin: 0.985,
          plusMax: 1.015,
          usdtIn: 5,
        };

        if (
          cryptoSymbolData &&
          cryptoSymbolData.start &&
          currentPrice <=
            cryptoSymbolData.lastOrder * currentStrategyData.min &&
          usdtBalance >= currentStrategyData.usdtIn &&
          currentPrice !== 0
        ) {
          const updatedReference =
            cryptoSymbolData.reference + currentStrategyData.usdtIn;
          const updatedTotCoin = (
            (updatedReference / currentPrice) *
            0.999
          ).toFixed(5);
          setUsdtBalance((prevBalance) => prevBalance - updatedReference);

          // Esempio di modifica dello stato
          updatedStrategyData[symbol] = {
            ...cryptoSymbolData,
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

      // Aggiorna i dati nel Gist solo se sono cambiati
      if (JSON.stringify(allCryptoData) !== JSON.stringify(cryptoSavedData)) {
        updateGistData(allCryptoData).then((updatedData) => {
          if (updatedData) {
            console.log("Gist data updated successfully:", updatedData);
            setCryptoSavedData(allCryptoData); // Aggiorna anche lo stato locale
          }
        });
      }

      setStrategyDataList(updatedStrategyData);
    }
  }, [
    cryptoPrices,
    cryptoList,
    strategyDataList,
    usdtBalance,
    setUsdtBalance,
    cryptoSavedData,
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
