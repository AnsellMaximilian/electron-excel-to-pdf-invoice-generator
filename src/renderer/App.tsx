import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import CombineExcel from './CombineExcel';
import Header from './components/Header';
import Process from './Process';

export default function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Process />} />
        <Route path="/combine-excel" element={<CombineExcel />} />
      </Routes>
    </Router>
  );
}
