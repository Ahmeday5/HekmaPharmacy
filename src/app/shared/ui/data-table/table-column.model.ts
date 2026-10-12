export interface TableColumn<T> {
  /** مفتاح العمود — بيستخدم كمان لربط template مخصص: <ng-template appTableCell="key"> */
  key: string;
  header: string;
  /** قيمة الخلية لو مفيش template مخصص (الافتراضي: row[key]) */
  value?: (row: T) => string | number | null | undefined;
  /** يمنع كسر النص (للأكواد والأرقام والتواريخ) */
  nowrap?: boolean;
}
