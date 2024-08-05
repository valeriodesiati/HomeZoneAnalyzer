// LoadingScreen.tsx
import React from 'react';
import '../css/StartingLoading.css'
const StartingLoading: React.FC = () => {
  return (
    <div className="loaderContainer2">
        <span className="loader2"></span>
        <h2>Wait a sec, we are loading the app....</h2>
    </div>
    
  );
};

export default StartingLoading;
