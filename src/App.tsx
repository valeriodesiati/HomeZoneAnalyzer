import React, { useState, useEffect } from 'react';
import Survey from './components/Survey';
import Map from './components/Map';
import StartingLoading from './components/StartingLoading';

const App: React.FC = () => {
  const [surveyData, setSurveyData] = useState<Map<string, number> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate a delay to show the loading screen
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000); // 2 seconds delay

    return () => clearTimeout(timer);
  }, []);

  const handleSurveySubmit = (data: Map<string, number>) => {
    setSurveyData(data);
  };

  if (loading) {
    return <StartingLoading />;
  }

  return (
    <div>
      {surveyData ? (
        <Map surveyData={surveyData} />
      ) : (
        <Survey onSubmit={handleSurveySubmit} />
      )}
    </div>
  );
};

export default App;
