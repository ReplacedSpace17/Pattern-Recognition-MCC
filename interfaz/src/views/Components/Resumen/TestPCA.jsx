import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Button } from 'antd';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const PCATest = ({ data }) => {
    if (!data || !data.variance_ratio || !data.loadings) {
        return <p>Cargando datos...</p>;
    }

    const { variance_ratio, n_components, loadings } = data;
    
    const loadingsKeys = Object.keys(loadings);
    const componentLabels = Object.keys(loadings[loadingsKeys[0]]);
    
    const tableRows = loadingsKeys.map((feature) => (
        <tr key={feature}>
            <td>{feature}</td>
            {componentLabels.map((comp) => (
                <td key={comp}>{loadings[feature][comp].toFixed(4)}</td>
            ))}
        </tr>
    ));

    const barData = {
        labels: componentLabels,
        datasets: [
            {
                label: 'Varianza Explicada',
                data: variance_ratio,
                backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.6)'],
                borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'],
                borderWidth: 1,
            },
        ],
    };

    return (
        <div className="container">
           
        <div className="pca-container">
            <h3>Análisis de Componentes Principales (PCA)</h3>
            ̣̣̣̣̣̣̣̣̣<Button type='primary' style={{margin:'10px'}}>Descargar</Button>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Característica</th>
                            {componentLabels.map((comp) => (
                                <th key={comp}>{comp}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>{tableRows}</tbody>
                </table>
            </div>
            <div className="chart-container">
                <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            </div>
            <style>{`
                .pca-container {
                    width: 100%;
                    max-width: 800px;
                    margin: auto;
                    background-color: white;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                    font-family: Arial, sans-serif;
                }
                .table-container {
                    margin-bottom: 20px;
                    overflow-x: auto;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    text-align: left;
                }
                th, td {
                    padding: 10px;
                    border: 1px solid #ddd;
                }
                th {
                    background-color: #f4f4f4;
                }
                .chart-container {
                    width: 100%;
                    height: 300px;
                }
                h3 {
                    text-align: center;
                }
                    .container{
                    width: 100%;
                    height: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    background-color: #f4f4f4;
                    }
            `}</style>
        </div>
        </div>
    );
};

export default PCATest;
