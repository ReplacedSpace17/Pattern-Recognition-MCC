import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { Layout, Form, Select, Button, message, Checkbox, Card, Slider, Row, Col, Collapse, Tabs, Menu, Space, InputNumber, Spin} from 'antd';
import { ExperimentOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import BACKEND from '../../../config/backends_url';
import { Rnd } from 'react-rnd';

const { Header, Content, Sider } = Layout;
const { Panel } = Collapse;
const { TabPane } = Tabs;
const { SubMenu } = Menu;

function Knn() {
  //---------------------------------------- bajar los parametros del navigate
  const navigate = useNavigate();
  const location = useLocation();
  const [loading_knn, setLoading_knn] = useState(false);
  const [loading_LMNN, setLoading_lmnn] = useState(false);

  const { selectedNewFeatures_PCA, selectedModel, data_bd, etiquetas } = location.state || {};
  //numero de k recomendado
  console.log("Data: ", data_bd.length);
  const k_recomendado = Math.round(Math.sqrt(data_bd.length));
  const labelK = "Valor de K (" + k_recomendado + ")";
  console.log("K recomendado: ", k_recomendado);
  console.log("selectedNewFeatures_PCA", selectedNewFeatures_PCA);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [classificationType, setClassificationType] = useState("biclase");
  const [caracteristicas, setSelectedFeatures] = useState([]);
  const [distanceType, setDistanceType] = useState("");

  const [resultsKnn, setResultsKnn] = useState([]);
  const [resultsKnnOS, setResultsKnnOS] = useState([]);
  const [stateResultsKNN, setStateResultsKNN] = useState(false);
  const [stateResultsLMNN, setStateResultsLMNN] = useState(false);

  const handleFeatureSelect = (selectedItems) => {
    setSelectedFeatures(selectedItems);
  };


  const handleClassChange = (checkedValues) => {
    setSelectedClasses(checkedValues);
  };

  const [collapsed, setCollapsed] = useState(false); // Estado para controlar si el menú está colapsado
  const [showCard_Knn, setShowCard_knn] = useState(false); // Estado para controlar la visibilidad del Card
  const [showCard_Knn_OS, setShowCard_knn_OS] = useState(false); // Estado para controlar la visibilidad del Card
  //--------------------------------------para mostrar los resultados-------------------------------------




  // Función para manejar el colapso/expansión del menú
  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  //-------------------------------------------------------------------------------- metodo para clasificar

  const classificarKNN = async () => {
    setLoading_knn(true);
    const data = {
        selectedFeatures: caracteristicas,  // Características seleccionadas
        distancia_type: parseInt(distanceType), // Tipo de distancia (1 euclidiana, 2 manhattan)
        etiquetas: etiquetas,  // Columna donde se encuentran las etiquetas
        knn_type: 1,
        data: data_bd // Datos a clasificar (antes era "datos", ahora "data")
    };

    console.log("Datos a clasificar ", data);

    // Petición POST al backend a /clasificador/knn/standard
    console.log(BACKEND + '/clasificador/knn/standard');
    const response = await fetch(BACKEND + '/clasificador/knn/standard', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    setLoading_knn(false);

    if (response.ok) {
      const jsonResponse = await response.json();
      
      // Convertir el string JSON dentro de "resultado" a un objeto
      const resultadoJSON = JSON.parse(jsonResponse.resultado);
  
      console.log("Respuesta del servidor: ", resultadoJSON);
      const image_k = BACKEND + resultadoJSON.image_k;
      const image_fonrteras = BACKEND + resultadoJSON.image_fonrteras;
      const image_matriz1 = BACKEND + resultadoJSON.pruebas[0].image_matriz;
      const image_matriz2 = BACKEND + resultadoJSON.pruebas[1].image_matriz;
      const image_matriz3 = BACKEND + resultadoJSON.pruebas[2].image_matriz;

      // Obtener el reporte
      const reporte = resultadoJSON.pruebas.find(p => p.nombre === "REPORTE").reporte;
  
      Swal.fire({
        title: 'Clasificación exitosa',
        icon: 'success',
        width: 800,
        html: `
          <div style="width: 700px;">
            <div style="margin-bottom: 20px;">
              <p><strong>Valor de K:</strong> ${resultadoJSON.k}</p>
              <p><strong>Métrica:</strong> ${resultadoJSON.metrica}</p>
              <p><strong>Número de muestras:</strong> ${resultadoJSON.n}</p>
            </div>
      
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
              <div style="flex-basis: 48%;">
                <p><strong>Imagen K:</strong></p>
                <img src="${image_k}" alt="Imagen K" style="width: 100%; height: auto;" />
              </div>
              <div style="flex-basis: 48%;">
                <p><strong>Imagen Fronteras:</strong></p>
                <img src="${image_fonrteras}" alt="Imagen Fronteras" style="width: 100%; height: auto;" />
              </div>
            </div>
      
            <div style="margin-bottom: 20px;">
              <p><strong>Pruebas:</strong></p>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Nombre</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Precisión</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Memoria (MB)</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Tiempo (s)</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Matriz de Confusión</th>
                  </tr>
                </thead>
                <tbody>
                  ${resultadoJSON.pruebas.filter(p => p.nombre !== "REPORTE").map(prueba => `
                    <tr>
                      <td style="border: 1px solid #ddd; padding: 8px;">${prueba.nombre}</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">${prueba.precision}</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">${prueba.memory}</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">${prueba.time}</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">
                        <img src="${BACKEND + prueba.image_matriz}" alt="Matriz de Confusión" style="width: 100%; max-width: 150px; height: auto;" />
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div style="margin-bottom: 20px;">
              <p><strong>Reporte de Clasificación:</strong></p>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Clase</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Precisión</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Recall</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">F1-Score</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Support</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.entries(reporte).map(([clase, metricas]) => {
                    if (clase === "accuracy" || clase === "macro avg" || clase === "weighted avg") return '';
                    return `
                      <tr>
                        <td style="border: 1px solid #ddd; padding: 8px;">${clase}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${metricas.precision}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${metricas.recall}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${metricas['f1-score']}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${metricas.support}</td>
                      </tr>
                    `;
                  }).join('')}
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;"><strong>Accuracy</strong></td>
                    <td style="border: 1px solid #ddd; padding: 8px;" colspan="4">${reporte.accuracy}</td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;"><strong>Macro Avg</strong></td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${reporte['macro avg'].precision}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${reporte['macro avg'].recall}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${reporte['macro avg']['f1-score']}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${reporte['macro avg'].support}</td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;"><strong>Weighted Avg</strong></td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${reporte['weighted avg'].precision}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${reporte['weighted avg'].recall}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${reporte['weighted avg']['f1-score']}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${reporte['weighted avg'].support}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `,
        confirmButtonText: 'Aceptar',
      });
  
  } else {
      Swal.fire({
          title: 'Error en la clasificación',
          icon: 'error',
          confirmButtonText: 'Cerrar',
      });
  }
};


const ClassificarLMNN = async () => {
  setLoading_lmnn(true);
  const data = {
      selectedFeatures: caracteristicas,  // Características seleccionadas
      distancia_type: 1, // Tipo de distancia (1 euclidiana, 2 manhattan)
      etiquetas: etiquetas,  // Columna donde se encuentran las etiquetas
      knn_type: 2,
      data: data_bd // Datos a clasificar (antes era "datos", ahora "data")
  };

  console.log("Datos a clasificar ", data);

  // Petición POST al backend a /clasificador/knn/standard
  console.log(BACKEND + '/clasificador/knn/standard');
  const response = await fetch(BACKEND + '/clasificador/knn/standard', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
  });
  setLoading_lmnn(false);
  

  if (response.ok) {
    
    const jsonResponse = await response.json();
      
    // Convertir el string JSON dentro de "resultado" a un objeto
    const resultadoJSON = JSON.parse(jsonResponse.resultado);

    console.log("RESULTADOS LMNN: ", resultadoJSON);
   //setResultsKnn(resultadoJSON);
    //setStateResultsKNN(true);
    const image_k = BACKEND + resultadoJSON.image_k;
    const image_fonrteras = BACKEND + resultadoJSON.image_fonrteras;
    const image_matriz1 = BACKEND + resultadoJSON.pruebas[0].image_matriz;
    const image_matriz2 = BACKEND + resultadoJSON.pruebas[1].image_matriz;
    const image_matriz3 = BACKEND + resultadoJSON.pruebas[2].image_matriz;

    // Obtener el reporte
    const reporte = resultadoJSON.pruebas.find(p => p.nombre === "REPORTE").reporte;

    Swal.fire({
      title: 'Clasificación exitosa',
      icon: 'success',
      width: 800,
      html: `
        <div style="width: 700px;">
          <div style="margin-bottom: 20px;">
            <p><strong>Valor de K:</strong> ${resultadoJSON.k}</p>
            <p><strong>Métrica:</strong> ${resultadoJSON.metrica}</p>
            <p><strong>Número de muestras:</strong> ${resultadoJSON.n}</p>
          </div>
    
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <div style="flex-basis: 48%;">
              <p><strong>Imagen K:</strong></p>
              <img src="${image_k}" alt="Imagen K" style="width: 100%; height: auto;" />
            </div>
            <div style="flex-basis: 48%;">
              <p><strong>Imagen Fronteras:</strong></p>
              <img src="${image_fonrteras}" alt="Imagen Fronteras" style="width: 100%; height: auto;" />
            </div>
          </div>
    
          <div style="margin-bottom: 20px;">
            <p><strong>Pruebas:</strong></p>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Nombre</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Precisión</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Memoria (MB)</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Tiempo (s)</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Matriz de Confusión</th>
                </tr>
              </thead>
              <tbody>
                ${resultadoJSON.pruebas.filter(p => p.nombre !== "REPORTE").map(prueba => `
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">${prueba.nombre}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${prueba.precision}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${prueba.memory}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${prueba.time}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">
                      <img src="${BACKEND + prueba.image_matriz}" alt="Matriz de Confusión" style="width: 100%; max-width: 150px; height: auto;" />
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div style="margin-bottom: 20px;">
            <p><strong>Reporte de Clasificación:</strong></p>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Clase</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Precisión</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Recall</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">F1-Score</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Support</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(reporte).map(([clase, metricas]) => {
                  if (clase === "accuracy" || clase === "macro avg" || clase === "weighted avg") return '';
                  return `
                    <tr>
                      <td style="border: 1px solid #ddd; padding: 8px;">${clase}</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">${metricas.precision}</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">${metricas.recall}</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">${metricas['f1-score']}</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">${metricas.support}</td>
                    </tr>
                  `;
                }).join('')}
                <tr>
                  <td style="border: 1px solid #ddd; padding: 8px;"><strong>Accuracy</strong></td>
                  <td style="border: 1px solid #ddd; padding: 8px;" colspan="4">${reporte.accuracy}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #ddd; padding: 8px;"><strong>Macro Avg</strong></td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${reporte['macro avg'].precision}</td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${reporte['macro avg'].recall}</td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${reporte['macro avg']['f1-score']}</td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${reporte['macro avg'].support}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #ddd; padding: 8px;"><strong>Weighted Avg</strong></td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${reporte['weighted avg'].precision}</td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${reporte['weighted avg'].recall}</td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${reporte['weighted avg']['f1-score']}</td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${reporte['weighted avg'].support}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `,
      confirmButtonText: 'Aceptar',
    });

} else {
    Swal.fire({
        title: 'Error en la clasificación',
        icon: 'error',
        confirmButtonText: 'Cerrar',
    });
}

};


  //-------------------------------------------------------------------------------- ------------------------ RETURN

  return (
    <Layout style={{ width: '100vw', height: '100vh', margin: '-10px', padding: '0px', background: 'radial-gradient(circle, #c6c6c6 10%, transparent 10%), radial-gradient(circle, #c6c6c6 10%, transparent 10%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 10px 10px' }}>
      {/* Menú lateral (Sider) */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={toggleCollapsed}
        width={200}
        style={{
          background: '#fff',
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          zIndex: 1,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
          {collapsed ? (
            <MenuUnfoldOutlined onClick={toggleCollapsed} style={{ cursor: 'pointer', fontSize: '18px' }} />
          ) : (
            <MenuFoldOutlined onClick={toggleCollapsed} style={{ cursor: 'pointer', fontSize: '18px' }} />
          )}
        </div>
        <Menu
          mode="inline"
          defaultSelectedKeys={['1']}
          defaultOpenKeys={['sub1']}
          style={{ borderRight: 0 }}
        >
          <SubMenu key="sub1" icon={<ExperimentOutlined />} title="Tipo de KNN">
            <Menu.Item key="1" onClick={() => {
              setShowCard_knn(!showCard_Knn);
            }}>
              {showCard_Knn ? 'KNN (Ocultar)' : 'KNN (Mostrar)'}
            </Menu.Item>
            <Menu.Item key="2" onClick={() => {
              setShowCard_knn_OS(!showCard_Knn_OS);
            }}>
              {showCard_Knn_OS ? 'LMNN (Ocultar)' : 'LMNN (Mostrar)'}
            </Menu.Item>

          </SubMenu>
        </Menu>
      </Sider>

      {/* Contenido principal */}
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'margin-left 0.2s' }}>

        <Content style={{ padding: '24px', backgroundColor: 'transparent' }}>
          {showCard_Knn && (
            <Rnd default={{ x: 0, y: 0, width: 400, height: 'auto' }} style={{ cursor: 'hand' }}>
              <Spin spinning={loading_knn}>
                
              <Card
                style={{ width: '100%', borderRadius: '15px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', padding: '0px', backgroundColor: '#fff', textAlign: 'center' }}
              >
                <h2 style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '0px' }}>
                  <ExperimentOutlined style={{ fontSize: '24px', marginRight: '8px' }} />
                  K-NN
                </h2>
                <div style={{ borderTop: '1px solid #f0f0f0', marginBottom: '20px' }}></div>

                {/* Select para seleccionar características en forma de etiquetas */}
                <Select
                  mode="multiple"
                  style={{ width: '100%', marginTop: '10px' }}
                  placeholder="Seleccione características"
                  value={caracteristicas}
                  onChange={handleFeatureSelect}
                >
                  {selectedNewFeatures_PCA.length > 0 ? (
                    selectedNewFeatures_PCA.map((feature, index) => (
                      <Option key={index} value={feature}>
                        {feature}
                      </Option>
                    ))
                  ) : (
                    <Option disabled>No hay características disponibles</Option>
                  )}
                </Select>




                <Form.Item
                  label="Tipo de distancia"
                  name="distanceType"
                  style={{ marginTop: '20px' }}
                  rules={[{ required: true, message: 'Debe seleccionar un tipo de distancia!' }]}
                >
                  <Select
                    placeholder="Seleccione tipo de distancia"
                    value={distanceType}
                    onChange={setDistanceType}
                    style={{ width: '100%' }}
                  >
                    <Option value="1">Euclidiana</Option>
                    <Option value="2">Manhattan</Option>
                  </Select>
                </Form.Item>
              


                <Form.Item>
                  <Button type="primary" block onClick={classificarKNN
                  }>
                    Clasificar!
                  </Button>
                  {stateResultsKNN && (
                    <Button type="default" block  style={{ marginTop: '10px' }}>
                      Resultados
                    </Button>
                  )}
                 
                  <Button type="default" block onClick={() => navigate(-1)} style={{ marginTop: '10px' }}>
                    Volver
                  </Button>
                </Form.Item>

              </Card>
              </Spin>
            </Rnd>
          )}
        </Content>

        <Content style={{ padding: '24px', backgroundColor: 'transparent' }}>
          {showCard_Knn_OS && ( // Renderizar el Card solo si showCard es true
            <Rnd
              default={{
                x: 0,
                y: 0,
                width: 400,
                height: 'auto',
              }}
              style={{ cursor: 'hand' }}
            >
               <Spin spinning={loading_LMNN}>
              <Card
                style={{
                  width: '100%',
                  borderRadius: '15px',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                  padding: '20px',
                  backgroundColor: '#fff',
                  textAlign: 'center',
                }}
              >
                <h2 style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '0px' }}>
                  <ExperimentOutlined style={{ fontSize: '24px', marginRight: '8px' }} />
                  K-NN LMNN
                </h2>
                <div style={{ borderTop: '1px solid #f0f0f0', marginBottom: '20px' }}></div>

{/* Select para seleccionar características en forma de etiquetas */}
<Select
  mode="multiple"
  style={{ width: '100%', marginTop: '10px' }}
  placeholder="Seleccione características"
  value={caracteristicas}
  onChange={handleFeatureSelect}
>
  {selectedNewFeatures_PCA.length > 0 ? (
    selectedNewFeatures_PCA.map((feature, index) => (
      <Option key={index} value={feature}>
        {feature}
      </Option>
    ))
  ) : (
    <Option disabled>No hay características disponibles</Option>
  )}
</Select>
<Form.Item>
                  <Button type="primary" block style={{marginTop:'20px'}} onClick={ClassificarLMNN
                  }>
                    Clasificar!
                  </Button>
                  {stateResultsLMNN && (
                    <Button type="default" block  style={{ marginTop: '10px' }}>
                      Resultados
                    </Button>
                  )}
                 
                  <Button type="default" block onClick={() => navigate(-1)} style={{ marginTop: '10px' }}>
                    Volver
                  </Button>
                </Form.Item>

              </Card>
              </Spin>
            </Rnd>
          )}
        </Content>

      </Layout>
    </Layout>
  );
}

export default Knn;