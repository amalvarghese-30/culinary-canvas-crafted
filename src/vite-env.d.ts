/// <reference types="vite/client" />

declare module "*&as=picture" {
  const out: {
    sources: Record<string, string>;
    img: { src: string; w: number; h: number };
  };
  export default out;
}

declare module "*?as=picture" {
  const out: {
    sources: Record<string, string>;
    img: { src: string; w: number; h: number };
  };
  export default out;
}

declare module "*?w=400" {
  const src: string;
  export default src;
}
