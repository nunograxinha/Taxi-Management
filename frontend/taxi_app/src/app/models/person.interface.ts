export interface Person {
  _id?: string;
  name: string;
  NIF: string;
  gender: 'Male' | 'Female' | 'Non-binary';
  profilePhoto?: string | null;
}
