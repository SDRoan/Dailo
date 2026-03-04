import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Tracker from './pages/Tracker'
import FocusPage from './pages/FocusPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<Tracker />} />
        <Route path="/app/focus" element={<FocusPage />} />
        <Route path="/focus" element={<FocusPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
