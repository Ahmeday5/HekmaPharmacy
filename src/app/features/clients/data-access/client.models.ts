export interface Client {
  id: number;
  clientCode: string;
  name: string;
  phoneNumber: string;
  phoneNumber02: string;
  address: string;
  address02: string;
  /** رابط الموقع على الخريطة */
  location: string;
}

export type ClientPayload = Omit<Client, 'id'>;

export type ClientFilters = {
  name: string;
};
