import { useState } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
// import icon from '../../assets/icon.svg';
import './App.css';
import Header from './components/Header';

const Process = () => {
  // const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleFileInputChange: React.ChangeEventHandler<HTMLInputElement> = (
    e
  ) => {
    const chosenFile = e.target.files ? e.target.files[0] : null;
    setFile(chosenFile);
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (file) {
      window.electron.ipcRenderer.send('process-file', file.name, file.path);
      setFile(null);
    }
  };

  return (
    <div className="container">
      <form onSubmit={handleSubmit} className="file-form paper">
        <div className="file-form__input-container">
          <div>Excel File:</div>
          <label htmlFor="file" className="btn">
            {file ? file.name : 'Choose Excel File'}
          </label>
          <input
            type="file"
            id="file"
            accept=".xlsx"
            onChange={handleFileInputChange}
          />
        </div>
        <button className="btn-primary" type="submit">
          Process File
        </button>
      </form>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/process" element={<Process />} />
      </Routes>
    </Router>
  );
}
