
// Type definitions for pdf-parse for reading PDF files in Node.js
declare module "pdf-parse" {
  function pdf(dataBuffer: Buffer | Uint8Array, options?: any): Promise<{
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    version: string;
    text: string;
  }>;
  export = pdf;
}
