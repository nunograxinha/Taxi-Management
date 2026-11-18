export interface Price {
  _id?: string;
  pricePerMinuteConfort: number;
  pricePerMinuteLuxury: number;
  nightTimeSurcharge: number;
  createdAt?: string;
  updatedAt?: string;
}
