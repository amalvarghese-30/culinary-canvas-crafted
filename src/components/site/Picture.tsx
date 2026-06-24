import type { ImgHTMLAttributes } from "react";

type PictureSource = {
  srcset: string;
  type?: string;
};

type PictureImport = {
  sources: Record<string, string>;
  img: { src: string; w: number; h: number };
};

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "width" | "height"> & {
  source: PictureImport;
  alt: string;
  eager?: boolean;
  priority?: boolean;
};

/**
 * <Picture> renders AVIF + WebP + original JPEG fallback for optimal performance.
 * Pair with `?w=...&format=avif;webp;jpg&as=picture` imports from vite-imagetools.
 */
export function Picture({ source, alt, eager, priority, className, ...rest }: Props) {
  const sources: PictureSource[] = [];
  if (source.sources.avif) sources.push({ type: "image/avif", srcset: source.sources.avif });
  if (source.sources.webp) sources.push({ type: "image/webp", srcset: source.sources.webp });
  if (source.sources.jpg) sources.push({ type: "image/jpeg", srcset: source.sources.jpg });

  return (
    <picture>
      {sources.map((s) => (
        <source key={s.type} type={s.type} srcSet={s.srcset} />
      ))}
      <img
        {...rest}
        src={source.img.src}
        width={source.img.w}
        height={source.img.h}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : undefined}
        className={className}
      />
    </picture>
  );
}
