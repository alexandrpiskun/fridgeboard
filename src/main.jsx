import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ScheduleTable from './schedule-table.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ScheduleTable />
  </StrictMode>,
)
