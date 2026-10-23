import { Route, Routes } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import ChatWidget from './components/ChatWidget'
import Home from './pages/Home'
import Configure from './pages/Configure'
import Results from './pages/Results'

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/configuration" element={<Configure />} />
          <Route path="/resultats" element={<Results />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
      <ChatWidget />
    </div>
  )
}