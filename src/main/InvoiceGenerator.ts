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
    const tableTopY = 275;

    output
      .text('Item', itemX, tableTopY)
      .text('Price', priceX, tableTopY)
      .text('Qty', qtyX, tableTopY)
      .text('Amount', itemTotalX, tableTopY)
      .moveDown();

    this.invoiceData.items.forEach((invoiceItem, i) => {
      const itemY = tableTopY + 25 + 25 * i;
      output
        .text(invoiceItem.name, itemX, itemY)
        .text(invoiceItem.price.toString(), priceX, itemY)
        .text(invoiceItem.qty.toString(), qtyX, itemY)
        .text(invoiceItem.total.toString(), itemTotalX, itemY);
    });
    const noteX = startOfPage;
    const amountX = itemTotalX;

    // Delivery fees
    const hasDeliveryFees = this.invoiceData.items.length > 0;
    const deliveryFeeTableY =
      tableTopY +
      this.invoiceData.items.length * 25 +
      25 +
      (hasDeliveryFees ? 25 : 0);

    if (hasDeliveryFees) {
      output
        .text('Ongkir', startOfPage, deliveryFeeTableY)
        .text('Note', startOfPage, deliveryFeeTableY + 25)
        .text('Amount', amountX, deliveryFeeTableY + 25);
    }

    this.invoiceData.deliveryFees.forEach((fee, i) => {
      const deliveryFeeY = deliveryFeeTableY + 25 + 25 + 25 * i;
      output
        .text(fee.note, noteX, deliveryFeeY)
        .text(fee.amount.toString(), amountX, deliveryFeeY);
    });

    // Additional fees
    const hasAdditionalFees = this.invoiceData.additionalFees.length > 0;
    const additionalFeeTableY =
      deliveryFeeTableY +
      this.invoiceData.deliveryFees.length * 25 +
      50 +
      (hasAdditionalFees ? 25 : 0);

    if (hasAdditionalFees) {
      output
        .text('Penambahan', startOfPage, additionalFeeTableY)
        .text('Note', startOfPage, additionalFeeTableY + 25)
        .text('Amount', amountX, additionalFeeTableY + 25);
    }

    this.invoiceData.additionalFees.forEach((fee, i) => {
      const additionalFeeY = additionalFeeTableY + 25 + 25 + 25 * i;
      output
        .text(fee.note, noteX, additionalFeeY)
        .text(fee.amount.toString(), amountX, additionalFeeY);
    });

    // Discounts
    const discountTableY =
      additionalFeeTableY +
      (this.invoiceData.additionalFees.length + 1) * 25 +
      50;

    output
      .text('Pengurangan', startOfPage, discountTableY)
      .text('Note', startOfPage, discountTableY + 25)
      .text('Amount', amountX, discountTableY + 25);

    this.invoiceData.discounts.forEach((discount, i) => {
      const discountY = discountTableY + 25 + 25 + 25 * i;
      output
        .text(discount.note, noteX, discountY)
        .text(discount.amount.toString(), amountX, discountY);
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

    const grandTotalY =
      discountTableY + (this.invoiceData.discounts.length + 1) * 25 + 50;

    output.text(`Total: ${grandTotal}`, startOfPage, grandTotalY, {
      align: 'center',
    });

    output.end();
  }
}

export default InvoiceGenerator;
