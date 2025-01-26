// Warning: {} is not an empty object in TS!
// See a full explanation: https://www.totaltypescript.com/the-empty-object-type-in-typescript
export type EmptyObject = Record<string, never>