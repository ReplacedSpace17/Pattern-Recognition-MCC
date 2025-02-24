import React, { useEffect, useState, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Scatter } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend);

const generateDistinctColors = (numColors) => {
    const colors = [];
    for (let i = 0; i < numColors; i++) {
        const hue = (i * 360 / numColors) % 360;
        colors.push(`hsl(${hue}, 70%, 50%)`);
    }
    return colors;
};

const ResumePlot = ({ data, columnasSeleccionadas, etiquetaData }) => {
    const [xKey, setXKey] = useState(columnasSeleccionadas[0]);
    const [yKey, setYKey] = useState(columnasSeleccionadas[1] || columnasSeleccionadas[0]);
    const [chartData, setChartData] = useState(null);
    const [classColors, setClassColors] = useState({});
    const chartRef = useRef(null);

    const generarGrafica = () => {
        if (!data || !xKey || !yKey || !etiquetaData) return;

        const classGroups = {};
        const uniqueClasses = new Set();

        data.forEach(item => {
            const classLabel = item[etiquetaData]?.toString().trim().toLowerCase();
            if (!classLabel) return;

            uniqueClasses.add(classLabel);

            if (!classGroups[classLabel]) {
                classGroups[classLabel] = [];
            }

            if (item[xKey] !== undefined && item[yKey] !== undefined) {
                classGroups[classLabel].push({ x: item[xKey], y: item[yKey] });
            }
        });

        const colorPalette = generateDistinctColors(uniqueClasses.size);
        const newClassColors = {};
        Array.from(uniqueClasses).forEach((classLabel, index) => {
            newClassColors[classLabel] = colorPalette[index];
        });

        setClassColors(newClassColors);

        const datasets = Object.keys(classGroups).map(classLabel => ({
            label: classLabel,
            data: classGroups[classLabel],
            backgroundColor: newClassColors[classLabel],
            borderColor: newClassColors[classLabel],
            pointRadius: 5,
            pointHoverRadius: 7
        }));

        setChartData({ datasets });
    };

    const descargarGrafico = () => {
        //generar un nombre de archivo unique aleatorio
        const randomString = Math.random().toString(36).substring(7);
        if (chartRef.current) {
            const link = document.createElement('a');
            link.href = chartRef.current.toBase64Image();
            link.download = 'grafico_dispersion.png';
            link.click();
        }
    };

    useEffect(() => {
        generarGrafica();
    }, [data]);

    return (
        <div className="resume-plot">
            <div className="plot-container">
                <h3>Scatter Plot</h3>
                <div className="controls">
                    <label>
                        Eje X:
                        <select value={xKey} onChange={e => setXKey(e.target.value)}>
                            {columnasSeleccionadas.map(col => (
                                <option key={col} value={col}>{col}</option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Eje Y:
                        <select value={yKey} onChange={e => setYKey(e.target.value)}>
                            {columnasSeleccionadas.map(col => (
                                <option key={col} value={col}>{col}</option>
                            ))}
                        </select>
                    </label>
                    <button onClick={generarGrafica}>Generar Gráfica</button>
                    <button onClick={descargarGrafico} disabled={!chartData}>Descargar</button>

                </div>
                {chartData ? (
                    <Scatter
                        ref={chartRef}
                        data={chartData}
                        options={{
                            responsive: true,
                            scales: {
                                x: { title: { display: true, text: xKey } },
                                y: { title: { display: true, text: yKey } }
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
            <style>{`
                .resume-plot {
                    width: 100%;
                    height: 100%;
                    background-color: white;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    font-family: Arial, sans-serif;
                }
                .plot-container {
                    width: 80%;
                    background-color: white;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }
                h3 {
                    text-align: center;
                    margin-bottom: 15px;
                }
                .controls {
                    display: flex;
                    gap: 15px;
                    margin-bottom: 20px;
                    justify-content: center;
                    align-items: center;
                }
                select, button {
                    padding: 8px 12px;
                    border-radius: 5px;
                    border: 1px solid #d9d9d9;
                    font-size: 14px;
                    cursor: pointer;
                }
                select {
                    background-color: #fff;
                }
                button {
                    background-color: #1890ff;
                    color: white;
                    border: none;
                    transition: background-color 0.3s;
                }
                button:hover {
                    background-color: #40a9ff;
                }
            `}</style>
        </div>
    );
};

export default ResumePlot;
