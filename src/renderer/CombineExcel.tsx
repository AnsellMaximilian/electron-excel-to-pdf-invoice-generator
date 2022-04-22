import React, { useState } from 'react';

const CombineExcel = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileInputChange: React.ChangeEventHandler<HTMLInputElement> = (
    e
  ) => {
    const chosenFiles = e.target.files ? Array.from(e.target.files) : [];
    setSelectedFiles(chosenFiles);
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
  };

  return (
    <div className="container">
      <form onSubmit={handleSubmit} className="file-form paper">
        <div className="file-form__input-container">
          <div>Excel File:</div>
          <label htmlFor="file" className="btn">
            {selectedFiles.length > 0
              ? `${selectedFiles.length} Chosen`
              : 'Choose Excel Files'}
          </label>
          <input
            multiple
            type="file"
            id="file"
            accept=".xlsx"
            onChange={handleFileInputChange}
          />
        </div>
        <button className="btn-primary" type="submit">
          Combine Files
        </button>
      </form>
    </div>
  );
};

export default CombineExcel;
