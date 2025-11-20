import './font.css'
import './index.css'
import './scroll.css'

import Navbar from './features/navbar/Navbar';
import Technical from './features/sidebar/Technical';
import Footer from './features/footer/Footer';

export default function App() {
  return (
    <div
      style={{
        fontFamily:
          "Space Mono, Inconsolata, Menlo, Monaco, Consolas, 'Courier New', Courier, monospace",
      }}
      className='flex flex-col h-dvh overflow-hidden'
    >
      <Navbar />
      <Technical />
      <Footer />
    </div>
  );
}