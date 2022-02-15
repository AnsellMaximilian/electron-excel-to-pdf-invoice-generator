import path from 'path';
import fs from 'fs';
import xlxs from 'xlsx';
import { app } from 'electron';

export interface TransactionRow {
  DATE: string;
  CUSTOMER: string;
  ITEM: string;
  SUPPLIER: string;
  PRICE: number;
  QTY: number;
  TOTAL: number;
  SupplierPrice: number;
  SupplierTotal: number;
  RealSUp: string;
}

class TransactionFileProcessor {
  static process(fileName: string, filePath: string) {
    const newWb = xlxs.readFile(filePath);

    const newTransactionSheet = newWb.Sheets.Transaction;

    const sheetRange = xlxs.utils.decode_range(
      newTransactionSheet['!ref'] as string
    );

    sheetRange.s.c = 0;
    sheetRange.e.c = 9;

    const newSheetRange = xlxs.utils.encode_range(sheetRange);

    const newTransactionJSON: TransactionRow[] = xlxs.utils.sheet_to_json(
      newTransactionSheet,
      {
        range: newSheetRange,
      }
    );

    // Filter empty rows and add year in DATE column
    const filteredNewTransactionJSON = newTransactionJSON
      .filter((row) => !!row.CUSTOMER)
      .map((row) => {
        row.DATE += ` ${new Date().getFullYear()}`;
        return row;
      });

    const archiveFilePath = path.join(
      app.getPath('home'),
      'Rumah Sehat Archive',
      'test.xlsx'
    );

    const masterSheetName = 'Master';
    const appendHistorySheetName = 'Append History';

    let archiveFile;

    const appendHistoryEntry = {
      FILE: `${fileName} ${new Date().getFullYear()}`,
      DATE_APPENDED: new Date().toISOString(),
    };

    if (fs.existsSync(archiveFilePath)) {
      // Get existing gile
      archiveFile = xlxs.readFile(archiveFilePath);

      // Get master and history sheet
      const masterSheet = archiveFile.Sheets[masterSheetName];
      const appendHistorySheet = archiveFile.Sheets[appendHistorySheetName];

      // Convert sheets to JSON
      const masterJSON = xlxs.utils.sheet_to_json(masterSheet);
      const appendHistoryJSON = xlxs.utils.sheet_to_json(appendHistorySheet);

      // Check append history to see if data has already been appended
      // TODO

      // If check returns true, warn user
      // TODO

      // Append to JSON with new data
      masterJSON.push(...filteredNewTransactionJSON);

      // Write into append history
      appendHistoryJSON.push(appendHistoryEntry);

      // Write updated sheets into archive file
      archiveFile.Sheets[masterSheetName] =
        xlxs.utils.json_to_sheet(masterJSON);
      archiveFile.Sheets[appendHistorySheetName] =
        xlxs.utils.json_to_sheet(appendHistoryJSON);
    } else {
      // Create workbook
      archiveFile = xlxs.utils.book_new();

      // Append filtered sheet
      xlxs.utils.book_append_sheet(
        archiveFile,
        xlxs.utils.json_to_sheet(filteredNewTransactionJSON),
        masterSheetName
      );

      // Create append history sheet
      const appendHistorySheet = xlxs.utils.json_to_sheet([appendHistoryEntry]);

      // Append history sheet
      xlxs.utils.book_append_sheet(
        archiveFile,
        appendHistorySheet,
        appendHistorySheetName
      );
    }

    // Write into file
    xlxs.writeFile(archiveFile, archiveFilePath);
  }
}

export default TransactionFileProcessor;
