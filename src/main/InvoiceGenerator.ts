import PDFGenerator from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { TransactionRow } from './TransactionFileProcessor';

const rupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
};

export interface InvoicesObject {
  [key: string]: InvoiceData;
}

export interface InvoiceData {
  name: string;
  date: string;
  items: { [key: string]: InvoiceItem[] };
  additionalFees: AdditionalFee[];
  discounts: Discount[];
  deliveryFees: DeliveryFee[];
}

export interface AdditionalFee {
  note: string;
  amount: number;
}

export interface Discount {
  note: string;
  amount: number;
}

export interface InvoiceItem {
  name: string;
  price: number;
  qty: number;
  total: number;
  supplier: string;
}

export interface DeliveryFee {
  note: string;
  amount: number;
}

class InvoiceGenerator {
  invoiceData: InvoiceData;

  constructor(invoiceData: InvoiceData) {
    this.invoiceData = invoiceData;
  }

  static getCustomers(invoicesObject: InvoicesObject) {
    return Object.keys(invoicesObject);
  }

  static getFormattedInvoiceObject(
    transactionRows: TransactionRow[]
  ): InvoicesObject {
    return transactionRows.reduce((inovicesObject, row) => {
      const isDiscount = row.RealSUp === 'Pengurangan';
      const isDeliveryFee = row.SUPPLIER === 'Ongkir';
      const isAdditionalFee = row.RealSUp === 'Penambahan';
      // const isItem = !isDiscount && !isDeliveryFee && isAdditionalFee;

      if (!inovicesObject[row.CUSTOMER]) {
        inovicesObject[row.CUSTOMER] = {
          name: row.CUSTOMER,
          date: row.DATE,
          items: {},
          additionalFees: [],
          discounts: [],
          deliveryFees: [],
        };
      }
      if (isDeliveryFee) {
        inovicesObject[row.CUSTOMER].deliveryFees.push({
          note: row.ITEM,
          amount: row.TOTAL,
        });
      } else if (isDiscount) {
        inovicesObject[row.CUSTOMER].discounts.push({
          note: row.ITEM,
          amount: row.TOTAL,
        });
      } else if (isAdditionalFee) {
        inovicesObject[row.CUSTOMER].additionalFees.push({
          note: row.ITEM,
          amount: row.TOTAL,
        });
      } else {
        inovicesObject[row.CUSTOMER].items[row.SUPPLIER] = [
          ...(inovicesObject[row.CUSTOMER].items[row.SUPPLIER]
            ? inovicesObject[row.CUSTOMER].items[row.SUPPLIER]
            : []),
          {
            name: row.ITEM,
            qty: row.QTY,
            total: row.TOTAL,
            price: row.PRICE,
            supplier: row.RealSUp,
          },
        ];
      }

      return inovicesObject;
    }, {} as InvoicesObject);
  }

  getItemsLength() {
    return this.getFlattenedItems().length;
  }

  getFlattenedItems() {
    return Object.keys(this.invoiceData.items).reduce(
      (itemsArr, label) => [...itemsArr, ...this.invoiceData.items[label]],
      [] as InvoiceItem[]
    );
  }

  getSubtotal() {
    return this.getFlattenedItems().reduce(
      (total, item) => total + item.total,
      0
    );
  }

  getGrandTotal() {
    return (
      this.getSubtotal() +
      this.invoiceData.deliveryFees.reduce(
        (total, item) => total + item.amount,
        0
      ) +
      this.invoiceData.additionalFees.reduce(
        (total, item) => total + item.amount,
        0
      ) +
      this.invoiceData.discounts.reduce((total, item) => total + item.amount, 0)
    );
  }

  static getStartOfPage(doc: PDFKit.PDFDocument) {
    return doc.page.margins.left;
  }

  static getEndOfPage(doc: PDFKit.PDFDocument) {
    return doc.page.width - doc.page.margins.right;
  }

  static drawLine(doc: PDFKit.PDFDocument, size: number) {
    doc
      .lineWidth(size)
      .moveTo(InvoiceGenerator.getStartOfPage(doc), doc.y)
      .lineTo(InvoiceGenerator.getEndOfPage(doc), doc.y)
      .stroke();
  }

  static generateCombinedInvoices(...invoices: InvoiceData[]) {}

