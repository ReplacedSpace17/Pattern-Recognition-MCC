import React from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import "chartjs-chart-matrix";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const getColor = (value) => {
    const intensity = Math.abs(value) * 255;
    if (value > 0) return `rgba(0, 128, 0, ${intensity / 255})`; // Verde para valores positivos
    if (value < 0) return `rgba(255, 0, 0, ${intensity / 255})`; // Rojo para valores negativos
    return "rgba(200, 200, 200, 0.3)"; // Gris para valores cercanos a 0
};

const CorrelationMatrix = ({ dataCorrelation }) => {
    const labels = Object.keys(dataCorrelation);
    
    const datasets = labels.map((row, rowIndex) => ({
        label: row,
        data: labels.map((col, colIndex) => 1), // Valor uniforme para todos
        flags: labels.map((col) => dataCorrelation[row][col]),
        backgroundColor: function (ctx) {
            let flag = ctx.dataset.flags[ctx.dataIndex];
            return getColor(flag);
        },
    }));

    const data = {
        labels,
        datasets,
    };

    const options = {
        responsive: true,
        scales: {
            y: {
                type: "category",
                labels,
                stacked: true,
                grid: { display: false },
            },
            x: {
                type: "category",
                labels,
                position: "top",
                stacked: true,
                grid: { display: false },
            },
        },
        plugins: {
            tooltip: {
                callbacks: {
                    title: (context) => {
                        const { x, y } = context[0].raw;
                        return `${x} vs ${y}`;
                    },
                    label: (context) => {
                        const value = context.dataset.flags[context.dataIndex];
                        return `Correlación: ${value.toFixed(2)}`;
                    },
                },
            },
        },
    };

    return (
        <div className="correlation-matrix-container">
            <h3>Matriz de Correlación</h3>
            <div className="chart-wrapper">
                <canvas id="correlationChart"></canvas>
            </div>
            <style>{`
                .correlation-matrix-container {
                    width: 100%;
                    max-width: 800px;
                    margin: auto;
                    background-color: white;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                    font-family: Arial, sans-serif;
                    text-align: center;
                }
                .chart-wrapper {
                    width: 100%;
                    height: 500px;
                }
            `}</style>
        </div>
    );
};

export default CorrelationMatrix;
