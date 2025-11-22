import { BrowserRouter, Routes, Route } from "react-router-dom";

import './font.css'
import './index.css'
import './scroll.css'
import './globals.css'

import Base from './pages/Base';
import Login from './pages/Login';

import RequireAuth from "./features/auth/RequireAuth";
export default function App() {
  return (
    <BrowserRouter>
      <div
        // style={{
        //   fontFamily:
        //     "Space Mono, Inconsolata, Menlo, Monaco, Consolas, 'Courier New', Courier, monospace",
        // }}
        className='flex flex-col h-dvh overflow-hidden'
      >
        <Routes>
          
          <Route
        path="/"
        element={
          <RequireAuth>
            <Base />
          </RequireAuth>
        }
      />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}