# Invoice Generator Using Electron

## Background

At a job I have, I hold a responsibility to convert recorded customer transactions in an excel file into invoice PDFs that can be sent to the respective customers. The task had always been fundementally simple and straightforward, and at first I quickly came up with an equally simple solution: I created an invoice template from a PivotTable and formatted it to display all the necessary information, and then I would filter through the transaction data by each unique customer and save the resulting PivotTable as PDF one by one, and then save those PDF invoices somewhere in the computer until ready to be sent. However, that method was very unecessarily time-consuming. It would usually take around 10 seconds to create an invoice for one single customer, and I would make close to 100 invoices every week.

![ezgif com-gif-maker](https://user-images.githubusercontent.com/56351143/161926041-0ec59057-4623-4f31-8073-0bf4962e4fca.gif)

As I was given freedom on how the invoices could look like, I decided to look for alternative ways to generate the invoices automatically from the data in the Excel file. I figured what I wanted to do, roughly:

- Choose and Excel file
- Generate PDF invoices for every unique customer in the file

This would yield the same result I had gotten from manually creating the PDFs. Since I would be the only one using the application, I opted to make a desktop application.

### Disclaimer

I realize there are a lot of underlying problems with the system itself of using an Excel file to record transactions and then turning the data inside into invoices, but I made this application exclusively with the intention reduce the time wasted in making invoices with that current system. So, this application was made with the constraint of working with said Excel system. A complete point-of-sale desktop system would of course give a lot more benefits in addition to automatic invoice generation.

## Tools Used

| Tool/Library                                      | Purpose                                      |
| ------------------------------------------------- | -------------------------------------------- |
| [xlsx](https://sheetjs.com/)                      | Parsing and processing Excel files           |
| [PDFKit](https://pdfkit.org/)                     | Generating invoice PDFs                      |
| [Electron](https://electronjs.org/)               | Desktop application framework                |
| [React](https://reactjs.org/)                     | UI development                               |
| [ERB](https://electron-react-boilerplate.js.org/) | Quick setup for a Electron-React application |

## How It Works
