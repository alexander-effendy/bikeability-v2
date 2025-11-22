import ChangeLogModal from "@/features/dialog/Changelog";
import Footer from "@/features/footer/Footer";
import Navbar from "@/features/navbar/Navbar";
import Technical from "@/features/sidebar/Technical";

const Base = () => {
  return (
    <div 
      style={{
        fontFamily:
          "Space Mono, Inconsolata, Menlo, Monaco, Consolas, 'Courier New', Courier, monospace",
      }}
      className='flex flex-col h-dvh overflow-hidden'
    >
      <ChangeLogModal />
      <Navbar />
      <Technical />
      <Footer />
    </div>
  )
}
export default Base;