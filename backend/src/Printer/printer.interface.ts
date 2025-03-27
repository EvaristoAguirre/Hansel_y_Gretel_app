export interface PrintOptions {
  font?: 'A' | 'B';
  align?: 'LT' | 'CT' | 'RT';
  style?: 'NORMAL' | 'B' | 'I' | 'U';
  width?: number;
  height?: number;
  cut?: boolean;
}