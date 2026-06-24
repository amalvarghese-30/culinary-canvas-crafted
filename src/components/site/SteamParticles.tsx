/** Lightweight CSS steam particles, layered behind hero content. */
export function SteamParticles({ count = 7 }: { count?: number }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[60%] overflow-hidden" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => {
        const left = `${(i / count) * 100 + (i % 2 ? 4 : -3)}%`;
        const delay = `${(i * 0.9) % 5}s`;
        const dur = `${6 + (i % 3)}s`;
        const dx = `${i % 2 ? 18 : -18}px`;
        return (
          <span
            key={i}
            className="steam"
            style={{
              left,
              ["--delay" as never]: delay,
              ["--dur" as never]: dur,
              ["--dx" as never]: dx,
            }}
          />
        );
      })}
    </div>
  );
}
