declare module 'crypto-js' {
  interface WordArray {
    toString(encoder?: any): string;
  }

  export function SHA256(message: string): WordArray;
  
  export function MD5(message: string): WordArray;
  
  export function HmacSHA256(message: string, key: string): WordArray;
  
  export function AES(message: string): WordArray;
  
  export const enc: {
    Hex: any;
    Latin1: any;
    Utf8: any;
    Utf16: any;
    Base64: any;
  };
  
  export default {
    SHA256,
    MD5,
    HmacSHA256,
    AES,
    enc
  };
} 