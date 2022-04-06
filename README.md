# Invoice Generator Using Electron

## Background

At a job I have, I hold a responsibility to convert recorded customer transactions in an excel file into invoice PDFs that can be sent to the respective customers. The task had always been fundementally simple and straightforward, and at first I quickly came up with an equally simple solution: I created an invoice template from a PivotTable and formatted it to display all the necessary information, and then I would filter through the transaction data by each unique customer and save the resulting PivotTable as PDF one by one, and then save those PDF invoices somewhere in the computer until ready to be sent. However, that method was very unecessarily time-consuming. It would usually take around 10 seconds to create an invoice for one single customer, and I would make close to 100 invoices every week.

![ezgif com-gif-maker](https://user-images.githubusercontent.com/56351143/161926041-0ec59057-4623-4f31-8073-0bf4962e4fca.gif)

As I was given freedom on how the invoices could look like, I decided to look for alternative ways to generate the invoices automatically from the data in the Excel file. I figured what I wanted to do, roughly:

- Choose and Excel file
- Generate PDF invoices for every unique customer in the file

This would yield the same result I had gotten from manually creating the PDFs. Since I would be the only one using the application, I opted to make a desktop application.

There was also a need to be able to combine invoices from multiple customers into a single invoice with a combined total, which didn't require much extra work with the Excel system. This functionality had to be present in the invoice generator application.

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

## The Application

### Functional Requirements

- Generate PDF invoices from an Excel file
- Generate combined invoices between multiple customers into one PDF invoice
  - Group customers from whom will be created a single PDF invoice
  - Remove groups of customers from whom will have been created a single PDF invoice
  - Filter list of customers to select by name search query

### Result

The application created fully accomplishes its main purpose of automatically creating invoices from an Excel file and its other supplementary functional requirements.

As is shown in the demo, it now takes roughly the same amount of time to create an invoice for **ALL** the customers in an Excel file as it used to to create an invoice for one **SINGLE** customer in the old Excel system.

This application has not been packaged in any way, as I am considering future improvements and going into the command line and starting the app that way is convinent enough.

### Suggestions

This section is meant as a reminder to myself of future plans to improve the applications and to open discussion if people would like to suggest ways that I could improve this application, as I'm sure this is just one of the many ways the objective of this application could be achieved.

Suggestions listed below will take into consideration the constraint of working with the old Excel system and the fact that the sole purpse of this application was to reduce time wasted in creating invoices with said system:
- [ ] Remove page freeze or add a loading indicator while the application is creating the invoices.

### Demo

![ezgif com-gif-maker](https://user-images.githubusercontent.com/56351143/161944165-37ad9b1a-bf37-4064-9640-52800da073e1.gif)

