import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";

import Inicio from './views/Iniciar.jsx';
import DistanciaMinima from './views/clasificadores/distancia_minima/Distancia_minima.jsx';
import Knn from './views/clasificadores/KNN/Knn.jsx';

//---------- graficas
import HistogramWithDensity from './views/example.jsx';
import ResumePlot from './views/Components/Resumen/VerDatos.jsx';

function App() {
  const [count, setCount] = useState(0);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/example" element={<HistogramWithDensity />} />
        <Route path="/distancia_minima" element={<DistanciaMinima />} />
        <Route path="/knn" element={<Knn />} />

        <Route path="/scatter" element={<ResumePlot />} />

      </Routes>
    </Router>
  );
}

export default App;
