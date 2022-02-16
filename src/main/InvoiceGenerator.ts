import PDFGenerator from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';

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
      .text('RUMAH SEHAT')
      .moveDown()
      .fontSize(25)
      .fillColor('#000')
      .text('INVOICE', { width: headerHalfWidth })
      .fontSize(15)
      .text(`Kepada: ${this.invoiceData.name}`, { width: headerHalfWidth })
      .moveUp()
      .text(
        'Bayar ke Ibu Fenty Effendi Wowo wowo wowwo woowowo wowo owowow ow',
        headerHalfWidth,
        undefined,
        { align: 'right' }
      );

    output.moveTo(startOfPage, 250).lineTo(endOfPage, 250).stroke();

    // Table
    const itemX = startOfPage;
    const priceX = itemX + 250;
    const qtyX = priceX + 100;
    const itemTotalX = qtyX + 50;

    output
      .text('Item', itemX)
      .moveUp()
      .text('Price', priceX)
      .moveUp()
      .text('Qty', qtyX)
      .moveUp()
      .text('Amount', itemTotalX)
      .moveDown();

    this.invoiceData.items.forEach((invoiceItem) => {
      output
        .text(invoiceItem.name, itemX)
        .moveUp()
        .text(invoiceItem.price.toString(), priceX)
        .moveUp()
        .text(invoiceItem.qty.toString(), qtyX)
        .moveUp()
        .text(invoiceItem.total.toString(), itemTotalX);
    });
    const noteX = startOfPage;
    const amountX = itemTotalX;

    // Delivery fees
    const hasDeliveryFees = this.invoiceData.items.length > 0;

    if (hasDeliveryFees) {
      output
        .moveDown(2)
        .text('Ongkir', startOfPage)
        .text('Note', noteX)
        .moveUp()
        .text('Amount', amountX);
    }

    this.invoiceData.deliveryFees.forEach((fee) => {
      output
        .text(fee.note, noteX)
        .moveUp()
        .text(fee.amount.toString(), amountX);
    });

    // Additional fees
    const hasAdditionalFees = this.invoiceData.additionalFees.length > 0;

    if (hasAdditionalFees) {
      output
        .moveDown(2)
        .text('Penambahan', startOfPage)
        .text('Note', startOfPage)
        .moveUp()
        .text('Amount', amountX);
    }

    this.invoiceData.additionalFees.forEach((fee) => {
      output
        .text(fee.note, noteX)
        .moveUp()
        .text(fee.amount.toString(), amountX);
    });

    // Discounts
    const hasDiscounts = this.invoiceData.discounts.length > 0;
    if (hasDiscounts) {
      output
        .moveDown(2)
        .text('Pengurangan', startOfPage)
        .text('Note', startOfPage)
        .moveUp()
        .text('Amount', amountX);
    }

    this.invoiceData.discounts.forEach((discount, i) => {
      output
        .text(discount.note, noteX)
        .moveUp()
        .text(discount.amount.toString(), amountX);
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

    output.text(`Total: ${grandTotal}`, startOfPage, undefined, {
      align: 'center',
    });

    output.end();
  }
}

export default InvoiceGenerator;
