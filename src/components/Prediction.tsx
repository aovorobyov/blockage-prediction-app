import { useState } from 'react';
import * as tf from '@tensorflow/tfjs';

export default function Prediction({ sequences }: { sequences: number[][] }) {
  const [prediction, setPrediction] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(false);
  const modelPaths = {
    lstm: '/models/lstm_model_tfjs/model.json',
    cnn: '/models/cnn_model_tfjs/model.json',
    'cnn-lstm': '/models/cnn_lstm_model_tfjs/model.json',
  };

  const runPrediction = async (modelType: keyof typeof modelPaths) => {
    setLoading(true);
    try {
      const model = await tf.loadLayersModel(modelPaths[modelType]);
      // Преобразуем sequences в 3D: [кол-во последовательностей, 8, 64]
      const sequences3D = sequences.map((seq) => {
        const steps: number[][] = [];
        for (let i = 0; i < seq.length; i += 64) {
          steps.push(seq.slice(i, i + 64));
        }
        return steps;
      });
      const input = tf.tensor3d(sequences3D, [sequences3D.length, 8, 64]);
      const output = model.predict(input) as tf.Tensor;
      const result = output.dataSync()[0];
      setPrediction((prev) => ({ ...prev, [modelType]: result }));
      input.dispose();
      output.dispose();
    } catch (e) {
      console.error(`Ошибка предсказания для ${modelType}:`, e);
    }
    setLoading(false);
  };

  return (
    <div className='prediction'>
      {(['lstm', 'cnn', 'cnn-lstm'] as const).map((type) => (
        <div key={type} className='prediction-item'>
          <button onClick={() => runPrediction(type)} disabled={loading}>
            Предсказать ({type.toUpperCase()})
          </button>
          {prediction[type] && (
            <p>
              Вероятность блокировки ({type.toUpperCase()}):{' '}
              {prediction[type].toFixed(2)}
            </p>
          )}
        </div>
      ))}
      {loading && <p>Загрузка модели...</p>}
      <style jsx>{`
        .prediction {
          margin-bottom: 20px;
        }
        .prediction-item {
          margin-bottom: 10px;
        }
        button {
          padding: 10px 20px;
          background-color: #0079c1;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        button:hover {
          background-color: #005b8f;
        }
        button:active {
          background-color: #004066;
        }
        button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
        p {
          margin: 5px 0;
          color: #333;
        }
      `}</style>
    </div>
  );
}
