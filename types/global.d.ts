declare module "*.css";

declare module "next" {
  export type Metadata = Record<string, any>;
}

// Note: `next/image` types removed to avoid requiring Next.js packages.

declare module "react" {
  export * from "types/react";
}

declare module "react/jsx-runtime" {
  export * from "types/jsx-runtime";
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

declare module "framer-motion" {
  export * from "types/framer-motion";
}

declare module "lucide-react" {
  export * from "types/lucide-react";
}
