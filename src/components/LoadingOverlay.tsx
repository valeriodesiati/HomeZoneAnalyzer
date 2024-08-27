import React from 'react';
import '../css/LoadingOverlay.css'

// spinner di caricamento una volta completato il sondaggio dopo il quale si attende la renderizzazione della mappa con tutti gli elementi richiesti.
const LoadingOverlay: React.FC = () => {
  return (
    <div className='containerOverlay'>
     <span className="loader"></span>
     <h2>Loading, please wait</h2>
     
    </div>
  );
};

export default LoadingOverlay;
