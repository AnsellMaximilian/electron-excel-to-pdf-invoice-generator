import React, { useState } from 'react';

const Process = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileProcessed, setFileProcessed] = useState(false);
  const [fileToBeProccessed, setFileToBeProccessed] = useState<File | null>(
    null
  );
  const [invoiceCustomers, setInvoiceCustomers] = useState<string[]>([]);
  const [combinedInvoices, setCombinedInvoices] = useState<string[][]>([]);
  const [checkedCustomers, setCheckedCustomers] = useState<string[]>([]);
  const [customerFilter, setCustomerFilter] = useState('');

  const handleFileInputChange: React.ChangeEventHandler<HTMLInputElement> = (
    e
  ) => {
    const chosenFile = e.target.files ? e.target.files[0] : null;
    setSelectedFile(chosenFile);
    setFileProcessed(false);
  };

  const handleCombineFormSubmit: React.FormEventHandler<HTMLFormElement> = (
    e
  ) => {
    e.preventDefault();
    if (checkedCustomers.length > 1) {
      setCombinedInvoices((prev) => [...prev, checkedCustomers]);
      setInvoiceCustomers((prev) =>
        prev.filter((prevCus) => !checkedCustomers.includes(prevCus))
      );
      setCheckedCustomers([]);
      setCustomerFilter('');
    }
  };

  const handleRemoveCombination = (index: number) => {
    setInvoiceCustomers((prev) => [...prev, ...combinedInvoices[index]]);
    setCombinedInvoices((prev) => {
      const newArr = prev.slice();
      newArr.splice(index, 1);
      return newArr;
    });
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

  const handleCancel = () => {
    setFileProcessed(false);
    setSelectedFile(null);
    setFileToBeProccessed(null);
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
      setFileProcessed(true);
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
        {fileProcessed ? (
          <div>
            <form className="customer-form" onSubmit={handleCombineFormSubmit}>
              <div className="combine-grid">
                <div className="combine">
                  <div className="customer-combinations">
                    <h3>Combine Invocies</h3>
                    <div className="customer-combinations__feedback">
                      <div className="feedback">
                        <div>
                          {checkedCustomers.length > 0
                            ? 'Selected:'
                            : 'None selected'}
                        </div>
                        <div className="feedback_selected">
                          {checkedCustomers.map((cus) => (
                            <span key={cus}>{cus}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <button type="submit" className="btn-primary">
                          Combine
                        </button>
                      </div>
                    </div>
                    <div className="customer-combinations_combinations">
                      {combinedInvoices.map((customers, index) => {
                        return (
                          <div key={`${customers[0]}`}>
                            {customers.map((cus) => (
                              <span key={cus}>{cus}</span>
                            ))}
                            <button
                              type="button"
                              onClick={() => handleRemoveCombination(index)}
                            >
                              &times;
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="checkboxes">
                  <div className="search">
                    <input
                      value={customerFilter}
                      type="search"
                      className="checkboxes_search"
                      placeholder="Search for customer"
                      onChange={(e) => setCustomerFilter(e.target.value)}
                    />
                  </div>
                  <div className="checkboxes_items">
                    {invoiceCustomers
                      .filter((customer) =>
                        customer.toLowerCase().includes(customerFilter)
                      )
                      .map((customer) => {
                        return (
                          <div key={customer}>
                            <input
                              type="checkbox"
                              id={`${customer}-input`}
                              checked={checkedCustomers.includes(customer)}
                              onChange={() => handleCheckboxChange(customer)}
                            />
                            <label htmlFor={`${customer}-input`}>
                              {customer}
                            </label>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </form>
            <div className="generate">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-pdf"
                onClick={handleGeneratePDF}
              >
                Generate PDF {fileToBeProccessed && fileToBeProccessed.name}
              </button>
            </div>
          </div>
        ) : (
          <h2>Please select an Excel file to process.</h2>
        )}
      </div>
    </div>
  );
};

export default Process;
