import React, { useEffect, useState, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Chart } from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, annotationPlugin);

const NormalidadPlot = ({ data, stats, columnasSeleccionadas }) => {
  const [chartData, setChartData] = useState(null);
  const [columnaSeleccionada, setColumnaSeleccionada] = useState(columnasSeleccionadas[0]);
  const chartRef = useRef(null); // 📌 Referencia al gráfico

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
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          annotation: {
            annotations: {
              mediaLine: {
                type: 'line',
                mode: 'vertical',
                scaleID: 'x',
                value: media.toFixed(1), // 📌 Media en el eje X correctamente posicionada
                borderColor: 'red',
                borderWidth: 2,
                borderDash: [6, 6], // Línea punteada
                label: {
                  content: `Media: ${media.toFixed(2)}`,
                  enabled: true,
                  position: 'center', // 📌 Etiqueta centrada en la línea
                  backgroundColor: 'rgba(255, 99, 132, 0.8)',
                },
              },
            },
          },
        },
        scales: {
          x: {
            title: { display: true, text: 'Valor' },
            type: 'linear', // 📌 Asegura que la escala es continua
            ticks: {
              callback: (val) => val.toFixed(1), // 📌 Muestra números redondeados
            },
          },
          y: { title: { display: true, text: 'Frecuencia' }, beginAtZero: true },
        },
      },
    });
  }, [data, stats, columnaSeleccionada]);

  // 📌 Función para descargar el gráfico
  const handleDownload = () => {
    if (chartRef.current) {
      const link = document.createElement('a');
      link.href = chartRef.current.toBase64Image();
      link.download = `normalidad_${columnaSeleccionada}.png`;
      link.click();
    }
  };

  return (
    <div className="normalidad-plot">
      <h3>{columnaSeleccionada}</h3>
      <div className="controls">
        <label>Seleccionar columna:
          <select onChange={(e) => setColumnaSeleccionada(e.target.value)} value={columnaSeleccionada}>
            {columnasSeleccionadas.map((col, index) => (
              <option key={index} value={col}>{col}</option>
            ))}
          </select>
        </label>
        <button className="download-btn" onClick={handleDownload}>Descargar</button>
      </div>

      <div className="stats-container">
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

      <div className="chart-container">
        {chartData ? (
          <Chart ref={chartRef} type="bar" data={chartData} options={chartData.options} />
        ) : (
          <p>Cargando datos...</p>
        )}
      </div>

      <style>{`
        .normalidad-plot {
          width: 100%;
          max-width: 800px;
          background-color: white;
          text-align: center;
          margin: auto;
          font-family: Arial, sans-serif;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .controls {
          margin-bottom: 20px;
        }

        select {
          padding: 8px 12px;
          border-radius: 5px;
          border: 1px solid #d9d9d9;
          font-size: 14px;
          cursor: pointer;
          background-color: #fff;
        }

        .stats-container {
          text-align: left;
          margin-bottom: 20px;
          padding: 15px;
          background: #f9f9f9;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .chart-container {
          width: 100%;
          height: 400px;
          max-height: 400px;
          overflow: hidden;
        }

        .download-btn {
          background-color: #1890ff;
          color: white;
          border: none;
          padding: 10px 15px;
          font-size: 16px;
          cursor: pointer;
          border-radius: 5px;
          transition: 0.3s;
          margin-top: 15px;
          margin-left: 10px;
        }

        .download-btn:hover {
          background-color: #40a9ff;
        }
      `}</style>
    </div>
  );
};

export default NormalidadPlot;
