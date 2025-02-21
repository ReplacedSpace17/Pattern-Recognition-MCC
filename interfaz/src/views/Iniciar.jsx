import React, { useState, useEffect } from 'react';
import { Layout, Steps, Form, Input, Select, Row, Col, Button, message, Space, List, Tooltip, Upload, Checkbox } from 'antd';
import { UploadOutlined, InboxOutlined, ExperimentOutlined } from '@ant-design/icons';
import { useNavigate} from 'react-router-dom';

import ReactDOM from 'react-dom/client';
import DistributionGraphic from './Components/DistributionGraphic';
import * as ss from "simple-statistics";

import NormalityTest from '../utils/stadistics/PruebaNormalidad';
import BACKEND from '../config/backends_url';
const { Header, Content, Footer } = Layout;
const { Step } = Steps;
const { Dragger } = Upload;

function Inicio() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [columns, setColumns] = useState([]);
  const [csvData, setCsvData] = useState([]);
  const [fileName, setFileName] = useState("");
  //------------------------------------------------------------- mostrrar cosas
  //mostrar tabla de correlacion
  const [showCorrelationTable, setShowCorrelationTable] = useState(false);
  //----------------------------------------------------------- Variables principales
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

//-------------------------------------------------
//modelos de clasificacion disponibles
const models_clasificacion = [
  {
    "name": "Distancia mínima",
    "value": 1
  }];

  
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
   root.render(<DistributionGraphic data={data} stats={stats} columna={columna}/>); // Renderizar el componente
   
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
    console.log('resultados back: ', data);
    alert('Resultados de la prueba de correlación: ' + JSON.stringify(data.correlation_matrix));
    setResultsCorrelation(data.correlation_matrix);
    
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
      const rows = text.split("\n");

      // Obtener los headers (nombres de las columnas)
      const headers = rows[0].split(",");

      // Procesar las filas para crear el JSON
      const jsonData = rows.slice(1).map((row) => {
        const values = row.split(",");
        const rowData = {};
        
        headers.forEach((header, index) => {
          const value = values[index] ? values[index].trim() : null; // Trim para eliminar espacios
          if (value !== null) {  // Eliminar los campos con valor null
            rowData[header.trim()] = value;
          }
        });
      
        return rowData;
      });
      

      // Actualizar el estado con los datos procesados
      setColumns(headers);
      setCsvData(jsonData); // Aquí guardas el JSON
      setFileName(file.name);

      // Mostrar el JSON en la consola (opcional)
      console.log("Datos en JSON:", jsonData);
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
          <Button type="default" onClick={prev} style={{ marginRight: '10px'}}
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
                next();
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
          <Button type="default" onClick={prev} style={{ marginRight: '10px'}}
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
        <Form form={form} layout="vertical" style={{ width: '90%', margin: '0 auto', justifyContent: 'center', minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <ExperimentOutlined style={{ fontSize: '24px', marginRight: '8px' }} />
              Prueba de Correlación
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
                await handleCorrelationTest();
                setShowCorrelationTable(true);
              }}
            >
              Ejecutar Prueba
            </Button>
          </div>
    
          {/* Resultados de la prueba */}
          {showCorrelationTable && (
  <div style={{ marginTop: '20px', textAlign: 'center' }}>
    <h3>Resultados de la Prueba de correlación</h3>
   
  </div>
)}


    
          {/* Botón para continuar */}
          
          <div style={{ marginTop: 'auto', textAlign: 'center' }}>
          <Button type="default" onClick={prev} style={{ marginRight: '10px'}}
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
    { //--------------------------------------------------------------------------------------------------------- Analisis de componentes principales 5
      title: 'PCA',
      content: (
        <Form form={form} layout="vertical" style={{ width: '90%', margin: '0 auto', justifyContent: 'center', minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <ExperimentOutlined style={{ fontSize: '24px', marginRight: '8px' }} />
              Prueba de Correlacion
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
          <Button type="default" onClick={prev} style={{ marginRight: '10px'}}
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
    { //--------------------------------------------------------------------------------------------------------- Eleccion del modelo
      title: 'Clasificador',
      content: (
        <Form form={form} layout="vertical" style={{ width: '90%', margin: '0 auto', justifyContent: 'center', minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <ExperimentOutlined style={{ fontSize: '24px', marginRight: '8px' }} />
              Prueba de Correlacion
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
          <Button type="default" onClick={prev} style={{ marginRight: '10px'}}
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
  ];

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
      <Footer style={{ textAlign: 'center' }}>ReplacedSpace17 - Axiom</Footer>
    </Layout>
  );
}

export default Inicio;