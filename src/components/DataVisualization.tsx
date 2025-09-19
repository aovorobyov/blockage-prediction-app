import { Line } from 'react-chartjs-2';
import { ChartJSOrUndefined } from 'react-chartjs-2/dist/types';
import { useEffect, useRef, useState } from 'react';

export default function DataVisualization({
  sequences,
  labels,
  prediction,
}: {
  sequences: number[][];
  labels: number[];
  prediction?: number;
}) {
  const chartRef = useRef<ChartJSOrUndefined<'line', number[], unknown>>(null);
  const [signalData, setSignalData] = useState<number[]>([]);

  // Обновлённая последовательность с явным падением сигнала после 500 мс
  const exampleSequence = [
    3.7715431972173974e-5, 4.5179218432167545e-5, 5.6100983783835545e-5,
    4.8401903768535703e-5, 4.227838508086279e-5, 4.3864198232768103e-5,
    4.304870162741281e-5, 4.495616667554714e-5, 6.099116581026465e-5,
    5.801683073514141e-5, 5.378300920710899e-5, 4.820273898076266e-5,
    5.550347123062238e-5, 6.545220094267279e-5, 9.284488623961806e-5,
    8.28526754048653e-5, 6.434615352191031e-5, 4.774044282385148e-5,
    4.894235098618083e-5, 5.5348253226839006e-5, 5.2167277317494154e-5,
    7.037421164568514e-5, 6.733721966156736e-5, 7.053877197904512e-5,
    7.056869071675465e-5, 6.771124026272446e-5, 4.49946201115381e-5,
    4.340042141848244e-5, 0.00011568957415875047, 9.800626139622182e-5,
    0.00019889988470822573, 0.0002456365036778152, 0.0002520694979466498,
    0.0001991991011891514, 0.00014742081111762673, 0.00010598020890029147,
    0.00013524293899536133, 0.00010221016418654472, 6.227716221474111e-5,
    4.821731272386387e-5, 6.326423317659646e-5, 4.984839688404463e-5,
    5.064130527898669e-5, 3.9195310819195583e-5, 4.0187500417232513e-5,
    4.105816697119735e-5, 6.61572121316567e-5, 6.087428846512921e-5,
    7.748045027256012e-5, 5.0117687351303175e-5, 4.015399099444039e-5,
    3.6249301047064364e-5, 3.829542038147338e-5, 4.608115341397934e-5,
    4.5047949242871255e-5, 4.337891732575372e-5, 3.805952292168513e-5,
    3.8642985600745305e-5, 4.1276030970038846e-5, 3.901699528796598e-5,
    4.694605740951374e-5, 4.513169915298931e-5, 3.6957120755687356e-5,
    3.301143442513421e-5, 1e-10, 1e-10, 1e-10, 1e-10, 1e-10, 1e-10, 1e-10,
    1e-10, 1e-10, 1e-10,
  ];

  useEffect(() => {
    const minVal = Math.min(...exampleSequence);
    const maxVal = Math.max(...exampleSequence);
    const normalizedData = exampleSequence.map(
      (val) => (val - minVal) / (maxVal - minVal),
    );
    const signalDb = normalizedData.map(
      (power) => 10 * Math.log10(power + 1e-10) + 100,
    );
    setSignalData(signalDb);
  }, []);

  const chartData = {
    labels: Array.from({ length: signalData.length }, (_, i) => i * 10),
    datasets: [
      {
        label: '',
        data: signalData,
        borderColor: '#0079c1',
        fill: false,
      },
    ],
  };

  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, []);

  return (
    <div className='visualization'>
      <h3>Визуализация сигнала</h3>
      <Line
        key={JSON.stringify(signalData)}
        ref={chartRef}
        data={chartData}
        options={{
          scales: {
            x: { title: { display: true, text: 'Время (мс)' }, type: 'linear' },
            y: {
              type: 'linear',
              title: { display: true, text: '' },
              grid: { drawOnChartArea: true },
              min: 0,
            },
          },
          plugins: {
            legend: {
              display: true,
              position: 'top',
            },
          },
        }}
      />
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
