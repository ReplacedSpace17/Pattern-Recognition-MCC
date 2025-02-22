import React, { useState, useEffect } from 'react';
import {
  Layout, Steps, Form, Input, Select, Row, Col, Button, message, Space, List, Tooltip, Upload, Checkbox, Table,
  InputNumber, Switch, Modal
} from 'antd';
import { UploadOutlined, InboxOutlined, ExperimentOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ReactDOM from 'react-dom/client';
import * as ss from "simple-statistics";
import BACKEND from '../../../config/backends_url';
const { Header, Content, Footer } = Layout;
const { Step } = Steps;
const { Dragger } = Upload;
import Swal from 'sweetalert2';


function DistanciaMinima() {

  const navigate = useNavigate();

  return (
    <Layout style={{ width: '100vw', height: '100vh', margin: '-10px', padding: '0px' }}>
      <Header style={{ color: 'white', textAlign: 'center', fontSize: '20px' }}>
        Reconocimiento de patrones
      </Header>
      <Content style={{ padding: '20px', marginTop: '20px' }}>
        <Content style={{ width: '100%', marginBottom: '20px', backgroundColor: 'none', display: 'flex', flexDirection: 'row', justifyContent: 'center', alignContent: 'center', alignItems: 'center' }}>
          
        </Content>
       
      </Content>
      <Footer style={{ textAlign: 'center' }}>ReplacedSpace17</Footer>
    </Layout>
  );
}

export default DistanciaMinima;