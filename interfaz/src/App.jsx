import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";

import Inicio from './views/Iniciar.jsx';
import HistogramWithDensity from './views/example.jsx';
function App() {
  const [count, setCount] = useState(0);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/example" element={<HistogramWithDensity />} />
      </Routes>
    </Router>
  );
}

export default App;
