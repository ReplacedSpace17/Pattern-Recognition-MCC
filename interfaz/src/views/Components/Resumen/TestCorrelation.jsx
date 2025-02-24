import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { MatrixController, MatrixElement } from 'chartjs-chart-matrix';

// Registrar el plugin de matriz
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    Title,
    Tooltip,
    Legend,
    MatrixController,
    MatrixElement
);

const CorrelationMatrix = ({ dataCorrelation }) => {
    const labels = Object.keys(dataCorrelation.sepal_length);

    const data = {
        labels: labels,
        datasets: [
            {
                label: 'Correlación',
                data: []
            },
        ],
    };

    const getColor = (value) => {
        const red = Math.max(0, Math.min(255, Math.round((1 - value) * 255)));
        const blue = Math.max(0, Math.min(255, Math.round((value + 1) * 255) / 2));
        return `rgb(${red}, 0, ${blue})`;
    };

    labels.forEach((row) => {
        labels.forEach((col) => {
            data.datasets[0].data.push({
                x: col,
                y: row,
                v: dataCorrelation[row][col],
                backgroundColor: getColor(dataCorrelation[row][col]),
            });
        });
    });

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
