import { TransactionRow } from './TransactionFileProcessor';

export interface InvoicesObject {
  [key: string]: InvoiceData;
}

export interface InvoiceData {
  name: string;
  date: string;
  // Each item is put into array assigned into a key, grouped by supplier
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

class Invoice {
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
}

export default Invoice;
