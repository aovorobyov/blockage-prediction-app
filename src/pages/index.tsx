import { useState } from 'react';
import DataUpload from '../components/DataUpload';
import DataVisualization from '../components/DataVisualization';
import Prediction from '../components/Prediction';
import ModelComparison from '../components/ModelComparison';

interface Metrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
}

export default function Home() {
  const [sequences, setSequences] = useState<number[][]>([]);
  const [labels, setLabels] = useState<number[]>([]);
  const [metrics] = useState<{ [key: string]: Metrics }>({
    lstm: { accuracy: 0.85, precision: 0.8, recall: 0.82, f1: 0.81 },
    cnn: { accuracy: 0.87, precision: 0.83, recall: 0.85, f1: 0.84 },
    'cnn-lstm': { accuracy: 0.9, precision: 0.88, recall: 0.89, f1: 0.88 },
  });

  const handleDataLoaded = (newSequences: number[][], newLabels: number[]) => {
    setSequences(newSequences);
    setLabels(newLabels);
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
            <DataVisualization sequences={sequences} labels={labels} />
            <Prediction sequences={sequences} />
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
