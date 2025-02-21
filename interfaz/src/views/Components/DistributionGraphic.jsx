import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Chart } from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, annotationPlugin);

const DistributionGraphic = ({ data, stats, columna }) => {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    // Extraer los valores de la columna deseada (por ejemplo, sepal_width)
    const columnData = data.map(item => item[columna]).filter(val => !isNaN(val));

    // Obtener los valores estadísticos
    const { media, desviacion_estandar } = stats;

    const minimo = Math.min(...columnData);
    const maximo = Math.max(...columnData);

    // Establecer un número fijo de bins (15 bins)
    const numBins = 15;
    const binSize = (maximo - minimo) / numBins;
    const bins = new Array(numBins).fill(0);
    const binEdges = Array.from({ length: numBins + 1 }, (_, i) => minimo + i * binSize);

    columnData.forEach(value => {
      const binIndex = Math.min(Math.floor((value - minimo) / binSize), numBins - 1);
      bins[binIndex]++;
    });

    // Crear la curva de densidad normal basada en la media y desviación estándar
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
  }, [data, stats, columna]);

  return (
    <div style={{ width: '100%', height: '70%', backgroundColor: 'white', textAlign: 'center', margin: 'auto' }}>
      <h3>{columna}</h3>
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

export default DistributionGraphic;
