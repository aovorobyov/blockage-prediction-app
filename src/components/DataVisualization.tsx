import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export default function DataVisualization({
  sequences,
  labels,
}: {
  sequences: number[][];
  labels: number[];
}) {
  // Берем первую последовательность
  const firstSequence = sequences[0] || [];
  // Разбиваем плоский массив обратно на 8 шагов по 64 значения
  const steps: number[][] = [];
  for (let i = 0; i < firstSequence.length; i += 64) {
    steps.push(firstSequence.slice(i, i + 64));
  }
  const averagedData = steps.map(
    (step: number[]) =>
      step.reduce((sum: number, val: number) => sum + val, 0) / step.length,
  );

  const chartData = {
    labels: Array.from({ length: averagedData.length }, (_, i) => i + 1),
    datasets: [
      {
        label: 'Средняя мощность сигнала',
        data: averagedData,
        borderColor: '#0079c1',
        fill: false,
      },
      {
        label: 'Блокировка',
        data: labels.slice(0, averagedData.length).map((l) => l * 100),
        borderColor: '#ff0000',
        fill: false,
      },
    ],
  };

  return (
    <div className='visualization'>
      <Line data={chartData} />
      <style jsx>{`
        .visualization {
          margin-bottom: 20px;
          padding: 20px;
          background: #f5f5f5;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
}
