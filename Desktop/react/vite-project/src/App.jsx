import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import TextOpt from './TextOpt';
import About from './About';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  const [mode, setMode] = useState('light');

  useEffect(() => {
    if (mode === 'dark') {
      document.body.style.background = 'black';
      document.body.style.color = 'white';
    } else {
      document.body.style.background = 'white';
      document.body.style.color = 'black';
    }
  }, [mode]);

  const toggleMode = () => {
    setMode(mode === 'light' ? 'dark' : 'light');
  };

  return (
    <Router>
      <div className={`bg-${mode} text-${mode === 'dark' ? 'light' : 'dark'} min-vh-100`}>
        <Navbar mode={mode} toggleMode={toggleMode} color={mode === 'dark' ? 'white' : 'black'} />
        <div className="container my-3">
          <Routes>
            <Route path="/about" element={<About />} />
            <Route path="/" element={<TextOpt />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
