import React from "react";

const CryptoInfoModal = ({ isOpen, onClose, cryptoSymbol }) => {
  if (!isOpen) {
    return null;
  }

  // Qui puoi implementare la logica per ottenere le informazioni sulle operazioni
  // per la crypto selezionata e visualizzarle nel modale

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Informazioni su {cryptoSymbol}</h2>
        {/* Mostra qui le informazioni legate alle operazioni */}
        {/* Esempio: lista delle operazioni, grafici, ecc. */}
        <button onClick={onClose}>Chiudi</button>
      </div>
    </div>
  );
};

export default CryptoInfoModal;
