import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { MatrixController, MatrixElement } from 'chartjs-chart-matrix';
import ChartDataLabels from 'chartjs-plugin-datalabels'; // Importar el plugin de datalabels

// Registrar el plugin de matriz y el plugin de datalabels
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    Title,
    Tooltip,
    Legend,
    MatrixController,
    MatrixElement,
    ChartDataLabels // Registrar el plugin de datalabels
);

const CorrelationMatrix = ({ dataCorrelation }) => {
    // Extraer las etiquetas (nombres de las columnas)
    const labels = Object.keys(dataCorrelation.sepal_length); // Acceder a las claves dentro de 'sepal_length'

    // Crear la matriz de datos para el gráfico
    const data = {
        labels: labels,
        datasets: [
            {
                label: 'Correlación',
                data: [] // Inicializar el arreglo de datos vacío
            },
        ],
    };

    // Función para asignar color según el valor de correlación
    const getColor = (value) => {
        const red = Math.max(0, Math.min(255, Math.round((1 - value) * 255)));
        const blue = Math.max(0, Math.min(255, Math.round((value + 1) * 255) / 2));
        return `rgb(${red}, 0, ${blue})`; // Color entre rojo y azul
    };

    // Llenar el arreglo de datos con los valores de correlación
    labels.forEach((row) => {
        labels.forEach((col) => {
            data.datasets[0].data.push({
                x: col,
                y: row,
                v: dataCorrelation[row][col], // Valor de correlación
                backgroundColor: getColor(dataCorrelation[row][col]), // Asignar color según el valor
            });
        });
    });

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
                    title: (context) => {
                        const { x, y } = context[0].raw;
                        return `${x} vs ${y}`;
                    },
                    label: (context) => {
                        const value = context.raw.v;
                        return `Correlación: ${value.toFixed(2)}`;
                    },
                },
            },
            // Configuración de los datalabels
            datalabels: {
                color: 'black', // Color del texto
                font: {
                    weight: 'bold',
                    size: 14,
                },
                align: 'center',
                anchor: 'center',
                formatter: (value) => value.v.toFixed(2), // Mostrar el valor de la correlación con 2 decimales
            },
        },
        scales: {
            x: {
                type: 'category',
                labels: labels,
                title: { display: true, text: 'Características' },
                ticks: { color: 'black' },
                grid: { color: 'rgba(189, 68, 68, 0.1)' },
            },
            y: {
                type: 'category',
                labels: labels,
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

export default CorrelationMatrix;
