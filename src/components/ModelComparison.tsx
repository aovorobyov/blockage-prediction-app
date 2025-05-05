import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface Metrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
}

export default function ModelComparison({
  metrics,
}: {
  metrics: { [key: string]: Metrics };
}) {
  const chartData = {
    labels: Object.keys(metrics),
    datasets: [
      {
        label: 'Accuracy',
        data: Object.values(metrics).map((m) => m.accuracy),
        borderColor: '#0079c1',
      },
    ],
  };

  return (
    <div className='comparison'>
      <table>
        <thead>
          <tr>
            <th>Модель</th>
            <th>Accuracy</th>
            <th>Precision</th>
            <th>Recall</th>
            <th>F1</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(metrics).map(([model, m]) => (
            <tr key={model}>
              <td>{model.toUpperCase()}</td>
              <td>{m.accuracy.toFixed(2)}</td>
              <td>{m.precision.toFixed(2)}</td>
              <td>{m.recall.toFixed(2)}</td>
              <td>{m.f1.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className='chart'>
        <Line data={chartData} />
      </div>
      <style jsx>{`
        .comparison {
          margin-bottom: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th,
        td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: center;
        }
        th {
          background-color: #f5f5f5;
        }
        .chart {
          padding: 20px;
          background: #f5f5f5;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
}
