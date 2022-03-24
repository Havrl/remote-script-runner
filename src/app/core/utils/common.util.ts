/**
 * Generates a UUID, compliant with RFC4122 version 4.
 */
 export const uniqueId = () =>
 (([1e7] as any) + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c: number) => {
   // Local IE11 fix
   const crypto = window.crypto || (window as any).msCrypto;
   // tslint:disable-next-line:no-bitwise
   return (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16);
 })
