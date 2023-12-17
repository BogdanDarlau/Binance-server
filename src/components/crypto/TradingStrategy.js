import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./TradingStrategy.css";

const TradingStrategy = ({ cryptoList }) => {
  const [cryptoValues, setCryptoValues] = useState({});
  const [totalBalance, setTotalBalance] = useState(0);
  const [bilancioUSDT, setBilancioUSDT] = useState(0);
  const [incomeData, setIncomeData] = useState(0);
  const [percentual, setPercentual] = useState({});
  const [counter, setCounter] = useState(0);
  const [outgoingData, setOutgoingData] = useState(0);
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [execute, setExecute] = useState(false);
  const [timeExecute, setTimeExecute] = useState(true);
  const [allCryptoData, setAllCryptoData] = useState([]);

  // FUNZIONE PER AGGIORNARE IL BILANCIO USDT
  useEffect(() => {
    const interval = setInterval(() => {
      fetchIncomeData();
      fetchDataUsdt();
      // console.log("income", incomeData, "outgoing", outgoingData);
      if (outgoingData !== 0 || incomeData !== 0) {
        const newUsdtBalance = (
          bilancioUSDT -
          outgoingData +
          incomeData
        ).toFixed(2);
        updateUsdtData(newUsdtBalance);
        handleDeleteData();
        setExecute(false);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [execute, bilancioUSDT, incomeData, outgoingData]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeExecute(true);
    }, 300000);
    return () => clearInterval(interval);
  }, [timeExecute]);

  // FUNZIONE PER OTTENERE I DATI DEL BILANCIO USDT DAL DATABASE
  const fetchDataUsdt = async () => {
    try {
      const response = await axios.get(
        "http://192.168.10.118:3300/usdt_balance"
      ); // Sostituisci con l'URL del tuo endpoint nel server
      const usdtBalanceTable = response.data; // Supponiamo che response.data contenga le diverse tabelle

      const balance = usdtBalanceTable.map((item) => item.balance);
      // Trattamento dei dati delle tabelle come array separati

      setBilancioUSDT(balance);

      // console.log("Balancio totale:", balance);
    } catch (error) {
      console.error("Errore durante il recupero dei dati:", error);
    }
  };
  useEffect(() => {
    fetchDataUsdt();
  }, []);

  // FUNZIONE PER OTTENERE I DATI DELLE OPERAZIONI CRYPTO DAL DATABASE
  const fetchData = async () => {
    try {
      const response = await axios.get("http://192.168.10.118:3300/crypto"); // Sostituisci con l'URL del tuo endpoint nel server
      const cryptoTable = response.data; // Supponiamo che response.data contenga le diverse tabelle

      setAllCryptoData(cryptoTable);
      // console.log(cryptoTable);
    } catch (error) {
      console.error("Errore durante il recupero dei dati:", error);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

  // FUNZIONE PER CALCOLARE LA PERCENTUALE DI CRESCITA/DISCESA
  useEffect(() => {
    const calculatePercentual = async () => {
      const percentuali = {};
      allCryptoData.forEach((crypto) => {
        const symbol = crypto.symbol;
        const lastPrice = parseFloat(crypto.lastorder);
        const currentPrice = parseFloat(cryptoValues[symbol]);
        const difference = Math.abs(lastPrice - currentPrice);
        const percentualeAssoluta = ((difference * 100) / lastPrice).toFixed(2);

        const calculator =
          currentPrice < lastPrice
            ? `-${Math.abs(percentualeAssoluta)}`
            : `+${percentualeAssoluta}`;

        percentuali[symbol] = calculator;
      });
      setPercentual(percentuali);
    };

    // FUNZIONE PER CALCOLARE IL BILANCIO TOTALE
    const calculateTotalBalance = async () => {
      const totalValues = {};
      let totale = parseFloat(bilancioUSDT);
      let numeroIntero;
      allCryptoData.forEach((crypto) => {
        const symbol = crypto.symbol;
        const totCoin = parseFloat(crypto.totcoin);
        const currentPrice = parseFloat(cryptoValues[symbol]);
        const value = totCoin * currentPrice;

        totalValues[symbol] = value;
        totale += value;
        numeroIntero = totale.toFixed(2);
      });

      setTotalBalance(numeroIntero);
    };

    calculatePercentual();
    calculateTotalBalance();
  }, [bilancioUSDT, totalBalance, allCryptoData, cryptoValues]);

  // FUNZIONE PER OTTENERE LA SOMMA DEI DATI INCOME E OUTGOING DAL DATABASE
  const fetchIncomeData = async () => {
    try {
      const response = await axios.get("http://192.168.10.118:3300/usdt_data"); // Sostituisci con l'URL del tuo endpoint nel server
      const incomeData = response.data; // Supponiamo che response.data contenga le diverse tabelle

      // console.log("incomeData", incomeData);
      if (incomeData.length > 0) {
        const incomes = incomeData.map((item) => item.income);
        const numericIn = incomes.map(parseFloat);
        // console.log("in", numericIn);
        const sumIncome = numericIn
          .reduce((accumulator, currentValue) => accumulator + currentValue, 0)
          .toFixed(2);
        const totalIncome = parseFloat(sumIncome);
        // console.log("sumIn", totalIncome);

        const outgoings = incomeData.map((item) => item.outgoing);
        const numericOut = outgoings.map(parseFloat);
        // console.log("out", numericOut);
        const sumOutgoing = numericOut
          .reduce((accumulator, currentValue) => accumulator + currentValue, 0)
          .toFixed(2);
        const totalOutgoing = parseFloat(sumOutgoing);
        // console.log("suma", totalOutgoing);

        setIncomeData(parseFloat(totalIncome));
        setOutgoingData(parseFloat(totalOutgoing));
      } else {
        setIncomeData(0);
        setOutgoingData(0);
      }
    } catch (error) {
      console.error("Errore durante il recupero dei dati:", error);
    }
  };

  // FUNZIONE PER CANCELLARE LE TABELLE INCOME E OUTGOING DAL DATABASE
  const handleDeleteData = async () => {
    try {
      const response = await axios.delete(
        "http://192.168.10.118:3300/delete-usdt-data"
      );
      console.log(response.data.message); // Messaggio di conferma dal server
    } catch (error) {
      console.error("Errore durante la cancellazione dei dati:", error);
    }
  };

  // FUNZIONE PER INVIARE DATI DEGLI ACQUISTI E VENDITE NEL DATABASE (INCOME E OUTGOING)
  const sendValue = async (column, incomeValue, outgoingValues) => {
    try {
      await axios.post("http://192.168.10.118:3300/insert-income", {
        incomeValue,
        outgoingValues,
        column,
      });
    } catch (error) {
      console.error("Errore durante l'invio dei dati:", error);
    }
  };

  // FUNZIONE PER AGGIORNARE I DATI DELLE CRYPTO NEL DATABASE
  const updateData = async (fieldName, symbolName, newValue) => {
    try {
      const tableName = "crypto";
      await axios.put("http://192.168.10.118:3300/update-table", {
        tableName,
        newValue,
        fieldName,
        symbolName,
      });
      console.log(
        `Valore ${fieldName} di ${symbolName} aggiornato con successo!`
      );
    } catch (error) {
      console.error("Errore durante l'aggiornamento :", error);
    }
  };

  // FUNZIONE PER AGGIORNARE IL BILANCIO USDT NEL DATABASE
  const updateUsdtData = async (newValue) => {
    try {
      const tableName = "usdt_balance";
      const fieldName = "balance";
      await axios.put("http://192.168.10.118:3300/update-usdt_balance", {
        tableName,
        newValue,
        fieldName,
      });
      console.log("Nuovo valore usdt aggiornato con successo!");
    } catch (error) {
      console.error("Errore durante l'aggiornamento :", error);
    }
  };

  // FUNZIONE PER OTTENERE I PREZZI IN TEMPO REALE DAI DATI API DI BINANCE
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
          values[symbol] = parseFloat(parseFloat(cryptoPrice.price).toFixed(8));
        }
      });

      setCryptoValues(values);
    } catch (error) {
      console.error("Error fetching crypto values:", error);
    }
  }, [cryptoList]);
  useEffect(() => {
    fetchCryptoValues();
    const interval = setInterval(fetchCryptoValues, 5000);
    return () => {
      clearInterval(interval);
    };
  }, [fetchCryptoValues]);

  // Funzione per ottenere la data e l'ora correnti
  function getCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0") - 1;
    const minutes = String(now.getMinutes()).padStart(2, "0");

    const formattedDateTime = `${day}-${month}-${year} ${hours}:${minutes}`;

    return formattedDateTime.toString();
  }

  // FUNZIONE DELLE OPERAZIONI DI TRADING PRINCIPALE
  useEffect(() => {
    const min = 0.95;
    const max = 1.05;
    const plusMax = 1.015;
    const plusMin = 0.985;
    const usdtIn = 10;

    if (timeExecute) {
      fetchData();
      fetchDataUsdt();
      allCryptoData.forEach((crypto) => {
        const symbol = crypto.symbol;
        const lastOrder = parseFloat(crypto.lastorder);
        const totCoin = parseFloat(crypto.totcoin);
        const reference = parseFloat(crypto.reference);
        const stopLoss = parseFloat(crypto.stoploss);
        const takeprofit = parseFloat(crypto.takeprofit);
        const currentPrice = parseFloat(cryptoValues[symbol]);

        // FIRST OPERATION (FIRSTPURCHASE)
        if (
          !execute &&
          crypto.start &&
          currentPrice !== 0 &&
          bilancioUSDT >= usdtIn * 3
        ) {
          // const updatedReference = reference + usdtIn;
          // const updatedtotcoin = (
          //   (updatedReference / currentPrice) *
          //   0.999
          // ).toFixed(5);

          // fetchData();
          // fetchDataUsdt();
          // const newDate = getCurrentDateTime();
          // updateData("date", symbol, newDate);

          const newLastorder = parseFloat(currentPrice);
          updateData("lastorder", symbol, newLastorder);

          // const newTotcoin = parseFloat(updatedtotcoin);
          // updateData("totcoin", symbol, newTotcoin);

          // const newReference = parseFloat(updatedReference);
          // updateData("reference", symbol, newReference);

          const newStart = "false";
          updateData("start", symbol, newStart);

          const newFirspurchase = "true";
          updateData("firstpurchase", symbol, newFirspurchase);

          // const newLastoperation = "first operation";
          // updateData("lastoperation", symbol, newLastoperation);

          // sendValue("income, outgoing", 0, newReference);
          setExecute(true);
          // fetchData();
        }

        // OTHER PURCHASE ORDERS (PURCHASE)
        if (
          (crypto.sale || crypto.sellminus || crypto.salelost) &&
          !execute &&
          currentPrice <= lastOrder * min &&
          bilancioUSDT >= usdtIn * 3
        ) {
          let updatedReference;
          if (reference < bilancioUSDT - usdtIn * 2) {
            updatedReference = reference + usdtIn;
          } else {
            updatedReference =
              Math.round(bilancioUSDT / usdtIn) * usdtIn - usdtIn;
          }
          const updatedtotcoin = (
            (updatedReference / currentPrice) *
            0.999
          ).toFixed(5);

          fetchData();
          fetchDataUsdt();
          const newDate = getCurrentDateTime();
          updateData("date", symbol, newDate);

          const newLastorder = parseFloat(currentPrice);
          updateData("lastorder", symbol, newLastorder);

          const newTotcoin = parseFloat(updatedtotcoin);
          updateData("totcoin", symbol, newTotcoin);

          const newReference = parseFloat(updatedReference);
          updateData("reference", symbol, newReference);

          const newPurchase = "true";
          updateData("purchase", symbol, newPurchase);
          updateData("firstpurchase", symbol, "false");

          if (crypto.sale) {
            const newSale = "false";
            updateData("sale", symbol, newSale);
          }

          if (crypto.sellminus) {
            const newSellminus = "false";
            updateData("sellminus", symbol, newSellminus);
          }

          if (crypto.salelost) {
            const newSalelost = "false";
            updateData("salelost", symbol, newSalelost);
          }

          const newLastoperation = "NEW PURCHASE";
          updateData("lastoperation", symbol, newLastoperation);

          sendValue("income, outgoing", 0, updatedReference);
          setExecute(true);
          fetchData();
        }

        // SALE ORDER STOP LOSS -3% (SALE MINUS)
        else if (
          (crypto.firstpurchase || crypto.purchase || crypto.buyplus) &&
          !execute &&
          currentPrice <= lastOrder * plusMin
        ) {
          // console.log("lastorder", lastOrder, "price", currentPrice);
          const newIncome = (totCoin * currentPrice * 0.999).toFixed(2);

          fetchData();
          fetchDataUsdt();
          const newDate = getCurrentDateTime();
          updateData("date", symbol, newDate);

          const newLastorder = parseFloat(currentPrice);
          updateData("lastorder", symbol, newLastorder);
          updateData("stoploss", symbol, newLastorder);

          updateData("totcoin", symbol, "0");

          const newSellminus = "true";
          updateData("sellminus", symbol, newSellminus);

          if (crypto.firstpurchase) {
            const newFirspurchase = "false";
            updateData("firstpurchase", symbol, newFirspurchase);
          }

          if (crypto.purchase) {
            const newPurchase = "false";
            updateData("purchase", symbol, newPurchase);
          }

          if (crypto.buyplus) {
            const newBuyplus = "false";
            updateData("buyplus", symbol, newBuyplus);
          }

          const newLastoperation = "Sold in Minus(lost)";
          updateData("lastoperation", symbol, newLastoperation);

          sendValue("income, outgoing", newIncome, 0);
          setExecute(true);
          fetchData();
        }

        //PURCHASE ORDER TO ASCENT +3% (BUY PLUS)
        else if (
          crypto.sellminus &&
          !execute &&
          currentPrice >= stopLoss * plusMax &&
          bilancioUSDT >= usdtIn * 3
        ) {
          let updatedReference;
          if (reference < bilancioUSDT - usdtIn * 2) {
            updatedReference = reference;
          } else {
            updatedReference =
              Math.round(bilancioUSDT / usdtIn) * usdtIn - usdtIn;
          }
          const updatedtotcoin = (
            (updatedReference / currentPrice) *
            0.999
          ).toFixed(5);

          fetchData();
          fetchDataUsdt();
          const newDate = getCurrentDateTime();
          updateData("date", symbol, newDate);

          const newLastorder = parseFloat(currentPrice);
          updateData("lastorder", symbol, newLastorder);

          const newTotcoin = parseFloat(updatedtotcoin);
          updateData("totcoin", symbol, newTotcoin);

          const newReference = parseFloat(updatedReference);
          updateData("reference", symbol, newReference);

          const newBuyplus = "true";
          updateData("buyplus", symbol, newBuyplus);

          const newSellminus = "false";
          updateData("sellminus", symbol, newSellminus);

          const newLastoperation = "Bought after stoploss";
          updateData("lastoperation", symbol, newLastoperation);

          sendValue("income, outgoing", 0, updatedReference);
          setExecute(true);
          fetchData();
        }

        //SALE ORDER (SELL)
        else if (
          (crypto.firstpurchase ||
            crypto.purchase ||
            crypto.buyplus ||
            crypto.salewon) &&
          !execute &&
          currentPrice >= lastOrder * max
        ) {
          const newIncome = (totCoin * currentPrice * 0.999).toFixed(2);

          fetchData();
          fetchDataUsdt();
          const newDate = getCurrentDateTime();
          updateData("date", symbol, newDate);

          const newLastorder = parseFloat(currentPrice);
          updateData("lastorder", symbol, newLastorder);

          updateData("totcoin", symbol, "0");

          const newSale = "true";
          updateData("sale", symbol, newSale);

          if (crypto.firstpurchase) {
            const newFirspurchase = "false";
            updateData("firstpurchase", symbol, newFirspurchase);
          }

          if (crypto.purchase) {
            const newPurchase = "false";
            updateData("purchase", symbol, newPurchase);
          }

          if (crypto.buyplus) {
            const newBuyplus = "false";
            updateData("buyplus", symbol, newBuyplus);
          }

          if (crypto.salewon) {
            const newSalewon = "false";
            updateData("salewon", symbol, newSalewon);
          }

          const newLastoperation = "SOLD";
          updateData("lastoperation", symbol, newLastoperation);

          sendValue("income, outgoing", newIncome, 0);
          setExecute(true);
          fetchData();
        }

        //PURCHASE ORDER TAKE PROFIT +3% (SALEWON)
        else if (
          (crypto.sale || crypto.salelost) &&
          !execute &&
          currentPrice >= lastOrder * plusMax &&
          bilancioUSDT >= usdtIn * 3
        ) {
          let updatedReference;
          if (reference < bilancioUSDT - usdtIn * 2) {
            updatedReference = reference;
          } else {
            updatedReference =
              Math.round(bilancioUSDT / usdtIn) * usdtIn - usdtIn;
          }
          const updatedtotcoin = (
            (updatedReference / currentPrice) *
            0.999
          ).toFixed(5);

          fetchData();
          fetchDataUsdt();
          const newDate = getCurrentDateTime();
          updateData("date", symbol, newDate);

          const newLastorder = parseFloat(currentPrice);
          updateData("lastorder", symbol, newLastorder);
          updateData("takeprofit", symbol, newLastorder);

          const newTotcoin = parseFloat(updatedtotcoin);
          updateData("totcoin", symbol, newTotcoin);

          const newReference = parseFloat(updatedReference);
          updateData("reference", symbol, newReference);

          const newSalewon = "true";
          updateData("salewon", symbol, newSalewon);

          if (crypto.sale) {
            const newSale = "false";
            updateData("sale", symbol, newSale);
          }

          if (crypto.salelost) {
            const newSalelost = "false";
            updateData("salelost", symbol, newSalelost);
          }

          const newLastoperation = "Bought after sale";
          updateData("lastoperation", symbol, newLastoperation);

          sendValue("income, outgoing", 0, updatedReference);
          setExecute(true);
          fetchData();
        }

        // RESALE ORDER TAKE PROFIT - 3% (SALE LOST)
        else if (
          !execute &&
          crypto.salewon &&
          currentPrice <= takeprofit * plusMin
        ) {
          const newIncome = (totCoin * currentPrice * 0.999).toFixed(2);

          fetchData();
          fetchDataUsdt();
          const newDate = getCurrentDateTime();
          updateData("date", symbol, newDate);

          const newLastorder = parseFloat(currentPrice);
          updateData("lastorder", symbol, newLastorder);

          updateData("totcoin", symbol, "0");

          const newSalelost = "true";
          updateData("salelost", symbol, newSalelost);

          if (crypto.firstpurchase) {
            const newFirspurchase = "false";
            updateData("firstpurchase", symbol, newFirspurchase);
          }

          if (crypto.purchase) {
            const newPurchase = "false";
            updateData("purchase", symbol, newPurchase);
          }

          if (crypto.buyplus) {
            const newBuyplus = "false";
            updateData("buyplus", symbol, newBuyplus);
          }

          if (crypto.salewon) {
            const newSalewon = "false";
            updateData("salewon", symbol, newSalewon);
          }

          const newLastoperation = "Sold in takeprofit";
          updateData("lastoperation", symbol, newLastoperation);

          sendValue("income, outgoing", newIncome, 0);
          setExecute(true);
          fetchData();
        }
        const count = counter + 1;
        setCounter(count);
      });

      if (counter >= allCryptoData.length) {
        setTimeExecute(false);
        setCounter(0);
      }
    }
  }, [
    timeExecute,
    counter,
    execute,
    cryptoValues,
    bilancioUSDT,
    allCryptoData,
  ]);

  // PUPUP DEI DATI DELLA CRYPTO SELEZIONATA
  const handleOpenPopup = (symbol) => {
    setSelectedCrypto(symbol);
    setPopupOpen(true);
  };
  const handleClosePopup = () => {
    setSelectedCrypto(null);
    setPopupOpen(false);
  };
  const selectedCryptoData = allCryptoData.find(
    (crypto) => crypto.symbol === selectedCrypto
  );

  return (
    <div>
      <p className="init">Init Budget: 10000 USDT</p>
      <p className="total-balance">Total Balance: {totalBalance} $ </p>
      <p className="usdt">USDT Balance: {bilancioUSDT}</p>
      {Object.entries(cryptoValues).map(([symbol, price]) => (
        <div key={symbol}>
          <div className="crypto-btn" onClick={() => handleOpenPopup(symbol)}>
            <div>{symbol}</div>
            <div className="prices">
              {price}
              <p
                className={`percentual ${
                  percentual[symbol] < 0 ? "rosso" : "verde"
                }`}
              >
                {percentual[symbol]}%
              </p>
            </div>
          </div>
        </div>
      ))}
      {popupOpen && selectedCrypto && (
        <div className="popup">
          <p className="crypto-name">{selectedCrypto}</p>
          <p>Last Order: {selectedCryptoData.lastorder}</p>
          <p>Reference: {selectedCryptoData.reference}</p>
          <p>Total Coin: {selectedCryptoData.totcoin}</p>
          <p>Last Operation: {selectedCryptoData.lastoperation}</p>
          <p>Date: {selectedCryptoData.date}</p>
          <div className="btn">
            <button onClick={handleClosePopup}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingStrategy;
