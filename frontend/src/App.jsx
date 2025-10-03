import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import LaunchApp from './pages/LaunchApp';
import Presale from './pages/Presale';
import Docs from './pages/Docs';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={<LaunchApp />} />
      <Route path="/presale" element={<Presale />} />
      <Route path="/docs" element={<Docs />} />
    </Routes>
  );
}

export default App;