export type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

export type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> &
  U[keyof U];

export type LastInUnion<T> = UnionToIntersection<
  T extends any ? (arg: T) => any : never
> extends (arg: infer R) => any
  ? R
  : never;

export type UnionToTuple<T, U = T> = [T] extends [never]
  ? []
  : [...UnionToTuple<Exclude<U, LastInUnion<T>>>, LastInUnion<T>];

const EMPTY_OBJECT_KEY = Symbol("empty_object");

export type EmptyObject = {
  [EMPTY_OBJECT_KEY]?: never;
};

export type ArrayToUnion<T extends Array<any>> = T extends Array<infer I>
  ? I
  : never;
