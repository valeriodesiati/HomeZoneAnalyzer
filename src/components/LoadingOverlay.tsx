import React from 'react';
import '../css/LoadingOverlay.css'

const LoadingOverlay: React.FC = () => {
  return (
    <div className='containerOverlay'>
     <span className="loader"></span>
     <h2>Loading, please wait</h2>
     
    </div>
  );
};

export default LoadingOverlay;
