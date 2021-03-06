import PDFGenerator from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import Invoice, { AdditionalInvoiceItem } from './Invoice';

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
    startOfPage: number,
    dest: string,
    date: string,
    amountDue: number
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
      .fontSize(15)
      .text(`Kepada: ${dest}`, { width: headerHalfWidth })
      .moveUp()
      .text(`${date}`, startOfPage + headerHalfWidth, doc.y, {
        align: 'right',
      })
      .font('Helvetica')
      .moveDown(3)
      .fontSize(12.5)
      .text('Transfer to BCA: 598-034-6333', startOfPage, undefined, {
        width: headerHalfWidth,
      })
      .text('(F.M. Fenty Effendy)', {
        width: headerHalfWidth,
      })
      .moveUp(4)
      .fontSize(15);

    // Amount due
    const margin = 5;
    doc
      .fillColor('#61E03A')
      .rect(startOfPage + headerHalfWidth, doc.y, headerHalfWidth, 85)
      .fill()
      .fillColor('#FFF')
      .font('Helvetica-Bold')
      .moveDown()
      .text('Amount Due', startOfPage + headerHalfWidth + margin, doc.y, {
        align: 'left',
      })
      .moveDown()
      .fontSize(17.5)
      .text(rupiah(amountDue), startOfPage + headerHalfWidth, doc.y, {
        align: 'right',
        width: headerHalfWidth - margin,
      })
      .moveDown()
      .fillColor('#000')
      .font('Helvetica');

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
      .text(label, priceX, undefined, {
        width: subtotalColumnWidth,
        align: 'left',
      })
      .moveUp()
      .text(rupiah(subtotal), {
        align: 'right',
      });
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
    const headerHalfWidth = widthAfterMargins / 2;

    InvoiceGenerator.generateHeader(
      output,
      headerHalfWidth,
      startOfPage,
      invoice.invoiceData.name,
      invoice.invoiceData.date,
      invoice.getGrandTotal()
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

  static generateCombinedInvoices(
    dest: string,
    date: string,
    ...invoices: Invoice[]
  ) {
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
          `${dest} ${date}.pdf`
        )
      )
    );
    // Header
    const headerHalfWidth = widthAfterMargins / 2;

    InvoiceGenerator.generateHeader(
      output,
      headerHalfWidth,
      startOfPage,
      dest,
      date,
      invoices.reduce((sum, invoice) => sum + invoice.getGrandTotal(), 0)
    );

    output.moveDown();

    // Table
    const itemColumnWidth = widthAfterMargins * 0.4;
    const priceColumnWidth = widthAfterMargins * 0.2;
    const qtyColumnWidth = widthAfterMargins * 0.2;
    const itemX = startOfPage;
    const priceX = itemX + itemColumnWidth;
    const qtyX = priceX + priceColumnWidth;
    const itemTotalX = qtyX + qtyColumnWidth;

    let combinedTotal = 0;

    invoices.forEach((invoice) => {
      combinedTotal += invoice.getGrandTotal();
      output
        .fontSize(15)
        .font('Helvetica-Bold')
        .text(`Tagihan ${invoice.invoiceData.name}`, startOfPage, undefined, {
          align: 'left',
        })
        .font('Helvetica')
        .moveDown()
        .fontSize(10);

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
        `Subtotal ${invoice.invoiceData.name}:`,
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
        `Total ${invoice.invoiceData.name}:`,
        priceX,
        subtotalColumnWidth
      );

      // InvoiceGenerator.drawLine(output, 3);
      output
        .moveDown()
        .fillColor('#61E03A')
        .rect(startOfPage, output.y, widthAfterMargins, 20)
        .fill()
        .fillColor('#000')
        .moveDown(3);
    });

    output
      .moveDown(2)
      .font('Helvetica-Bold')
      .fontSize(25)
      .text('Grand Total', startOfPage, undefined, {
        align: 'center',
        width: widthAfterMargins,
      })
      .text(rupiah(combinedTotal), startOfPage, undefined, {
        align: 'center',
        width: widthAfterMargins,
      });

    InvoiceGenerator.drawLine(output, 3);
    output.moveDown();
    InvoiceGenerator.drawLine(output, 3);

    output.end();
    return null;
  }
}

export default InvoiceGenerator;
