import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import Watch from "./pages/Watch";
import Channel from "./pages/Channel";
import Search from "./pages/Search";

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <Router>
      <div className="flex flex-col h-screen overflow-hidden bg-[#0f0f0f] text-white">
        <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        <div className="flex flex-1 overflow-hidden">
          <Sidebar isOpen={isSidebarOpen} />
          
          <main className="flex-1 overflow-y-auto scrollbar-hide">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/watch/:id" element={<Watch />} />
              <Route path="/channel/:id" element={<Channel />} />
              <Route path="/search" element={<Search />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

