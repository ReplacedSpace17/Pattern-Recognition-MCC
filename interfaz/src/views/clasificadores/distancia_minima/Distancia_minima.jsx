import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Layout, Form, Select, Button, message, Checkbox, Card } from 'antd';
import { ExperimentOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import BACKEND from '../../../config/backends_url';

const { Header, Content, Footer } = Layout;

function DistanciaMinima() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [classificationType, setClassificationType] = useState("biclase");
  const [caracteristicas, setSelectedFeatures] = useState([]);
  const location = useLocation();
  const { selectedNewFeatures_PCA, selectedModel, data_bd, etiquetas } = location.state || {};

  const handleCheckboxCaracteristicasChange = (e, col) => {
    const checked = e.target.checked;
    if (checked) {
      setSelectedFeatures(prevSelected => [...prevSelected, col]);
    } else {
      setSelectedFeatures(prevSelected => prevSelected.filter(item => item !== col));
    }
  };

  useEffect(() => {
    console.log('Selected New Features PCA:', selectedNewFeatures_PCA);
    console.log('Selected Model:', selectedModel);
    console.log('Data:', data_bd);
    console.log('Etiquetas:', etiquetas);
  }, [selectedNewFeatures_PCA, selectedModel, data_bd, etiquetas]);

  const handleClassificationChange = (value) => {
    setClassificationType(value);
    setSelectedClasses([]);
  };

  const handleClassChange = (checkedValues) => {
    setSelectedClasses(checkedValues);
  };

  const renderClassSelection = () => {
    console.log('data_bd:', data_bd);
    console.log('etiquetas:', etiquetas);
    //obtener todas las clases de la columna del valor de etiqueta en el data_bd
    if (classificationType === "biclase" && data_bd && etiquetas) {
      const classes = Array.from(new Set(data_bd.map(item => item[etiquetas[0]])));
      return (
        <Form.Item label="Seleccione las clases" name="selectedClasses" rules={[{ required: true, message: 'Debe seleccionar al menos una clase!' }]}>
          <Checkbox.Group onChange={handleClassChange} value={selectedClasses}>
            {classes.map(c => (
              //console.log de el nombr
              <Checkbox key={c} value={c} disabled={selectedClasses.length >= 2 && !selectedClasses.includes(c)}>{c}</Checkbox>
            ))}
          </Checkbox.Group>
        </Form.Item>
      );
    }
    return '';
  };

  const classify = async () => {
    try {
      await form.validateFields();
      if (classificationType === "biclase" && selectedClasses.length === 0) {
        message.error('Debe seleccionar al menos una clase antes de continuar!');
        return;
      }
      if (classificationType === "biclase" && selectedClasses.length > 2) {
        message.error('No puede seleccionar más de dos clases!');
        return;
      }
  
      const classesToSend = classificationType === "multiclase" && selectedClasses.length === 0 ? ['none', 'none'] : selectedClasses;
  
      const jsonSend = {
        "type": classificationType,
        "distancia_type": form.getFieldValue('distanceType'),
        "etiquetas": etiquetas,
        "selected_class": classesToSend,
        "selected_features": caracteristicas,
        "data": data_bd,
      };
  
      const response = await fetch(BACKEND + '/clasificador/minima_distancia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonSend),
      });
  
      if (response.ok) {
        const responseData = await response.json();
        console.log('Respuesta de la API:', responseData);
  
        // Crear HTML de la tabla de confusión y métricas
        const getConfusionMatrixHtml = (confusionMatrix) => {
          let confusionMatrixHtml = `
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); font-family: 'Arial', sans-serif; text-align: center;">
              <thead style="background-color: #f7f7f7; color: #333;">
                <tr>
                  <th style="padding: 10px 15px; font-weight: bold;">Clase</th>
          `;
          // Agregar las cabeceras de las clases
          Object.keys(confusionMatrix).forEach(className => {
            confusionMatrixHtml += `<th style="padding: 10px 15px; font-weight: bold; color: #4CAF50;">${className}</th>`;
          });
          confusionMatrixHtml += '</tr></thead><tbody>';
  
          // Agregar las filas de la matriz de confusión
          Object.entries(confusionMatrix).forEach(([rowClass, rowValues]) => {
            confusionMatrixHtml += `<tr style="background-color: #f9f9f9;">`;
            confusionMatrixHtml += `<th style="padding: 10px 15px; font-weight: bold; color: #555;">${rowClass}</th>`;
            Object.values(rowValues).forEach(value => {
              confusionMatrixHtml += `<td style="padding: 10px 15px; color: #555; background-color: #fff;">${value}</td>`;
            });
            confusionMatrixHtml += '</tr>';
          });
          confusionMatrixHtml += '</tbody></table>';
          return confusionMatrixHtml;
        };
  
        // Diseño de la ventana con 4 columnas
        Swal.fire({
          title: `${classificationType === "biclase" ? "Clasificación Biclase" : "Clasificación Multiclase"} - Distancia: ${form.getFieldValue('distanceType')}`,
          html: `
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 12px;">
              ${['Sin_Prueba_Estadistica', 'K-Folds', 'Stratified K-Folds', 'Leave-One-Out'].map(method => {
                const metrics = responseData[method];
                const confusionMatrixHtml = getConfusionMatrixHtml(metrics['Matriz de Confusión']);
                return `
                  <div style="width: 22%; padding: 10px; border-radius: 8px; background-color: #f3f3f3;">
                    <h3>${method.replace(/_/g, ' ')}</h3>
                    <p><strong>Precisión:</strong> ${metrics['Precisión']}</p>
                    <p><strong>Exactitud:</strong> ${metrics['Exactitud']}</p>
                    <p><strong>Sensibilidad (Recall):</strong> ${metrics['Sensibilidad (Recall)']}</p>
                    <p><strong>Especificidad:</strong> ${metrics['Especificidad']}</p>
                    <p><strong>Matriz de Confusión:</strong></p>
                    ${confusionMatrixHtml}
                  </div>
                `;
              }).join('')}
            </div>
          `,
          showCloseButton: true,
          width: '80%',
          padding: '20px',
          showCancelButton: true,
          cancelButtonText: 'Cancelar',
          confirmButtonText: 'OK',
          cancelButtonColor: '#d33',
          confirmButtonColor: '#3085d6',
          preConfirm: () => new Promise((resolve) => resolve()),
          footer: `
            <button id="copy-json-btn" class="swal2-styled swal2-confirm swal2-default-outline" style="padding: 8px 16px; border-radius: 4px; border: none; background-color: #4CAF50; color: white; font-weight: bold; cursor: pointer;">
              Copiar JSON
            </button>
          `
        }).then((result) => {
          if (result.isConfirmed) {
            message.success('Clasificación exitosa!');
          }
        });
        
  
      } else {
        const errorData = await response.json();
        console.error('Error de la API:', errorData);
        message.error('Error en la clasificación.');
      }
    } catch (error) {
      console.error('Error al validar el formulario:', error);
    }
  };


  return (
    <Layout style={{ width: '100vw', height: '100vh', margin: '-10px', padding: '0px' }}>
      <Header style={{ color: 'white', textAlign: 'center', fontSize: '20px' }}>
        Reconocimiento de patrones
      </Header>
      <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
        <Card
          style={{
            width: '100%',
            maxWidth: '500px',
            borderRadius: '15px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            padding: '30px',
            backgroundColor: '#fff',
            margin: '20px',
            textAlign: 'center',
          }}
        >
          <h2 style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <ExperimentOutlined style={{ fontSize: '24px', marginRight: '8px' }} />
            Mínima distancia
          </h2>
          <div style={{ borderTop: '1px solid #f0f0f0', marginBottom: '20px' }}></div>
          <p style={{ color: '#272727' }}>Por favor seleccione el clasificador a utilizar.</p>

          <Form form={form} layout="vertical">
            <div style={{ padding:'0px', overflowX: 'auto', maxHeight: '300px', marginBottom: '0px', display: 'flex', flexWrap: 'wrap' }}>
              {selectedNewFeatures_PCA.map((col, index) => (
                <Form.Item key={index} name={`col_${index}`} valuePropName="checked" style={{ marginRight: '3px' }}>
                  <Checkbox
                    checked={selectedNewFeatures_PCA.includes(col)}
                    onChange={(e) => handleCheckboxCaracteristicasChange(e, col)}
                  >
                    {col}
                  </Checkbox>
                </Form.Item>
              ))}
            </div>

            <Form.Item label="Tipo de clasificación" name="classificationType" initialValue="biclase" rules={[{ required: true, message: 'Debe seleccionar el tipo de clasificación!' }]}>
              <Select defaultValue="biclase" onChange={handleClassificationChange} options={[
                { value: 'biclase', label: 'Biclase' },
                { value: 'multiclase', label: 'Multiclase' },
              ]} style={{ width: '100%' }} />
            </Form.Item>

            {renderClassSelection()}

            <Form.Item label="Tipo de distancia" name="distanceType" initialValue="euclidiana" rules={[{ required: true, message: 'Debe seleccionar el tipo de distancia!' }]}>
              <Select defaultValue="euclidiana" options={[
                { value: 'euclidiana', label: 'Euclidiana' },
                { value: 'minkowski', label: 'Minkowski' },
                { value: 'manhattan', label: 'Manhattan' },
              ]} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item>
              <Button type="primary" block onClick={classify}>
                Clasificar!
              </Button>
              <Button type="default" block onClick={() => navigate(-1)} style={{ marginTop: '10px' }}>
                Volver
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Content>
      <Footer style={{ textAlign: 'center' }}>ReplacedSpace17</Footer>
    </Layout>
  );
}

export default DistanciaMinima;
