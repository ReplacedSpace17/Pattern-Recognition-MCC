import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, LineElement, Title, Tooltip, Legend);

// Generar colores distintos usando HSL bien espaciado
const generateDistinctColors = (numColors) => {
    const colors = [];
    for (let i = 0; i < numColors; i++) {
        const hue = (i * 360 / numColors) % 360; // Espaciado uniforme en el círculo de color
        colors.push(`hsl(${hue}, 70%, 50%)`);
    }
    return colors;
};

const VarianzaExplicada = ({ varianzaData }) => {
    const [chartData, setChartData] = useState(null);

    const generarGrafica = () => {
        if (!varianzaData) return;

        const componentes = varianzaData.varianza_acumulada.map(item => item.componentes);
        const varianzaAcumulada = varianzaData.varianza_acumulada.map(item => item.varianza_acumulada);

        const colorPalette = generateDistinctColors(1); // Un color para la línea de varianza acumulada

        // Crear los puntos para la línea roja (al 95%)
        const puntos95 = [
            { x: 1, y: 0.95 }, // Punto en el primer componente, 95%
            { x: componentes[componentes.length - 1], y: 0.95 } // Punto en el último componente, 95%
        ];

        const newChartData = {
            labels: componentes,
            datasets: [
                {
                    label: 'Varianza Acumulada',
                    data: varianzaAcumulada,
                    borderColor: '#000',
                    backgroundColor: '#000',
                    fill: false,
                    tension: 0.1,
                    borderWidth: 2,
                    pointRadius: 5
                },
                {
                    label: 'Varianza al 95%',
                    data: puntos95,
                    borderColor: 'red',
                    backgroundColor: 'red',
                    fill: false,
                    tension: 0,
                    borderWidth: 2,
                    pointRadius: 5,
                    pointBackgroundColor: 'red',
                    pointBorderColor: 'red',
                    borderDash: [5, 5], // Línea punteada
                }
            ]
        };

        setChartData(newChartData);
    };

    useEffect(() => {
        generarGrafica(); // Generar gráfica inicial con los valores por defecto
    }, [varianzaData]);

    return (
        <div className="varianza-explicada" style={{ width: '100%', height: '100%', backgroundColor: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '80%', height: 'auto', backgroundColor: 'white', padding: '20px', borderRadius: '10px' }}>
                <h3>Gráfica de Varianza Acumulada</h3>

                {/* Mostrar gráfica */}
                {chartData ? (
                    <Line
                        data={chartData}
                        options={{
                            responsive: true,
                            scales: {
                                x: {
                                    title: { display: true, text: 'Componente' }
                                },
                                y: {
                                    title: { display: true, text: 'Varianza Acumulada' },
                                    ticks: {
                                        callback: function(value) {
                                            return `${(value * 100).toFixed(2)}%`; // Mostrar en porcentaje
                                        }
                                    }
                                }
                            },
                            plugins: {
                                legend: { position: 'top' },
                                tooltip: { enabled: true }
                            }
                        }}
                    />
                ) : (
                    <p>Cargando datos...</p>
                )}
            </div>
        </div>
    );
};

export default VarianzaExplicada;
