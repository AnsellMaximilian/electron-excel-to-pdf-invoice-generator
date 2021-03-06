/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import xlsx from 'xlsx';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import TransactionFileProcessor, {
  TransactionRow,
} from './TransactionFileProcessor';
import InvoiceGenerator from './InvoiceGenerator';
import Invoice, { InvoicesObject } from './Invoice';

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

// IPC Listeners
ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

ipcMain.on(
  'process-file',
  (_event, filePath: string, invoicesToCombine: string[][] = []) => {
    // TransactionFileProcessor.process(fileName, filePath);
    const tsWs = xlsx.readFile(filePath).Sheets.Transaction;

    const tsWsJSON: TransactionRow[] =
      TransactionFileProcessor.filterOutEmptyRows(
        xlsx.utils.sheet_to_json(tsWs)
      );

    const invoicesData: InvoicesObject =
      Invoice.getFormattedInvoiceObject(tsWsJSON);

    // Individual invoices
    Object.keys(invoicesData)
      .filter(
        (label) =>
          !invoicesToCombine.some((combination) => combination.includes(label))
      )
      .forEach((label) => {
        InvoiceGenerator.generate(new Invoice(invoicesData[label]));
      });

    // Combined invoices
    invoicesToCombine.forEach((combination) => {
      const firstInvoice = invoicesData[combination[0]];
      const { name: dest, date } = firstInvoice;
      InvoiceGenerator.generateCombinedInvoices(
        dest,
        date,
        ...combination.map((cus) => new Invoice(invoicesData[cus]))
      );
    });

    // InvoiceGenerator.generateCombinedInvoices(
    //   invoicesData['Yuliana (Nelly)'],
    //   invoicesData.Nelly
    // );
  }
);

ipcMain.handle('get-customers-from-file', (_event, filePath) => {
  return Invoice.getCustomers(
    Invoice.getFormattedInvoiceObject(
      TransactionFileProcessor.filterOutEmptyRows(
        xlsx.utils.sheet_to_json(xlsx.readFile(filePath).Sheets.Transaction)
      )
    )
  );
});

ipcMain.on(
  'combine-excel-files',
  (_event, filePaths: string[], newFileName: string) => {
    TransactionFileProcessor.combineExcelFiles(filePaths, newFileName);
  }
);

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDevelopment =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDevelopment) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDevelopment) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
