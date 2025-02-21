import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Chart } from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, annotationPlugin);

const HistogramWithDensity = () => {
  const [chartData, setChartData] = useState(null);
  const [mean, setMean] = useState(0);

  useEffect(() => {
    const numSamples = 1000;
    const meanValue = 5; // Media esperada
    const stdDev = 1.5; // Desviación estándar

    // Generar datos con distribución normal usando la transformación Box-Muller
    const generateNormalData = (n, mean, stdDev) => {
      const data = [];
      for (let i = 0; i < n; i++) {
        let u1 = Math.random();
        let u2 = Math.random();
        let z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2); // Box-Muller
        data.push(mean + z * stdDev);
      }
      return data;
    };

    const dataValues = generateNormalData(numSamples, meanValue, stdDev);

    // Calcular nueva media basada en los datos generados
    const calculatedMean = dataValues.reduce((a, b) => a + b, 0) / numSamples;
    setMean(calculatedMean);

    // Crear bins para histograma
    const binSize = 0.5;
    const minVal = Math.min(...dataValues);
    const maxVal = Math.max(...dataValues);
    const numBins = Math.ceil((maxVal - minVal) / binSize);
    const bins = new Array(numBins).fill(0);
    const binEdges = Array.from({ length: numBins + 1 }, (_, i) => minVal + i * binSize);

    dataValues.forEach(value => {
      const binIndex = Math.min(Math.floor((value - minVal) / binSize), numBins - 1);
      bins[binIndex]++;
    });

    // Generar datos para la curva de densidad
    const densityX = binEdges.slice(0, -1).map((edge, i) => edge + binSize / 2);
    const densityY = densityX.map(x => {
      const exponent = -((x - meanValue) ** 2) / (2 * stdDev ** 2);
      return (Math.exp(exponent) / (stdDev * Math.sqrt(2 * Math.PI))) * numSamples * binSize;
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
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
            },
          },
          scales: {
            x: {
              ticks: {
                display: true, // Esto oculta los labels del eje X
              },
            },
            y: {
              beginAtZero: true,
            },
          },
        },
      });
      
  }, []);

  return (
    <div style={{ width: '60%', height: '500px', textAlign: 'center', margin: 'auto' }}>
      <h3>Distribución Normal Simulada</h3>
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
                    xMin: mean,
                    xMax: mean,
                    borderColor: 'red',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    label: {
                      content: `Media: ${mean.toFixed(2)}`,
                      enabled: true,
                      position: 'end',
                      backgroundColor: 'rgba(255, 99, 132, 0.8)',
                    },
                  },
                  stdDevMinus2: {
                    type: 'line',
                    yMin: 0,
                    yMax: Math.max(...chartData.datasets[0].data),
                    xMin: mean - 2 * 1.5, // 2 desviaciones estándar a la izquierda
                    xMax: mean - 2 * 1.5,
                    borderColor: 'blue',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    label: {
                      content: '-2σ',
                      enabled: true,
                      position: 'end',
                      backgroundColor: 'rgba(54, 162, 235, 0.8)',
                    },
                  },
                  stdDevPlus2: {
                    type: 'line',
                    yMin: 0,
                    yMax: Math.max(...chartData.datasets[0].data),
                    xMin: mean + 2 * 1.5, // 2 desviaciones estándar a la derecha
                    xMax: mean + 2 * 1.5,
                    borderColor: 'blue',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    label: {
                      content: '+2σ',
                      enabled: true,
                      position: 'end',
                      backgroundColor: 'rgba(54, 162, 235, 0.8)',
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

export default HistogramWithDensity;
