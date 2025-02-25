import React, { useState, useEffect } from 'react';
import {
  Layout, Steps, Form, Input, Select, Row, Col,Radio,  Button, message, Space, List, Tooltip, Upload, Checkbox, Table,
  InputNumber, Switch, Modal
} from 'antd';
import { UploadOutlined, InboxOutlined, ExperimentOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

import ReactDOM from 'react-dom/client';
import DistributionGraphic from './Components/DistributionGraphic';
import * as ss from "simple-statistics";

import NormalityTest from '../utils/stadistics/PruebaNormalidad';
import BACKEND from '../config/backends_url';
const { Header, Content, Footer } = Layout;
const { Step } = Steps;
const { Dragger } = Upload;
//importar el swal2
import Swal from 'sweetalert2';

//-------------------------------------------------- IMPORTS DE LOS GRAFICOS
import ResumePlot from './Components/Resumen/VerDatos';
import CorrelationMatrix from './Components/Resumen/TestCorrelation';
import NormalidadPlot from './Components/Resumen/TestNormalidad';
import VarianzaExplicada from './Components/VarianzaExplicada';
import PCATest from './Components/Resumen/TestPCA';

function Inicio() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [columns, setColumns] = useState([]);
  const [csvData, setCsvData] = useState([]);
  const [fileName, setFileName] = useState("");
  const [etiquetasCSV, setEtiquetasCSV] = useState([]);
  //------------------------------------------------------------- mostrrar cosas
  //mostrar tabla de correlacion
  const [showCorrelationTable, setShowCorrelationTable] = useState(false);
  //---------------------------------------------------- pantalla de analisis de componentes principales
  const [showPCA_table, setShowPCATable] = useState(false);
  const [pca_selected_components, setPCASelectedComponents] = useState(0); //numero de componentenes
  const [selectedWhiten, setSelectedWhiten] = useState(false); //whiten
  const [selectedSVD_solver, setSelectedSVD_solver] = useState(''); //svd_solver
  const [selectedRandom_state, setSelectedRandom_state] = useState(0); //random_state
  //----------------------------------------------------------- Variables principales
  const [etiqueta, setEtiqueta] = useState(''); //etiqueta de la columna
  //objeto json de datos
  const [base_datos, setDataBase] = useState([]); // Datos del CSV
  // Columnas seleccionadas inicialmente del CSV
  const [selectedColumns, setSelectedColumns] = useState([]); // Columnas seleccionadas
  // resultados de prueba de normalidad
  const [results_normality, setResultsNormality] = useState({});
  // rresultados de la rueba de correlacion
  const [results_correlation, setResultsCorrelation] = useState({});
  // resultado del analisis de componentes principales
  const [results_pca, setResultsPCA] = useState({});
  //Nuevas caracteristicas seleccionadas
  const [selectedNewFeatures_PCA, setSelectedFeatures] = useState([]);
  //modelo de clasificacion seleccionado
  const [selectedModel, setSelectedModel] = useState(0);
  //

/////////////////////////////////////////////////////////////////---------------------------------------- GRAFICAS DE RESUMEN
  //abrir la grafica de distribucion
  const showVerDatosPlot = (data, columnasSeleccionadas, etiquetaData) => {
    // Crear una nueva ventana
    const newWindow = window.open('', '', 'width=300px,height=600');
    // Crear un contenedor en la nueva ventana
    const container = newWindow.document.createElement('div');
    newWindow.document.body.appendChild(container);
    // Usar ReactDOM.createRoot para renderizar el componente en el nuevo contenedor
    const root = ReactDOM.createRoot(container); // Crear la raíz
    // root.render(<DistributionGraphic data={data} stats={stats} />); // Renderizar el componente
    root.render(<ResumePlot data={data} columnasSeleccionadas={columnasSeleccionadas} etiquetaData={etiquetaData}/>); // Renderizar el componente
  };
  //correlacion plot
  const showCorrelationPlot = (dataCorrelation) => {
    // Crear una nueva ventana
    const newWindow = window.open('', '', 'width=300px,height=600');
    // Crear un contenedor en la nueva ventana
    const container = newWindow.document.createElement('div');
    newWindow.document.body.appendChild(container);
    // Usar ReactDOM.createRoot para renderizar el componente en el nuevo contenedor
    const root = ReactDOM.createRoot(container); // Crear la raíz
    // root.render(<DistributionGraphic data={data} stats={stats} />); // Renderizar el componente
    root.render(<CorrelationMatrix dataCorrelation={dataCorrelation} />); // Renderizar el componente
  };
  //normalidad plot
  const showNormalityPlot = (data, stats, columnas) => {
    // Crear una nueva ventana
    const newWindow = window.open('', '', 'width=300px,height=600');
    // Crear un contenedor en la nueva ventana
    const container = newWindow.document.createElement('div');
    newWindow.document.body.appendChild(container);
    // Usar ReactDOM.createRoot para renderizar el componente en el nuevo contenedor
    const root = ReactDOM.createRoot(container); // Crear la raíz
    // root.render(<DistributionGraphic data={data} stats={stats} />); // Renderizar el componente
    root.render(<NormalidadPlot data={data} stats={stats} columnasSeleccionadas={columnas} />); // Renderizar el componente
  };
    //varianza explicada
    const showVarianzaExplicada = (varianzaData) => {
      // Crear una nueva ventana
      const newWindow = window.open('', '', 'width=300px,height=600');
      // Crear un contenedor en la nueva ventana
      const container = newWindow.document.createElement('div');
      newWindow.document.body.appendChild(container);
      // Usar ReactDOM.createRoot para renderizar el componente en el nuevo contenedor
      const root = ReactDOM.createRoot(container); // Crear la raíz
      // root.render(<DistributionGraphic data={data} stats={stats} />); // Renderizar el componente
      root.render(<VarianzaExplicada varianzaData={varianzaData} />); // Renderizar el componente
    };

    const showPCA_test = (data) => {
      // Crear una nueva ventana
      const newWindow = window.open('', '', 'width=300px,height=600');
      // Crear un contenedor en la nueva ventana
      const container = newWindow.document.createElement('div');
      newWindow.document.body.appendChild(container);
      // Usar ReactDOM.createRoot para renderizar el componente en el nuevo contenedor
      const root = ReactDOM.createRoot(container); // Crear la raíz
      // root.render(<DistributionGraphic data={data} stats={stats} />); // Renderizar el componente
      root.render(<PCATest data={data} />); // Renderizar el componente
    };
/////////////////////////////////////////////////////////////////
  //-------------------------------------------------
  //modelos de clasificacion disponibles
  const models_clasificacion = [
    {
      "name": "Distancia mínima",
      "value": 1
    },
  ];


  //json de datos
  const [datos, setDatos] = useState([]);
  const next = () => {
    if (currentStep === 0) {
      // Validación para la carga de CSV
      if (!fileName) {
        message.error('Por favor, carga un archivo CSV antes de continuar.');
        return;
      }
    } else if (currentStep === 1) {
      // Validación para la selección de características
      const selectedColumns = form.getFieldsValue();
      const isAtLeastOneSelected = Object.values(selectedColumns).some((value) => value);
      if (!isAtLeastOneSelected) {
        message.error('Por favor, selecciona al menos una característica antes de continuar.');
        return;
      }
    }

    form
      .validateFields()
      .then(() => {
        setCurrentStep(currentStep + 1);
      })
      .catch((errorInfo) => {
        console.error('Validation failed:', errorInfo);
      });
  };

  useEffect(() => {
    console.log(results_normality);  // Imprime los resultados cuando el estado cambia
  }, [results_normality]);


  const prev = () => setCurrentStep(currentStep - 1);

  //
  //########################################################################################################## FUNCIOPNES
  //--------------------------------------------------- functions para prueba de normalidad
  const [showResults, setShowResults] = useState(false);

  // Función para la prueba de normalidad
  const handleNormalityTest = async () => {

    const cleanedData = datos
      .map(item => {
        const cleanedItem = {};
        for (const key in item) {
          // Si el valor es null o undefined, lo omitimos
          if (item[key] !== null && item[key] !== undefined) {
            // Si el valor es un número en formato string, lo convertimos a float (double)
            cleanedItem[key] = !isNaN(item[key]) ? parseFloat(item[key]) : item[key];
          }
        }
        // Retornamos el objeto solo si tiene al menos una propiedad
        return Object.keys(cleanedItem).length > 0 ? cleanedItem : null;
      })
      .filter(item => item !== null); // Eliminar objetos vacíos (null)
    //setear los datos limpios
    setDatos(cleanedData);
    setDataBase(cleanedData);

    //json a enviar
    const jsonData = {
      columnas: selectedColumns,
      data: cleanedData
    };
    console.log('Json a enviar', jsonData);
    //cantiidad de registros en datos
    console.log('Cantidad de registros:', cleanedData.length);

    //post a backend
    const response = await fetch(`${BACKEND}/normality/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jsonData),
    });
    //obtener el status code
    const statusCode = response.status;
    if (statusCode !== 200) {
      message.error('Error al ejecutar la prueba de normalidad.');
      return;
    }
    if (statusCode === 200) {
      //obtener la data del response
      const data = await response.json();
      console.log('resultados back ');
      console.log(data.resultados);
      setResultsNormality(data.resultados);
    }
    // Actualiza el estado con el objeto
    // setResultsNormality(results);
  };
  //formato de p_value
  function formatPValue(p_value) {
    return p_value.toString().substring(0, p_value.toString().indexOf('.') + 10); // Recorta a 3 decimales
  }

  //abrir la grafica de distribucion
  const handleClickDistribution = (data, stats, columna) => {
    //imrimir el tamaño delos datos
    console.log('Tamaño de los datos:', data.length);
    console.log('Estadisticas tama:', stats);
    console.log('Columna:', columna);

    // Crear una nueva ventana
    const newWindow = window.open('', '', 'width=600,height=600');

    // Crear un contenedor en la nueva ventana
    const container = newWindow.document.createElement('div');
    newWindow.document.body.appendChild(container);

    // Usar ReactDOM.createRoot para renderizar el componente en el nuevo contenedor
    const root = ReactDOM.createRoot(container); // Crear la raíz
    // root.render(<DistributionGraphic data={data} stats={stats} />); // Renderizar el componente
    root.render(<DistributionGraphic data={data} stats={stats} columna={columna} />); // Renderizar el componente

  };

  // prueba de correlacion
  const handleCorrelationTest = async () => {
    const json = {
      columnas: selectedColumns,
      data: base_datos
    }
    console.log('Json a enviar:', json);
    //post a backend
    const response = await fetch(`${BACKEND}/correlation/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(json),
    });
    //obtener el status code
    const statusCode = response.status;
    if (statusCode !== 200) {
      message.error('Error al ejecutar la prueba de correlación.');
      return;
    }
    if (statusCode === 200) {
      //obtener la data del response
      const data = await response.json();
      console.log('resultados correlacion: ', data);
      //alert('Resultados de la prueba de correlación: ' + JSON.stringify(data.correlation_matrix));
      setResultsCorrelation(data.correlation_matrix);

    }
  };

  //prueba de componentes principales PCA
  const handleVarianzaExplicada = async (data, columnasSeleccionadas) => {
    console.log('Datos:', data);
    console.log('Columnas:', columnasSeleccionadas);
    const json_send = {
      columnas: columnasSeleccionadas,
      data: data
    }
    //enviar a /variance/normalizada
    const response = await fetch(`${BACKEND}/variance/normalizada`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(json_send),
    });
    //obtener el status code
    const statusCode = response.status;
    if (statusCode !== 200) {
      message.error('Error al ejecutar el análisis de componentes principales.');
      return;
    }
    if (statusCode === 200) {
      //impiiir los resultados del response
      const responsedata = await response.json();
      console.log('resultados back: ', responsedata);
      await showVarianzaExplicada(responsedata);
    }
  };

  const handlePCATest = async () => {
    const data = {
      columnas: selectedColumns,
      data: base_datos,
      n_components: pca_selected_components,
      whiten: selectedWhiten,
      svd_solver: selectedSVD_solver,
      random_state: selectedRandom_state,
    };
    
    console.log('Json a enviar:', data);
  
    // Mostrar Swal de "Calculando..."
    Swal.fire({
      title: 'Calculando...',
      text: 'Por favor, espera mientras se ejecuta el análisis.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  
    try {
      const response = await fetch(`${BACKEND}/pca/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
  
      const statusCode = response.status;
      
      if (statusCode !== 200) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al ejecutar el análisis de componentes principales.',
        });
        return;
      }
  
      const resultData = await response.json();
      console.log('Resultados PCA: ', resultData);
  
      setResultsPCA(resultData);
  
      // Reemplazar el Swal de carga con los resultados
      Swal.fire({
        title: 'Resultados del análisis de componentes principales',
        html: `
          <p>Varianza explicada:</p>
          <p>${resultData.variance_ratio}</p>
          <p>Componentes principales:</p>
          <p>${resultData.n_components}</p>
          <p>Whiten:</p>
          <p>${resultData.whiten}</p>
          <p>SVD Solver:</p>
          <p>${resultData.svd_solver}</p>
          <p>Random State:</p>
          <p>${resultData.random_state}</p>
        `,
        confirmButtonText: 'Cerrar'
      });
  
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un error inesperado.',
      });
    }
  };
  
  // ##########################################################################################################################  VISTAS
  const steps = [
    { //-------------------------------------------------------------------------------------------------------- Carga de CSV 1
      title: 'Carga de CSV',
      content: (
        <Form form={form} layout="vertical" style={{ width: '90%', margin: '0 auto', justifyContent: 'center', minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <UploadOutlined style={{ fontSize: '24px', marginRight: '8px' }} />
              Cargar Archivo CSV
            </h2>
            <div style={{ borderTop: '1px solid #b9b9b9', marginTop: '10px', width: '100%', marginBottom: '0px' }}></div>
            <p style={{ marginBottom: '0', color: '#272727' }}>
              Arrastra y suelta un archivo CSV para visualizar sus columnas y configurarlas.
            </p>
          </div>

          <Dragger
  accept=".csv"
  showUploadList={false}
  beforeUpload={(file) => {
    if (file.type !== 'text/csv') {
      message.error('Solo se permiten archivos CSV.');
      return false;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      const rows = text.split("\n").map(row => row.trim()).filter(row => row !== ""); // Eliminar líneas vacías

      // Obtener los headers (nombres de las columnas)
      const headers = rows[0].split(",").map(header => header.trim());

      // Procesar las filas para crear el JSON
      let jsonData = rows.slice(1).map(row => {
        const values = row.split(",").map(value => value.trim());
        const rowData = {};

        headers.forEach((header, index) => {
          rowData[header] = values[index] !== "" ? values[index] : null; // Convertir valores vacíos a null
        });

        return rowData;
      });

      // Detectar columnas numéricas y categóricas
      const numericColumns = headers.filter(header =>
        jsonData.every(row => row[header] === null || (!isNaN(parseFloat(row[header])) && isFinite(row[header])))
      );

      const categoricalColumns = headers.filter(header => !numericColumns.includes(header));

      // Filtrar registros eliminando NaN SOLO en columnas numéricas
      jsonData = jsonData.filter(row =>
        numericColumns.every(col => row[col] !== null && row[col] !== "")
      );

      // Convertir valores numéricos a tipo número
      jsonData = jsonData.map(row => {
        numericColumns.forEach(col => {
          if (row[col] !== null) {
            row[col] = parseFloat(row[col]); // Convertir string a número
          }
        });
        return row;
      });

      // Actualizar estados
      setColumns(numericColumns); // Solo columnas numéricas
      setEtiquetasCSV(categoricalColumns); // Solo columnas categóricas
      setCsvData(jsonData);
      setFileName(file.name);

      console.log("Datos en JSON sin NaN en numéricas:", jsonData);
      console.log("Columnas numéricas:", numericColumns);
      console.log("Columnas categóricas:", categoricalColumns);

      await setDatos(jsonData);
    };

    reader.readAsText(file);
    return false;
  }}
  style={{ padding: '20px', border: '2px dashed #1890ff', borderRadius: '8px', marginBottom: '20px' }}
>
  <p className="ant-upload-drag-icon">
    <InboxOutlined />
  </p>
  <p className="ant-upload-text">Haz clic o arrastra un archivo CSV aquí para cargarlo</p>
</Dragger>




          {fileName && (
            <div style={{ marginTop: '10px', textAlign: 'center' }}>
              <p style={{ fontWeight: 'bold' }}>Archivo cargado: {fileName}</p>
              <Button type="default" danger onClick={() => { setColumns([]); setCsvData([]); setFileName(""); }}>
                Eliminar Archivo
              </Button>
            </div>
          )}

          <div style={{ marginTop: 'auto', textAlign: 'center' }}>
            <Button type="primary" onClick={next}>
              Continuar
            </Button>
           
          </div>
        </Form>
      ),
    },
    { //--------------------------------------------------------------------------------------------------------Seleccion manual de caracteristicas
      title: 'Caracteristicas',
      content: (
        <Form form={form} layout="vertical" style={{ width: '90%', margin: '0 auto', justifyContent: 'center', minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <UploadOutlined style={{ fontSize: '24px', marginRight: '8px' }} />
              Selecciona las caracteristicas
            </h2>
            <div style={{ borderTop: '1px solid #b9b9b9', marginTop: '10px', width: '100%', marginBottom: '0px' }}></div>
            <p style={{ marginBottom: '0', color: '#272727' }}>
              Del archivo seleccionado, selecciona las caracteristicas que deseas utilizar para el analisis.
            </p>
          </div>

          <div style={{ overflowY: 'auto', maxHeight: '300px', marginBottom: '20px' }}>
            {columns.map((col, index) => (
              <Form.Item key={index} name={`col_${index}`} valuePropName="checked">
                <Checkbox>{col}</Checkbox>
              </Form.Item>
            ))}
          </div>

          <div style={{ marginTop: 'auto', textAlign: 'center' }}>
            <Button type="default" onClick={prev} style={{ marginRight: '10px' }}
            >
              Anterior
            </Button>
            <Button type="primary" onClick={
              () => {
                // ingresar a selectedColumns las columnas seleccionadas, y agregar las que correspondan con los headers
                const selectedColumns = form.getFieldsValue();
                const selectedColumnsKeys = Object.keys(selectedColumns);
                const selectedColumnsValues = Object.values(selectedColumns);
                const selectedColumnsIndexes = selectedColumnsValues.map((value, index) => value ? index : null).filter((index) => index !== null);
                const selectedColumnsNames = selectedColumnsIndexes.map((index) => columns[index]);
                setSelectedColumns(selectedColumnsNames);
                console.log(selectedColumnsNames);
                next();
              }
            }>
              Continuar
            </Button>
          </div>
        </Form>
      ),
    },
    {
      title: 'Etiqueta',
      content: (
        <Form
          form={form}
          layout="vertical"
          style={{
            width: '90%',
            margin: '0 auto',
            justifyContent: 'center',
            minHeight: '500px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <UploadOutlined style={{ fontSize: '24px', marginRight: '8px' }} />
              Selecciona la Etiqueta
            </h2>
            <div
              style={{
                borderTop: '1px solid #b9b9b9',
                marginTop: '10px',
                width: '100%',
                marginBottom: '0px',
              }}
            ></div>
            <p style={{ marginBottom: '0', color: '#272727' }}>
              Del archivo seleccionado, elige la columna que contiene las etiquetas de clase.
            </p>
          </div>
    
          {/* Opciones de selección */}
          <div style={{ overflowY: 'auto', maxHeight: '300px', marginBottom: '20px' }}>
            <Form.Item name="selectedEtiqueta">
              <Radio.Group
                onChange={(e) => {
                  form.setFieldsValue({ selectedEtiqueta: e.target.value });
                  setEtiqueta(e.target.value);
                  console.log('Etiqueta seleccionada:', e.target.value);
                }}
                value={form.getFieldValue("selectedEtiqueta")}
              >
                {etiquetasCSV.map((col, index) => (
                  <Radio key={index} value={col} style={{ display: 'block', marginBottom: '8px' }}>
                    {col}
                  </Radio>
                ))}
              </Radio.Group>
            </Form.Item>
          </div>
    
          {/* Botones de navegación */}
          <div style={{ marginTop: 'auto', textAlign: 'center' }}>
            <Button type="default" onClick={prev} style={{ marginRight: '10px' }}>
              Anterior
            </Button>
            <Button type="primary" onClick={next} disabled={!form.getFieldValue("selectedEtiqueta")}>
              Continuar
            </Button>
          </div>
        </Form>
      ),
    },
    
    { //-------------------------------------------------------------------------------------------------------- Prueba de Normalidad 3
      title: 'Normalidad',
      content: (
        <Form form={form} layout="vertical" style={{ width: '90%', margin: '0 auto', justifyContent: 'center', minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <ExperimentOutlined style={{ fontSize: '24px', marginRight: '8px' }} />
              Pruebas de normalidad
            </h2>
            <div style={{ borderTop: '1px solid #b9b9b9', marginTop: '10px', width: '100%', marginBottom: '0px' }}></div>
            <p style={{ marginBottom: '0', color: '#272727' }}>
              Por favor inicie la prueba.
            </p>
          </div>

          {/* Botón para ejecutar la prueba */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <Button
              type="primary"
              onClick={async () => {
                //imprimir los datos
                console.log(selectedColumns);
                console.log(datos);
                await handleNormalityTest();
                console.log(results_normality);
                setShowResults(true);

                //mostrar el data
                //console.log(datos);
                //mostrtando resultados
                //setShowResults(true);
              }}
            >
              Ejecutar Prueba
            </Button>
          </div>

          {/* Resultados de la prueba */}
          {showResults && (
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <h3>Resultados de la Prueba de Normalidad</h3>
              <div style={{ border: '1px solid #d9d9d9', borderRadius: '8px', padding: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                {/* Verifica que `results_normality` tenga claves antes de mapearlas */}
                {Object.keys(results_normality).length > 0 ? (
                  Object.keys(results_normality).map((col, index) => {
                    const result = results_normality[col];
                    return (
                      <div key={index} style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>{col}:</strong> {result.es_normal ? ` p_valor=${formatPValue(result.p_value)} ✅` : ` p_valor=${formatPValue(result.p_value)} ❌`}

                        </div>
                        <Button
                          type="link"
                          onClick={() => {
                            // Acción para el botón "Ver"
                            //imprimir las data
                            console.log('Resultados del ver:', results_normality[col]);
                            //imprimir el nombre de la columna
                            console.log('Nombre de la columna:', col);
                            console.log('Datos:', datos);
                            handleClickDistribution(datos, results_normality[col], col);
                          }}
                        >
                          Ver
                        </Button>
                      </div>
                    );
                  })
                ) : (
                  <div>No hay resultados disponibles.</div> // En caso de que `results_normality` esté vacío
                )}
              </div>
            </div>
          )}



          {/* Botón para continuar */}

          <div style={{ marginTop: 'auto', textAlign: 'center' }}>
            <Button type="default" onClick={prev} style={{ marginRight: '10px' }}
            >
              Anterior
            </Button>
            <Button type="primary" onClick={next}>
              Continuar
            </Button>
          </div>
        </Form>
      ),
    },
    { //--------------------------------------------------------------------------------------------------------- Correlacion 4
      title: 'Correlación',
      content: (
        <Form
          form={form}
          layout="vertical"
          style={{
            width: '90%',
            margin: '0 auto',
            justifyContent: 'center',
            minHeight: '500px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <h2
              style={{
                marginBottom: '10px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <ExperimentOutlined style={{ fontSize: '24px', marginRight: '8px' }} />
              Prueba de Correlación
            </h2>
            <div
              style={{
                borderTop: '1px solid #b9b9b9',
                marginTop: '10px',
                width: '100%',
                marginBottom: '0px',
              }}
            ></div>
            <p style={{ marginBottom: '0', color: '#272727' }}>
              Por favor inicie la prueba.
            </p>
          </div>
    
          {/* Botón para ejecutar la prueba */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <Button
              type="primary"
              onClick={async () => {
                await handleCorrelationTest();
                setShowCorrelationTable(true);
              }}
            >
              Ejecutar Prueba
            </Button>
          </div>
    
          {/* Resultados de la prueba */}
          {showCorrelationTable && results_correlation && (
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <h3>Resultados de la Prueba de Correlación</h3>
              {(() => {
                const variables = Object.keys(results_correlation); // Extrae los nombres de las variables
    
                // Construcción dinámica de columnas
                const columns = [
                  { title: 'Variable', dataIndex: 'key', key: 'key' },
                  ...variables.map((varName) => ({
                    title: varName,
                    dataIndex: varName,
                    key: varName,
                  })),
                ];
    
                // Construcción dinámica de los datos
                const dataSource = variables.map((varName) => ({
                  key: varName,
                  ...results_correlation[varName],
                }));
    
                return (
                  <Table
                    dataSource={dataSource}
                    columns={columns}
                    pagination={false}
                    scroll={{ x: 'max-content' }}
                  />
                );
              })()}
            </div>
          )}
    
          {/* Botón para continuar */}
          <div style={{ marginTop: 'auto', textAlign: 'center' }}>
            <br />
            <Button type="default" onClick={prev} style={{ marginRight: '10px' }}>
              Anterior
            </Button>
            <Button type="primary" onClick={next}>
              Continuar
            </Button>
          </div>
        </Form>
      ),
    },
    
    { //--------------------------------------------------------------------------------------------------------- PCA 5
      title: 'PCA',
      content: (
        <Form form={form} layout="vertical" style={{ width: '90%', margin: '0 auto', justifyContent: 'center', minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <ExperimentOutlined style={{ fontSize: '24px', marginRight: '8px' }} />
              PCA
            </h2>
            <div style={{ borderTop: '1px solid #b9b9b9', marginTop: '10px', width: '100%', marginBottom: '0px' }}></div>
            <p style={{ marginBottom: '0', color: '#272727' }}>
              Por favor configure los parámetros y ejecute el análisis de componentes principales.
            </p>
          </div>
          <Button type="default" style={{marginBottom:'20px'}} onClick={async () => {
             
             await handleVarianzaExplicada(datos, selectedColumns);
            }}>
              Obtener varianza explicada
            </Button>
          {/* Configuración de parámetros */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
            <Form.Item label="Número de Componentes" style={{ flex: 1 }}>
              <InputNumber min={1} max={10} value={pca_selected_components} onChange={setPCASelectedComponents} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="Whiten" style={{ marginBottom: 0 }}>
              <Switch checked={selectedWhiten} onChange={setSelectedWhiten} />
            </Form.Item>
          </div>

          <Form.Item label="SVD Solver">
            <Select value={selectedSVD_solver} onChange={setSelectedSVD_solver} style={{ width: '100%' }}>
              <Select.Option value="auto">Auto</Select.Option>
              <Select.Option value="full">Full</Select.Option>
              <Select.Option value="randomized">Randomized</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Random State">
            <InputNumber min={0} max={100} value={selectedRandom_state} onChange={setSelectedRandom_state} style={{ width: '100%' }} />
          </Form.Item>

          {/* Botón para ejecutar la prueba */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <Button type="primary" onClick={async () => {
              await handlePCATest();

            }}>
              Ejecutar Análisis
            </Button>
          </div>

          {/* Botón para continuar */}
          <div style={{ marginTop: 'auto', textAlign: 'center' }}>
            <Button type="default" onClick={prev} style={{ marginRight: '10px' }}>
              Anterior
            </Button>
            <Button type="primary" onClick={next}>
              Continuar
            </Button>
          </div>
        </Form>
      ),
    },
    { //--------------------------------------------------------------------------------------------------------- Resumen de resultados 6
      title: 'Resumen',
      content: (
        <Form form={form} layout="vertical" style={{ width: '90%', margin: '0 auto', justifyContent: 'center', minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <ExperimentOutlined style={{ fontSize: '24px', marginRight: '8px' }} />
              Resumen de resultados
            </h2>
            <div style={{ borderTop: '1px solid #b9b9b9', marginTop: '10px', width: '100%', marginBottom: '0px' }}></div>
            <p style={{ marginBottom: '0', color: '#272727' }}>
              Por favor revise los resultados.
            </p>
          </div>

          {/* Configuración de parámetros */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
            <Form.Item label="Datos utilizados" style={{ flex: 1 }}>
              <Button type="default" onClick={
                () => {
                  console.log('Datos utilizados:', datos);
                  //abrir en una nueva ventana
                  showVerDatosPlot(datos, selectedColumns, etiqueta);
                }
              } style={{ width: '100%' }}>
                Ver datos
              </Button>
            </Form.Item>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
            <Form.Item label="Normalidad de caracteristicas" style={{ flex: 1 }}>
              <Button type="default" onClick={
                () => {
                  console.log('Resultados de normalidad:', results_normality); //estadistica de normalidad
                  console.log('Datos:', datos);
                  console.log('Columnas:', selectedColumns);
                  showNormalityPlot(datos, results_normality, selectedColumns);
                }
              } style={{ width: '100%' }}>
                Ver prueba de normalidad
              </Button>
            </Form.Item>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
            <Form.Item label="Correlación de caracteristicas" style={{ flex: 1 }}>
              <Button type="default" onClick={
                () => {
                console.log('Resultados de correlación:', results_correlation); //estadistica de correlacion
                showCorrelationPlot(results_correlation);
                }
              } style={{ width: '100%' }}>
                Ver prueba de correlación
              </Button>
            </Form.Item>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
            <Form.Item label="Análisis de Componente Principales" style={{ flex: 1 }}>
              <Button type="default" onClick={
                () => {
                console.log('Resultados de PCA:', results_pca); //estadistica de PCA
                showPCA_test(results_pca);
                }
              } style={{ width: '100%' }}>
                Ver Análisis de Componentes Principales
              </Button>
            </Form.Item>
          </div>



          {/* Botón para continuar */}
          <div style={{ marginTop: 'auto', textAlign: 'center' }}>
            <Button type="default" onClick={prev} style={{ marginRight: '10px' }}>
              Anterior
            </Button>
            <Button type="primary" onClick={next}>
              Continuar
            </Button>
          </div>
        </Form>
      ),
    },
    { //--------------------------------------------------------------------------------------------------------- Clasificador 7
      title: 'Clasificador',
      content: (
        <Form form={form} layout="vertical" style={{ width: '90%', margin: '0 auto', justifyContent: 'center', minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <ExperimentOutlined style={{ fontSize: '24px', marginRight: '8px' }} />
              Clasificador
            </h2>
            <div style={{ borderTop: '1px solid #b9b9b9', marginTop: '10px', width: '100%', marginBottom: '0px' }}></div>
            <p style={{ marginBottom: '0', color: '#272727' }}>
              Por favor seleccione el clasificador a utilizar.
            </p>
          </div>

          {/* Combo para seleccionar clasificador */}
          <div style={{ marginBottom: '20px' }}>
            <Select
              value={selectedModel}
              onChange={value => setSelectedModel(value)}
              style={{ width: '100%' }}
            >
              {models_clasificacion.map(model => (
                <Option key={model.value} value={model.value}>
                  {model.name}
                </Option>
              ))}
            </Select>
          </div>

        


          {/* Botón para continuar */}
          <div style={{ marginTop: 'auto', textAlign: 'center' }}>
            <Button type="default" onClick={prev} style={{ marginRight: '10px' }}>
              Anterior
            </Button>
            <Button type="primary" onClick={
              () => {
                // Validar que se hayan seleccionado características
                console.log('selectedNewFeatures_PCA:', selectedNewFeatures_PCA);
console.log('selected model:', selectedModel);
//convertir etiqueta a array
const etiqueta_send = [etiqueta];
// Si el modelo es 1, navega a /distancia_minima y pasa los valores
if (selectedModel === 1) {
  navigate('/distancia_minima', {
    state: {
      selectedNewFeatures_PCA: selectedColumns,
      selectedModel: selectedModel,
      data_bd: datos,
      etiquetas: etiqueta_send
    }
  });
}

              }
            }>
              Continuar
            </Button>
          </div>
        </Form>
      ),
    }


  ];

  const handleCheckboxChange = (e, col) => {
    const checked = e.target.checked;

    if (checked) {
      // Agregar la columna a selectedNewFeatures_PCA si se selecciona
      setSelectedFeatures(prevSelected => [...prevSelected, col]);
    } else {
      // Eliminar la columna de selectedNewFeatures_PCA si se deselecciona
      setSelectedFeatures(prevSelected => prevSelected.filter(item => item !== col));
    }
  };

  return (
    <Layout style={{ width: '100vw', height: '100vh', margin: '-10px', padding: '0px' }}>
      <Header style={{ color: 'white', textAlign: 'center', fontSize: '20px' }}>
        Reconocimiento de patrones
      </Header>
      <Content style={{ padding: '20px', marginTop: '20px' }}>
        <Content style={{ width: '100%', marginBottom: '20px', backgroundColor: 'none', display: 'flex', flexDirection: 'row', justifyContent: 'center', alignContent: 'center', alignItems: 'center' }}>
          <Steps current={currentStep} style={{ backgroundColor: 'none', width: '80%' }}>
            {steps.map((step, index) => (
              <Step key={index} title={step.title} />
            ))}
          </Steps>
        </Content>
        <div style={{ padding: '20px', borderRadius: '8px', width: '100%', display: 'flex', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', width: '50%', maxWidth: '450px', minWidth: '350px', border: '1px solid #d4d4d4' }}>
            {steps[currentStep].content}
          </div>
        </div>
      </Content>
      <Footer style={{ textAlign: 'center' }}>ReplacedSpace17 - RP_MCC</Footer>
    </Layout>
  );
}

export default Inicio;