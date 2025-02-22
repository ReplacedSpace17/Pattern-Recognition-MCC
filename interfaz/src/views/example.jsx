import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Chart } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend);

const HistogramWithDensity = ({ dataCorrelation }) => {
    // Extraer las etiquetas (nombres de las columnas)
    const labels = Object.keys(dataCorrelation);

    // Crear la matriz de datos para el gráfico
    const data = {
        labels: labels,
        datasets: [
            {
                label: 'Correlación',
                data: labels.map((row) =>
                    labels.map((col) => dataCorrelation[row][col])
                ),
                backgroundColor: (context) => {
                    const value = context.dataset.data[context.dataIndex][context.datasetIndex];
                    const alpha = Math.abs(value); // Usar el valor absoluto para el color
                    return `rgba(54, 162, 235, ${alpha})`; // Azul con transparencia
                },
                borderColor: 'white',
                borderWidth: 1,
                hoverBackgroundColor: 'rgba(255, 99, 132, 0.8)', // Rojo al hacer hover
                hoverBorderColor: 'white',
            },
        ],
    };

    // Opciones del gráfico
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: true,
                text: 'Matriz de Correlación',
                font: { size: 18 },
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const rowLabel = labels[context.dataIndex];
                        const colLabel = labels[context.datasetIndex];
                        const value = context.dataset.data[context.dataIndex][context.datasetIndex];
                        return `${rowLabel} vs ${colLabel}: ${value.toFixed(2)}`;
                    },
                },
            },
        },
        scales: {
            x: {
                title: { display: true, text: 'Características' },
                ticks: { color: 'black' },
                grid: { color: 'rgba(0, 0, 0, 0.1)' },
            },
            y: {
                title: { display: true, text: 'Características' },
                ticks: { color: 'black' },
                grid: { color: 'rgba(0, 0, 0, 0.1)' },
            },
        },
    };

    return (
        <div style={{ width: '100%', height: '500px', backgroundColor: 'white', padding: '20px' }}>
            <Chart type="matrix" data={data} options={options} />
        </div>
    );
};

export default HistogramWithDensity;