declare module "react" {
  export type ReactNode = any;
  export type ReactElement = any;
  export function useState<S>(initialState: S | (() => S)):
    [S, (newValue: S | ((prevState: S) => S)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  export function useMemo<T>(factory: () => T, deps: any[]): T;
  export function useRef<T>(initialValue: T | null): { current: T | null };
  export type ChangeEvent<T = any> = { target: { value: any } };
  export const Fragment: any;
  const _default: any;
  export default _default;
}

declare global {
  namespace React {
    type ReactNode = any;
    type ReactElement = any;
  }
}
