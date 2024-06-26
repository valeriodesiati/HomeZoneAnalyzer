import React, { useState } from 'react';
import '../css/Survey.css';

interface SurveyProps {
  onSubmit: (responses: number[]) => void;
}

const questions = [
  'Quanto è importante la presenza di aree verdi nel vicinato?',
  'Quant\'è importante che ci siano almeno 2 fermate del bus vicino a te?',
  'Quant\'è importante la presenza di aree sportive pubbliche vicino a te?',
  'Quant\'è importante la presenza di rastrelliere di biciclette vicino a te?',
  'Quant\'è importante la presenza di parcheggi per veicoli elettrici?',
  'Quant\'è importante la presenza di almeno 1 struttura sanitaria privata vicino a te?',
  'Quant\'è importante la presenza di stutture sanitarie pubbliche vicino a te?',
  'Quant\'è importante la presenza di scuole vicino a te?',
  'Quant\'è importante la presenza di biblioteche vicino a te?',
  'Quant\'è importante la presenza di più di un teatro vicino a te?',
  'Quant\'è importante la presenza di farmacie vicino a te?'
];

const Survey: React.FC<SurveyProps> = ({ onSubmit }) => {
  const [responses, setResponses] = useState<number[]>(new Array(questions.length).fill(0));

  const handleChange = (index: number, value: number) => {
    const newResponses = [...responses];
    newResponses[index] = value;
    setResponses(newResponses);
  };

  const handleSubmit = () => {
    onSubmit(responses);
  };

  return (
    <div className='container'>
      <h2 className='title'>Home Zone Analyzer</h2>
      {questions.map((question, index) => (
        <div key={index} className="question">
          <p className='questionText'>{question}</p>
          <div className="surveyOptions">
            {[0, 1, 2, 3, 4, 5].map((value) => (
              <React.Fragment key={value}>
                <input
                  className='surveyAnswer'
                  type="radio"
                  name={`question-${index}`}
                  value={value}
                  id={`question-${index}-value-${value}`}
                  checked={responses[index] === value}
                  onChange={() => handleChange(index, value)}
                />
                <label htmlFor={`question-${index}-value-${value}`}>{value}</label>
              </React.Fragment>
            ))}
          </div>
        </div>
      ))}
      <button onClick={handleSubmit} className='submitButton'>Submit</button>
    </div>
  );
};

export default Survey;
