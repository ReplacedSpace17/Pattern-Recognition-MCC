import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Chart } from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, annotationPlugin);

const NormalidadPlot = ({ data, stats, columnasSeleccionadas }) => {
  const [chartData, setChartData] = useState(null);
  const [columnaSeleccionada, setColumnaSeleccionada] = useState(columnasSeleccionadas[0]);

  useEffect(() => {
    const columnData = data.map(item => item[columnaSeleccionada]).filter(val => !isNaN(val));

    const { media, desviacion_estandar } = stats[columnaSeleccionada];
    const minimo = Math.min(...columnData);
    const maximo = Math.max(...columnData);

    const numBins = 15;
    const binSize = (maximo - minimo) / numBins;
    const bins = new Array(numBins).fill(0);
    const binEdges = Array.from({ length: numBins + 1 }, (_, i) => minimo + i * binSize);

    columnData.forEach(value => {
      const binIndex = Math.min(Math.floor((value - minimo) / binSize), numBins - 1);
      bins[binIndex]++;
    });

    const densityX = binEdges.slice(0, -1).map((edge, i) => edge + binSize / 2);
    const densityY = densityX.map(x => {
      const exponent = -((x - media) ** 2) / (2 * desviacion_estandar ** 2);
      return (Math.exp(exponent) / (desviacion_estandar * Math.sqrt(2 * Math.PI))) * columnData.length * binSize;
    });

    setChartData({
      labels: densityX.map(x => x.toFixed(1)),
      datasets: [
        {
          type: 'bar',
          label: 'Frecuencia',
          data: bins,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
        {
          type: 'line',
          label: 'Curva de Densidad',
          data: densityY,
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 2,
          fill: false,
          tension: 0.3,
        },
      ],
    });
  }, [data, stats, columnaSeleccionada]);

  return (
    <div style={{ width: '100%', height: '70%', backgroundColor: 'white', textAlign: 'center', margin: 'auto' }}>
      <h3>{columnaSeleccionada}</h3>
      <div style={{ marginBottom: '20px' }}>
        <select onChange={(e) => setColumnaSeleccionada(e.target.value)} value={columnaSeleccionada}>
          {columnasSeleccionadas.map((col, index) => (
            <option key={index} value={col}>
              {col}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <h4>Estadísticas</h4>
        <p>Prueba: {stats[columnaSeleccionada].prueba}</p>
        <p>Estadístico: {stats[columnaSeleccionada].statistic}</p>
        <p>p-value: {stats[columnaSeleccionada].p_value}</p>
        <p>¿Es normal?: {stats[columnaSeleccionada].es_normal ? 'Sí' : 'No'}</p>
        <p>Media: {stats[columnaSeleccionada].media}</p>
        <p>Mediana: {stats[columnaSeleccionada].mediana}</p>
        <p>Varianza: {stats[columnaSeleccionada].varianza}</p>
        <p>Desviación Estándar: {stats[columnaSeleccionada].desviacion_estandar}</p>
      </div>

      {chartData ? (
        <Chart
          type="bar"
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: { display: true, text: 'Histograma con Curva de Densidad' },
              annotation: {
                annotations: {
                  meanLine: {
                    type: 'line',
                    yMin: 0,
                    yMax: Math.max(...chartData.datasets[0].data),
                    xMin: chartData.labels[Math.floor(chartData.labels.length / 2)],
                    xMax: chartData.labels[Math.floor(chartData.labels.length / 2)],
                    borderColor: 'red',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    label: {
                      content: `Media: ${(chartData.labels[Math.floor(chartData.labels.length / 2)])}`,
                      enabled: true,
                      position: 'end',
                      backgroundColor: 'rgba(255, 99, 132, 0.8)',
                    },
                  },
                },
              },
            },
            scales: {
              x: { title: { display: true, text: 'Valor' } },
              y: { title: { display: true, text: 'Frecuencia' }, beginAtZero: true },
            },
          }}
        />
      ) : (
        <p>Cargando datos...</p>
      )}
    </div>
  );
};

export default NormalidadPlot;
