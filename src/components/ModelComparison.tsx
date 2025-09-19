interface Metrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
}

interface ModelComparisonProps {
  metrics: { [key: string]: Metrics };
}

export default function ModelComparison({ metrics }: ModelComparisonProps) {
  return (
    <div className='model-comparison'>
      <h3>Сравнение моделей</h3>
      <table>
        <thead>
          <tr>
            <th>Модель</th>
            <th>Accuracy (%)</th>
            <th>Precision (%)</th>
            <th>Recall (%)</th>
            <th>F1 Score (%)</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(metrics).map(([modelName, metric]) => (
            <tr key={modelName}>
              <td>{modelName.toUpperCase()}</td>
              <td>{(metric.accuracy * 100).toFixed(2)}</td>
              <td>{(metric.precision * 100).toFixed(2)}</td>
              <td>{(metric.recall * 100).toFixed(2)}</td>
              <td>{(metric.f1 * 100).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <style jsx>{`
        .model-comparison {
          margin-bottom: 20px;
          padding: 20px;
          background: #f5f5f5;
          border-radius: 8px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        th,
        td {
          padding: 8px 12px;
          text-align: center;
          border: 1px solid #ddd;
        }
        th {
          background-color: #0079c1;
          color: white;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        tr:hover {
          background-color: #e6f0fa;
        }
      `}</style>
    </div>
  );
}
