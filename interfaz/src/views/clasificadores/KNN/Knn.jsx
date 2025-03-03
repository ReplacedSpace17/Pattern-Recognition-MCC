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
  const [stateResultsKNNOS, setStateResultsKNNOS] = useState(false);

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

  const classificar = async () => {
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
     //setResultsKnn(resultadoJSON);
      //setStateResultsKNN(true);
      
      Swal.fire({
          title: 'Clasificación exitosa',
          icon: 'success',
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
              {showCard_Knn_OS ? 'One Step (Ocultar)' : 'One Step (Mostrar)'}
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
                  <Button type="primary" block onClick={classificar
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
                  K-NN One Step
                </h2>
                <div style={{ borderTop: '1px solid #f0f0f0', marginBottom: '20px' }}></div>
                <p style={{ color: '#272727' }}>Por favor seleccione el clasificador a utilizar.</p>
              </Card>
            </Rnd>
          )}
        </Content>

      </Layout>
    </Layout>
  );
}

export default Knn;