import React, { useState } from 'react';
import Survey from './components/Survey';
import Map from './components/Map';

const App: React.FC = () => {
  const [surveyData, setSurveyData] = useState<number[] | null>(null);

  const handleSurveySubmit = (data: number[]) => {
    setSurveyData(data);
  };

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
