import PDFGenerator from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';

const rupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
};

export interface InvoiceData {
  name: string;
  date: string;
  items: InvoiceItem[];
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

  generate() {
    const output = new PDFGenerator();
    const { width, margins } = output.page;
    const widthAfterMargins = width - margins.left - margins.right;
    const startOfPage = 0 + margins.left;
    const endOfPage = width - margins.right;
    // console.log({ width, margins });

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

    output
      .lineWidth(3)
      .moveTo(startOfPage, output.y)
      .lineTo(endOfPage, output.y)
      .stroke();

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

    this.invoiceData.items.forEach((invoiceItem) => {
      output
        .text(invoiceItem.name, itemX, undefined, { width: itemColumnWidth })
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
    const noteX = startOfPage;
    const amountX = itemTotalX;

    // Delivery fees
    const hasDeliveryFees = this.invoiceData.items.length > 0;

    if (hasDeliveryFees) {
      output
        .moveDown(2)
        .font('Helvetica-Bold')
        .text('Ongkir', startOfPage)
        .font('Helvetica');
    }

    this.invoiceData.deliveryFees.forEach((fee) => {
      output
        .text(fee.note, noteX)
        .moveUp()
        .text(rupiah(fee.amount), amountX, undefined, { align: 'right' });
    });

    // Additional fees
    const hasAdditionalFees = this.invoiceData.additionalFees.length > 0;

    if (hasAdditionalFees) {
      output
        .moveDown(2)
        .font('Helvetica-Bold')
        .text('Penambahan', startOfPage)
        .font('Helvetica');
    }

    this.invoiceData.additionalFees.forEach((fee) => {
      output
        .text(fee.note, noteX)
        .moveUp()
        .text(rupiah(fee.amount), amountX, undefined, { align: 'right' });
    });

    // Discounts
    const hasDiscounts = this.invoiceData.discounts.length > 0;
    if (hasDiscounts) {
      output
        .moveDown(2)
        .font('Helvetica-Bold')
        .text('Pengurangan', startOfPage)
        .font('Helvetica');
    }

    this.invoiceData.discounts.forEach((discount) => {
      output
        .text(discount.note, noteX)
        .moveUp()
        .text(rupiah(discount.amount), amountX, undefined, { align: 'right' });
    });

    const grandTotal =
      this.invoiceData.items.reduce((total, item) => total + item.total, 0) +
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

    output.text(`Total: ${rupiah(grandTotal)}`, startOfPage, undefined, {
      align: 'center',
    });

    output.end();
  }
}

export default InvoiceGenerator;
