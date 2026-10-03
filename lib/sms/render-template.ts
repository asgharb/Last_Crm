import DateObject from "react-date-object";
import gregorian from "react-date-object/calendars/gregorian";
import persian from "react-date-object/calendars/persian";
import gregorian_fa from "react-date-object/locales/gregorian_fa";
import persian_fa from "react-date-object/locales/persian_fa";

export type SmsPlaceholderDefinition = { token: string; customerField: string };
export type SmsCustomerData = {
  firstName: string;
  lastName: string;
  isActive: boolean;
  customerCode: number;
  mobile: string;
  birthDate: Date | null;
  customerClass: string;
  province: string | null;
  city: string | null;
  fatherName: string | null;
  tags: { tag: { name: string } }[];
};

const classLabels: Record<string, string> = {
  bankdar: "بنکدار",
  wholesaler: "عمده‌فروش",
  retailer: "خرده‌فروش",
};

function birthDateToPersian(date: Date | null) {
  if (!date) return "";
  const isoDate = `${date.getUTCFullYear()}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${String(date.getUTCDate()).padStart(2, "0")}`;
  return new DateObject({ date: isoDate, format: "YYYY/MM/DD", calendar: gregorian, locale: gregorian_fa })
    .convert(persian, persian_fa)
    .format("YYYY/MM/DD");
}

function readCustomerField(field: string, customer: SmsCustomerData) {
  switch (field) {
    case "firstName + lastName": return `${customer.firstName} ${customer.lastName}`.trim();
    case "firstName": return customer.firstName;
    case "lastName": return customer.lastName;
    case "isActive": return customer.isActive ? "فعال" : "غیرفعال";
    case "customerCode": return new Intl.NumberFormat("fa-IR").format(customer.customerCode);
    case "mobile": return customer.mobile;
    case "birthDate": return birthDateToPersian(customer.birthDate);
    case "customerClass": return classLabels[customer.customerClass] ?? customer.customerClass;
    case "tags[].name": return customer.tags.map(({ tag }) => tag.name).join("، ");
    case "province": return customer.province ?? "";
    case "city": return customer.city ?? "";
    case "fatherName": return customer.fatherName ?? "";
    default: throw new Error(`SMS placeholder customerField is not supported: ${field}`);
  }
}

export function renderCustomerSms(content: string, placeholders: SmsPlaceholderDefinition[], customer: SmsCustomerData) {
  return placeholders.reduce(
    (message, placeholder) => message.split(placeholder.token).join(readCustomerField(placeholder.customerField, customer)),
    content,
  );
}
