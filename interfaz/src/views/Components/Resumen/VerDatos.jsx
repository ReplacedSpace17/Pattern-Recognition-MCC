import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Scatter } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend);

// Generar colores distintos usando HSL bien espaciado
const generateDistinctColors = (numColors) => {
    const colors = [];
    for (let i = 0; i < numColors; i++) {
        const hue = (i * 360 / numColors) % 360; // Espaciado uniforme en el círculo de color
        colors.push(`hsl(${hue}, 70%, 50%)`);
    }
    return colors;
};

const ResumePlot = ({ data, columnasSeleccionadas, etiquetaData }) => {
    const [xKey, setXKey] = useState(columnasSeleccionadas[0]); // Primer columna por defecto
    const [yKey, setYKey] = useState(columnasSeleccionadas[1] || columnasSeleccionadas[0]); // Segunda o la misma
    const [chartData, setChartData] = useState(null);
    const [classColors, setClassColors] = useState({});

    const generarGrafica = () => {
        if (!data || !xKey || !yKey || !etiquetaData) return;

        const classGroups = {};
        const uniqueClasses = new Set();

        // Agrupar los datos por clase y detectar nombres únicos
        data.forEach(item => {
            const classLabel = item[etiquetaData]?.toString().trim().toLowerCase();
            if (!classLabel) return;

            uniqueClasses.add(classLabel);

            if (!classGroups[classLabel]) {
                classGroups[classLabel] = [];
            }

            if (item[xKey] !== undefined && item[yKey] !== undefined) {
                classGroups[classLabel].push({
                    x: item[xKey],
                    y: item[yKey]
                });
            }
        });

        // Generar una paleta de colores bien diferenciada
        const colorPalette = generateDistinctColors(uniqueClasses.size);
        const newClassColors = {};
        Array.from(uniqueClasses).forEach((classLabel, index) => {
            newClassColors[classLabel] = colorPalette[index];
        });

        setClassColors(newClassColors);

        // Crear datasets para el gráfico
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

    useEffect(() => {
        generarGrafica(); // Generar gráfica inicial con los valores por defecto
    }, [data]);

    return (
        <div className="resume-plot" style={{ width: '100%', height: '100%', backgroundColor: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        
        <div style={{ width: '80%', height: 'auto', backgroundColor: 'white', padding: '20px', borderRadius: '10px' }}>
            <h3>Scatter Plot</h3>

            {/* Controles para seleccionar columnas */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
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
            </div>

            {/* Mostrar gráfica */}
            {chartData ? (
                <Scatter
                    data={chartData}
                    options={{
                        responsive: true,
                        scales: {
                            x: {
                                title: { display: true, text: xKey }
                            },
                            y: {
                                title: { display: true, text: yKey }
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

export default ResumePlot;
