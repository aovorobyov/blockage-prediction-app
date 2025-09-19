import { useState } from 'react';
import DataUpload from '../components/DataUpload';
import DataVisualization from '../components/DataVisualization';
import Prediction from '../components/Prediction';
import dynamic from 'next/dynamic';

const ModelComparison = dynamic(() => import('../components/ModelComparison'), {
  ssr: false, // Отключаем SSR
});
interface Metrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
}

export default function Home() {
  const [sequences, setSequences] = useState<number[][]>([]);
  const [labels, setLabels] = useState<number[]>([]);
  const [prediction, setPrediction] = useState<
    { [key: string]: number } | undefined
  >(undefined); // Состояние для предсказания
  const [metrics] = useState<{ [key: string]: Metrics }>({
    lstm: { accuracy: 0.6809, precision: 0.5865, recall: 0.6546, f1: 0.6187 },
    cnn: { accuracy: 0.6239, precision: 0.5185, recall: 0.6854, f1: 0.5904 },
    'cnn-lstm': {
      accuracy: 0.607,
      precision: 0.5022,
      recall: 0.7099,
      f1: 0.5883,
    },
  });

  const handleDataLoaded = (newSequences: number[][], newLabels: number[]) => {
    setSequences(newSequences);
    setLabels(newLabels);
    // Очищаем предсказание при новой загрузке датасета
    setPrediction(undefined);
  };

  // Функция для обновления предсказания из Prediction
  const updatePrediction = (newPrediction: { [key: string]: number }) => {
    setPrediction(newPrediction);
  };

  return (
    <div className='container'>
      <header>
        <div className='logo-placeholder'>
          <img src='/logo.svg' alt='Логотип университета' />
        </div>
        <h1>Анализ блокировок в THz/mmWave системах</h1>
      </header>
      <main>
        <DataUpload onDataLoaded={handleDataLoaded} />
        {sequences.length > 0 && (
          <>
            <DataVisualization
              sequences={sequences}
              labels={labels}
              prediction={prediction?.['cnn']} // Передаем предсказание для одной модели (например, cnn)
            />
            <Prediction
              sequences={sequences}
              updatePrediction={updatePrediction}
            />
            <ModelComparison metrics={metrics} />
          </>
        )}
      </main>
      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        header {
          display: flex;
          align-items: center;
          margin-bottom: 40px;
        }
        .logo-placeholder {
          height: 50px;
          margin-right: 20px;
        }
        .logo-placeholder img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        h1 {
          color: #0079c1;
          font-size: 24px;
          margin: 0;
        }
        main {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
      `}</style>
    </div>
  );
}
