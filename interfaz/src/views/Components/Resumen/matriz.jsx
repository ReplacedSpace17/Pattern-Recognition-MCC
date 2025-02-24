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
    const labels = Object.keys(dataCorrelation);

    // 🎨 Función para asignar colores a los puntos
    const getColor = (value) => {
        if (Math.abs(value) > 0.8) return `rgb(0, 128, 0, 0.9)`; // Verde oscuro para valores altos
        if (Math.abs(value) > 0.5) return `rgb(0, 200, 0, 0.7)`; // Verde medio
        if (Math.abs(value) > 0.2) return `rgb(144, 238, 144, 0.5)`; // Verde claro
        return `rgb(200, 200, 200, 0.3)`; // Gris para valores bajos
    };

    const data = {
        labels: labels,
        datasets: [
            {
                label: 'Correlación',
                data: labels.flatMap((row) =>
                    labels.map((col) => ({
                        x: col,
                        y: row,
                        v: dataCorrelation[row][col],
                        backgroundColor: getColor(dataCorrelation[row][col]), // 🎨 Color dinámico
                        borderColor: 'black',
                        borderWidth: 1,
                    }))
                ),
            },
        ],
    };

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
