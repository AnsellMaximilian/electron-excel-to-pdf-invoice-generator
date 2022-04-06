import React, { useState } from 'react';

const Process = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileToBeProccessed, setFileToBeProccessed] = useState<File | null>(
    null
  );
  const [invoiceCustomers, setInvoiceCustomers] = useState<string[]>([]);
  const [combinedInvoices, setCombinedInvoices] = useState<string[][]>([]);
  const [checkedCustomers, setCheckedCustomers] = useState<string[]>([]);

  const handleFileInputChange: React.ChangeEventHandler<HTMLInputElement> = (
    e
  ) => {
    const chosenFile = e.target.files ? e.target.files[0] : null;
    setSelectedFile(chosenFile);
  };

  const handleCombineFormSubmit: React.FormEventHandler<HTMLFormElement> = (
    e
  ) => {
    if (checkedCustomers.length > 1) {
      e.preventDefault();
      setCombinedInvoices((prev) => [...prev, checkedCustomers]);
      setInvoiceCustomers((prev) =>
        prev.filter((prevCus) => !checkedCustomers.includes(prevCus))
      );
      setCheckedCustomers([]);
    }
  };

  const handleCheckboxChange = (customer: string) => {
    if (checkedCustomers.includes(customer)) {
      setCheckedCustomers((prev) => {
        return prev.filter((prevCustomer) => prevCustomer !== customer);
      });
    } else {
      setCheckedCustomers((prev) => [...prev, customer]);
    }
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (selectedFile) {
      setCombinedInvoices([]);
      setCheckedCustomers([]);
      const customers = (await window.electron.getCustomersFromFile(
        selectedFile.path
      )) as string[];
      setInvoiceCustomers(customers.sort());
      setFileToBeProccessed(selectedFile);
    }
  };

  const handleGeneratePDF = () => {
    if (fileToBeProccessed) {
      window.electron.ipcRenderer.send(
        'process-file',
        fileToBeProccessed.path,
        combinedInvoices
      );
    }
  };

  return (
    <div className="container">
      <form onSubmit={handleSubmit} className="file-form paper">
        <div className="file-form__input-container">
          <div>Excel File:</div>
          <label htmlFor="file" className="btn">
            {selectedFile ? selectedFile.name : 'Choose Excel File'}
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
      <div className="paper">
        {selectedFile ? (
          <div>
            <div>
              TO BE COMBINED:{' '}
              {combinedInvoices.map((customers) => {
                return (
                  <div key={`${customers[0]}`}>
                    {customers.map((cus) => (
                      <span key={cus}>{cus},</span>
                    ))}
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={handleGeneratePDF}
            >
              Generate PDF {fileToBeProccessed && fileToBeProccessed.name}
            </button>
            <form className="customer-form" onSubmit={handleCombineFormSubmit}>
              {invoiceCustomers.map((customer) => {
                return (
                  <div key={customer}>
                    <input
                      type="checkbox"
                      id={`${customer}-input`}
                      checked={checkedCustomers.includes(customer)}
                      onChange={() => handleCheckboxChange(customer)}
                    />
                    <label htmlFor={`${customer}-input`}>{customer}</label>
                  </div>
                );
              })}
              <button type="submit" className="btn-primary">
                Combine
              </button>
            </form>
          </div>
        ) : (
          <h2>Please select an Excel file to process.</h2>
        )}
      </div>
    </div>
  );
};

export default Process;
