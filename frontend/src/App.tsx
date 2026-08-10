import { Routes, Route } from 'react-router-dom'
import { DashboardPage } from './pages/DashboardPage'
import { NotebookDetailPage } from './pages/NotebookDetailPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/notebook/:id" element={<NotebookDetailPage />} />
    </Routes>
  )
}

export default App