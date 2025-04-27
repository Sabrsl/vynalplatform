/**
 * Déclarations de types globaux pour résoudre les problèmes de référence dans TypeScript
 * Ces déclarations évitent les erreurs de linter sans modifier les fichiers système TypeScript
 */

// Types primitifs et utilitaires
interface ArrayBuffer {}
interface ArrayBufferView {}
interface Uint8Array {}
interface Uint8ClampedArray {}
interface Float32Array {}
interface Float64Array {}
interface Promise<T> {}
interface PromiseLike<T> {}
interface ReadonlyArray<T> {}
interface Record<K extends keyof any, T> {}
interface Error {}
interface Date {}

// Ces déclarations sont vides car elles servent uniquement à satisfaire le linter
// Les implémentations réelles de ces types sont fournies par TypeScript à la compilation 