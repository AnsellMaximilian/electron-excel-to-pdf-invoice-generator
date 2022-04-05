import PDFGenerator from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import Invoice, { AdditionalInvoiceItem, InvoiceData } from './Invoice';

const rupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
};

class InvoiceGenerator {
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

  static generateHeader(
    doc: PDFKit.PDFDocument,
    headerHalfWidth: number,
    dest: string,
    date: string
  ) {
    doc
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
      .text(`Kepada: ${dest}`, { width: headerHalfWidth })
      .text(`Periode: ${date}`, { width: headerHalfWidth })
      .moveUp(2)
      .text(
        'Transfer to BCA: 598-034-6333 (F.M. Fenty Effendy)',
        headerHalfWidth,
        undefined,
        { align: 'right' }
      )
      .moveDown();

    InvoiceGenerator.drawLine(doc, 3);
  }

  static generateTable(
    doc: PDFKit.PDFDocument,
    invoice: Invoice,
    startOfPage: number,
    itemColumnWidth: number,
    priceColumnWidth: number,
    qtyColumnWidth: number,
    itemX: number,
    priceX: number,
    qtyX: number,
    itemTotalX: number
  ) {
    doc
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

    InvoiceGenerator.drawLine(doc, 1);

    doc.moveDown();

    Object.keys(invoice.invoiceData.items)
      .sort()
      .forEach((label) => {
        doc.moveDown();

        if (!label.includes('Chi')) {
          doc
            .font('Helvetica-BoldOblique')
            .text(label, startOfPage)
            .font('Helvetica');
        }

        invoice.invoiceData.items[label].forEach((invoiceItem) => {
          doc
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
  }

  static generateAdditionalItemsTable(
    doc: PDFKit.PDFDocument,
    label: string,
    items: AdditionalInvoiceItem[],
    priceX: number,
    subtotalColumnWidth: number,
    amountX: number
  ) {
    doc
      .moveDown(2)
      .font('Helvetica-Bold')
      .text(label, priceX, undefined, {
        width: subtotalColumnWidth,
        align: 'left',
      })
      .font('Helvetica');

    items.forEach((fee) => {
      doc
        .text(fee.note, priceX, undefined, {
          width: subtotalColumnWidth,
          align: 'left',
        })
        .moveUp()
        .text(rupiah(fee.amount), amountX, undefined, { align: 'right' });
    });
  }

  static generateSubtotal(
    doc: PDFKit.PDFDocument,
    subtotal: number,
    label: string,
    priceX: number,
    subtotalColumnWidth: number
  ) {
    InvoiceGenerator.drawLine(doc.moveDown(), 1);

    doc
      .moveDown()
      .font('Helvetica-Bold')
      .fontSize(15)
      .text(label, priceX, undefined, {
        width: subtotalColumnWidth,
        align: 'left',
      })
      .moveUp()
      .text(rupiah(subtotal), {
        align: 'right',
      })
      .fontSize(10);
  }

  static generateGrandTotal(
    doc: PDFKit.PDFDocument,
    grandTotal: number,
    label: string,
    priceX: number,
    subtotalColumnWidth: number
  ) {
    InvoiceGenerator.drawLine(doc.moveDown(), 3);

    doc
      .moveDown()
      .fontSize(17.5)
      .font('Helvetica-Bold')
      .text(label, priceX, undefined, {
        align: 'left',
        width: subtotalColumnWidth,
      })
      .moveUp()
      .text(rupiah(grandTotal), { align: 'right' })
      .font('Helvetica')
      .fontSize(10);
  }

  static generate(invoice: Invoice): PDFKit.PDFDocument | null {
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
          `${invoice.invoiceData.name} ${invoice.invoiceData.date}.pdf`
        )
      )
    );

    // Header
    const headerHalfWidth = width / 2;
    InvoiceGenerator.generateHeader(
      output,
      headerHalfWidth,
      invoice.invoiceData.name,
      invoice.invoiceData.date
    );

    output.moveDown().fontSize(10);

    // Table
    const itemColumnWidth = widthAfterMargins * 0.4;
    const priceColumnWidth = widthAfterMargins * 0.2;
    const qtyColumnWidth = widthAfterMargins * 0.2;

    const itemX = startOfPage;
    const priceX = itemX + itemColumnWidth;
    const qtyX = priceX + priceColumnWidth;
    const itemTotalX = qtyX + qtyColumnWidth;

    InvoiceGenerator.generateTable(
      output,
      invoice,
      startOfPage,
      itemColumnWidth,
      priceColumnWidth,
      qtyColumnWidth,
      itemX,
      priceX,
      qtyX,
      itemTotalX
    );

    const amountX = itemTotalX;

    // Subtotal
    const subtotalColumnWidth = priceColumnWidth + qtyColumnWidth;
    const subtotal = invoice.getSubtotal();

    InvoiceGenerator.generateSubtotal(
      output,
      subtotal,
      'Subtotal:',
      priceX,
      subtotalColumnWidth
    );

    // Delivery fees
    const hasDeliveryFees = invoice.invoiceData.deliveryFees.length > 0;
    if (hasDeliveryFees) {
      InvoiceGenerator.generateAdditionalItemsTable(
        output,
        'Ongkir',
        invoice.invoiceData.deliveryFees,
        priceX,
        subtotalColumnWidth,
        amountX
      );
    }

    // Additional fees
    const hasAdditionalFees = invoice.invoiceData.additionalFees.length > 0;
    if (hasAdditionalFees) {
      InvoiceGenerator.generateAdditionalItemsTable(
        output,
        'Penambahan',
        invoice.invoiceData.additionalFees,
        priceX,
        subtotalColumnWidth,
        amountX
      );
    }

    // Discounts
    const hasDiscounts = invoice.invoiceData.discounts.length > 0;
    if (hasDiscounts) {
      InvoiceGenerator.generateAdditionalItemsTable(
        output,
        'Pengurangan',
        invoice.invoiceData.discounts,
        priceX,
        subtotalColumnWidth,
        amountX
      );
    }

    // Grand total
    const grandTotal = invoice.getGrandTotal();

    InvoiceGenerator.generateGrandTotal(
      output,
      grandTotal,
      'Grand Total:',
      priceX,
      subtotalColumnWidth
    );

    output.end();
    return null;
  }

  static generateCombinedInvoices(...invoices: InvoiceData[]) {
    // const output = new PDFGenerator();
    // const { width, margins } = output.page;
    // const widthAfterMargins = width - margins.left - margins.right;
    // const startOfPage = 0 + margins.left;
    // // Pipe into pdf file
    // output.pipe(
    //   fs.createWriteStream(
    //     path.join(
    //       app.getPath('home'),
    //       'Rumah Sehat Archive',
    //       'Invoices',
    //       `${invoice.invoiceData.name} ${invoice.invoiceData.date}.pdf`
    //     )
    //   )
    // );
    // // Header
    // const headerHalfWidth = width / 2;
    // InvoiceGenerator.generateHeader(
    //   output,
    //   headerHalfWidth,
    //   invoice.invoiceData.name,
    //   invoice.invoiceData.date
    // );
    // output.moveDown().fontSize(10);
    // // Table
    // const itemColumnWidth = widthAfterMargins * 0.4;
    // const priceColumnWidth = widthAfterMargins * 0.2;
    // const qtyColumnWidth = widthAfterMargins * 0.2;
    // const itemX = startOfPage;
    // const priceX = itemX + itemColumnWidth;
    // const qtyX = priceX + priceColumnWidth;
    // const itemTotalX = qtyX + qtyColumnWidth;
    // InvoiceGenerator.generateTable(
    //   output,
    //   invoice,
    //   startOfPage,
    //   itemColumnWidth,
    //   priceColumnWidth,
    //   qtyColumnWidth,
    //   itemX,
    //   priceX,
    //   qtyX,
    //   itemTotalX
    // );
    // const amountX = itemTotalX;
    // // Subtotal
    // const subtotalColumnWidth = priceColumnWidth + qtyColumnWidth;
    // const subtotal = invoice.getSubtotal();
    // InvoiceGenerator.generateSubtotal(
    //   output,
    //   subtotal,
    //   'Subtotal:',
    //   priceX,
    //   subtotalColumnWidth
    // );
    // // Delivery fees
    // const hasDeliveryFees = invoice.invoiceData.deliveryFees.length > 0;
    // if (hasDeliveryFees) {
    //   InvoiceGenerator.generateAdditionalItemsTable(
    //     output,
    //     'Ongkir',
    //     invoice.invoiceData.deliveryFees,
    //     priceX,
    //     subtotalColumnWidth,
    //     amountX
    //   );
    // }
    // // Additional fees
    // const hasAdditionalFees = invoice.invoiceData.additionalFees.length > 0;
    // if (hasAdditionalFees) {
    //   InvoiceGenerator.generateAdditionalItemsTable(
    //     output,
    //     'Penambahan',
    //     invoice.invoiceData.additionalFees,
    //     priceX,
    //     subtotalColumnWidth,
    //     amountX
    //   );
    // }
    // // Discounts
    // const hasDiscounts = invoice.invoiceData.discounts.length > 0;
    // if (hasDiscounts) {
    //   InvoiceGenerator.generateAdditionalItemsTable(
    //     output,
    //     'Pengurangan',
    //     invoice.invoiceData.discounts,
    //     priceX,
    //     subtotalColumnWidth,
    //     amountX
    //   );
    // }
    // // Grand total
    // const grandTotal = invoice.getGrandTotal();
    // InvoiceGenerator.generateGrandTotal(
    //   output,
    //   grandTotal,
    //   'Grand Total:',
    //   priceX,
    //   subtotalColumnWidth
    // );
    // output.end();
    // return null;
  }
}

export default InvoiceGenerator;
