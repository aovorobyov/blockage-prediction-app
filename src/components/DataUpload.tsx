import { useState } from 'react';

export default function DataUpload({
  onDataLoaded,
}: {
  onDataLoaded: (sequences: number[][], labels: number[]) => void;
}) {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    const text = await file.text();
    const rows = text.split('\n').slice(1); // Пропускаем заголовок
    const sequences: number[][] = [];
    const labels: number[] = [];
    for (const row of rows) {
      const [sequenceStr, label] = row.split(',', 2);
      try {
        const sequence: number[][] = eval(
          sequenceStr.replace('\n', '').replace(' ', ','),
        ); // Парсим в 2D
        if (sequence.length === 8 && sequence[0].length === 64) {
          // Преобразуем в 1D для упрощения
          sequences.push(sequence.flat());
          labels.push(Number(label));
        }
      } catch (e) {
        console.warn('Ошибка парсинга:', row);
      }
    }
    onDataLoaded(sequences, labels);
  };

  const loadSampleData = () => {
    // Встроенный датасет: 100 последовательностей 8x64
    const sequences: number[][] = Array.from({ length: 100 }, () =>
      Array.from({ length: 8 * 64 }, () => Math.random() * 100),
    );
    const labels: number[] = sequences.map(() => (Math.random() > 0.5 ? 1 : 0));
    onDataLoaded(sequences, labels);
  };

  return (
    <div className='data-upload'>
      <input type='file' accept='.csv' onChange={handleFileChange} />
      <button onClick={handleUpload}>Загрузить данные</button>
      <button onClick={loadSampleData}>Использовать встроенный датасет</button>
      <style jsx>{`
        .data-upload {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }
        input {
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
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
      `}</style>
    </div>
  );
}
