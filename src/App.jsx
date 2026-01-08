import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { APIProvider } from '@vis.gl/react-google-maps';
import MainLayout from './layouts/MainLayout';
import MapView from './pages/MapView';

import About from './pages/About';
import './App.css';

// Define libraries array outside component to prevent infinite re-renders
const LIBRARIES = ['maps3d', 'places', 'marker'];

function App() {
  const API_KEY = import.meta.env.VITE_GOOGLE_MAP_API_KEY || '';

  return (
    <APIProvider apiKey={API_KEY} version="alpha" libraries={LIBRARIES}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<MapView />} />

            <Route path="about" element={<About />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </APIProvider>
  );
}

export default App;