  generate(): PDFKit.PDFDocument | null {
    const output = new PDFGenerator();
    const { width, margins } = output.page;
    const widthAfterMargins = width - margins.left - margins.right;
    const startOfPage = 0 + margins.left;

    // Pipe into pdf file
    output.pipe(
      fs.createWriteStream(
        path.join(
          app.getPath('home'),
          'Rumah Sehat Archive',
          'Invoices',
          `${this.invoiceData.name} ${this.invoiceData.date}.pdf`
        )
      )
    );

    // Header
    const headerHalfWidth = width / 2;
    output
      .fillColor('#61E03A')
      .fontSize(30)
      .font('Helvetica-Bold')
      .text('RUMAH SEHAT')
      .fontSize(20)
      .moveDown()
      .fillColor('#000')
      .text('INVOICE', { width: headerHalfWidth })
      .font('Helvetica')
      .fontSize(15)
      .text(`Kepada: ${this.invoiceData.name}`, { width: headerHalfWidth })
      .text(`Periode: ${this.invoiceData.date}`, { width: headerHalfWidth })
      .moveUp(2)
      .text(
        'Transfer to BCA: 598-034-6333 (F.M. Fenty Effendy)',
        headerHalfWidth,
        undefined,
        { align: 'right' }
      )
      .moveDown();

    InvoiceGenerator.drawLine(output, 3);

    output.moveDown().fontSize(10);

    // Table
    const itemColumnWidth = widthAfterMargins * 0.4;
    const priceColumnWidth = widthAfterMargins * 0.2;
    const qtyColumnWidth = widthAfterMargins * 0.2;
    // const amountColumnWidth = width * 0.3;

    const itemX = startOfPage;
    const priceX = itemX + itemColumnWidth;
    const qtyX = priceX + priceColumnWidth;
    const itemTotalX = qtyX + qtyColumnWidth;

    output
      .font('Helvetica-Bold')
      .text('Item', itemX, undefined, { width: itemColumnWidth })
      .moveUp()
      .text('Price', priceX, undefined, {
        width: priceColumnWidth,
        align: 'right',
      })
      .moveUp()
      .text('Qty', qtyX, undefined, { width: qtyColumnWidth, align: 'center' })
      .moveUp()
      .text('Amount', itemTotalX, undefined, { align: 'right' })
      .moveDown()
      .font('Helvetica');

    Object.keys(this.invoiceData.items)
      .sort()
      .forEach((label) => {
        output.moveDown();

        if (!label.includes('Chi')) {
          output
            .font('Helvetica-BoldOblique')
            .text(label, startOfPage)
            .font('Helvetica');
        }

        this.invoiceData.items[label].forEach((invoiceItem) => {
          output
            .text(invoiceItem.name, itemX, undefined, {
              width: itemColumnWidth,
            })
            .moveUp()
            .text(rupiah(invoiceItem.price), priceX, undefined, {
              width: priceColumnWidth,
              align: 'right',
            })
            .moveUp()
            .text(invoiceItem.qty.toString(), qtyX, undefined, {
              width: qtyColumnWidth,
              align: 'center',
            })
            .moveUp()
            .text(rupiah(invoiceItem.total), itemTotalX, undefined, {
              align: 'right',
            });
        });
      });

    const amountX = itemTotalX;

    // Subtotal
    const subtotalColumnWidth = priceColumnWidth + qtyColumnWidth;
    const subtotal = this.getFlattenedItems().reduce(
      (total, item) => total + item.total,
      0
    );

    InvoiceGenerator.drawLine(output.moveDown(), 1);

    output
      .moveDown()
      .font('Helvetica-Bold')
      .fontSize(15)
      .text('SUBTOTAL:', priceX, undefined, {
        width: subtotalColumnWidth,
        align: 'left',
      })
      .moveUp()
      .text(rupiah(subtotal), {
        align: 'right',
      })
      .fontSize(10);

    // Delivery fees
    const hasDeliveryFees = this.invoiceData.deliveryFees.length > 0;

    if (hasDeliveryFees) {
      output
        .moveDown(2)
        .font('Helvetica-Bold')
        .text('Ongkir', priceX, undefined, {
          width: subtotalColumnWidth,
          align: 'left',
        })
        .font('Helvetica');
    }

    this.invoiceData.deliveryFees.forEach((fee) => {
      output
        .text(fee.note, priceX, undefined, {
          width: subtotalColumnWidth,
          align: 'left',
        })
        .moveUp()
        .text(rupiah(fee.amount), amountX, undefined, { align: 'right' });
    });

    // Additional fees
    const hasAdditionalFees = this.invoiceData.additionalFees.length > 0;

    if (hasAdditionalFees) {
      output
        .moveDown(2)
        .font('Helvetica-Bold')
        .text('Penambahan', priceX, undefined, {
          width: subtotalColumnWidth,
          align: 'left',
        })
        .font('Helvetica');
    }

    this.invoiceData.additionalFees.forEach((fee) => {
      output
        .text(fee.note, priceX, undefined, {
          width: subtotalColumnWidth,
          align: 'left',
        })
        .moveUp()
        .text(rupiah(fee.amount), amountX, undefined, { align: 'right' });
    });

    // Discounts
    const hasDiscounts = this.invoiceData.discounts.length > 0;
    if (hasDiscounts) {
      output
        .moveDown(2)
        .font('Helvetica-Bold')
        .text('Pengurangan', priceX, undefined, {
          width: subtotalColumnWidth,
          align: 'left',
        })
        .font('Helvetica');
    }

    this.invoiceData.discounts.forEach((discount) => {
      output
        .text(discount.note, priceX, undefined, {
          width: subtotalColumnWidth,
          align: 'left',
        })
        .moveUp()
        .text(rupiah(discount.amount), amountX, undefined, { align: 'right' });
    });

    // Grand total
    const grandTotal =
      subtotal +
      this.invoiceData.deliveryFees.reduce(
        (total, item) => total + item.amount,
        0
      ) +
      this.invoiceData.additionalFees.reduce(
        (total, item) => total + item.amount,
        0
      ) +
      this.invoiceData.discounts.reduce(
        (total, item) => total + item.amount,
        0
      );

    InvoiceGenerator.drawLine(output.moveDown(), 3);

    output
      .moveDown()
      .fontSize(17.5)
      .font('Helvetica-Bold')
      .text('Grand Total:', priceX, undefined, {
        align: 'left',
        width: subtotalColumnWidth,
      })
      .moveUp()
      .text(rupiah(grandTotal), { align: 'right' })
      .font('Helvetica')
      .fontSize(10);

    output.end();
    return null;
  }
}

export default InvoiceGenerator;
