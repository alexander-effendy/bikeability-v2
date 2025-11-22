import { BrowserRouter, Routes, Route } from "react-router-dom";

import './font.css'
import './index.css'
import './scroll.css'

import Base from './pages/Base';
import Login from './pages/Login';

export default function App() {
  return (
    <BrowserRouter>
      <div
        style={{
          fontFamily:
            "Space Mono, Inconsolata, Menlo, Monaco, Consolas, 'Courier New', Courier, monospace",
        }}
        className='flex flex-col h-dvh overflow-hidden'
      >
        <Routes>
          <Route path="/" element={<Base />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}