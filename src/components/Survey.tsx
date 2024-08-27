import React, { useState } from 'react';
import '../css/Survey.css';

//interfaccia props da comunicare tra Map e Survey
interface SurveyProps {
  onSubmit: (responses: Map<string, number>) => void;
}

//lista domande per ogni tipo di PoI
const questions = [
  { text: 'Quanto è importante la presenza di aree verdi nel vicinato?', poi: 'greenAreas' },
  { text: 'Quant\'è importante che ci siano almeno 2 fermate del bus vicino a te?', poi: 'busStops' },
  { text: 'Quant\'è importante la presenza di aree sportive pubbliche vicino a te?', poi: 'sportsAreas' },
  { text: 'Quant\'è importante la presenza di rastrelliere di biciclette vicino a te?', poi: 'bikeRacks' },
  { text: 'Quant\'è importante la presenza di parcheggi per veicoli elettrici?', poi: 'electricStations' },
  { text: 'Quant\'è importante la presenza di almeno 1 struttura sanitaria privata vicino a te?', poi: 'hospitals' },
  { text: 'Quant\'è importante la presenza di scuole vicino a te?', poi: 'schools' },
  { text: 'Quant\'è importante la presenza di biblioteche vicino a te?', poi: 'libraries' },
  { text: 'Quant\'è importante la presenza di più di un teatro vicino a te?', poi: 'theaters' },
  { text: 'Quant\'è importante la presenza di farmacie vicino a te?', poi: 'pharmacies' },
  {text:'Quant\'è importante la presenza di aree ludiche vicino a te?', poi:'ludics'}
];



const Survey: React.FC<SurveyProps> = ({ onSubmit }) => {
  const initialResponses = new Map(questions.map(question => [question.poi, 0]));
  const [responses, setResponses] = useState<Map<string, number>>(initialResponses);
  //assegnamento valore quando premo un bottone con l'interesse per  ogni PoI
  const handleChange = (poi: string, value: number) => {
    const newResponses = new Map(responses);
    newResponses.set(poi, value);
    setResponses(newResponses);
  };
  // invio risposta al componente Map
  const handleSubmit = () => {
    onSubmit(responses);
  };

  return (
    <div className='container'>
      <h2 className='title'>Home Zone Analyzer</h2>
      {questions.map((question, index) => (
        <div key={index} className="question">
          <p className='questionText'>{question.text}</p>
          <div className="surveyOptions">
            {[0, 1, 2, 3, 4, 5].map((value) => (
              <React.Fragment key={value}>
                <input
                  className='surveyAnswer'
                  type="radio"
                  name={`question-${index}`}
                  value={value}
                  id={`question-${index}-value-${value}`}
                  checked={responses.get(question.poi) === value}
                  onChange={() => handleChange(question.poi, value)}
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
