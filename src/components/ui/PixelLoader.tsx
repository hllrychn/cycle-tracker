// Pixel lace loader — inspired by teal/white pixel mosaic lace patterns.
// A ring of small square clusters (cross motifs + wing pixels) rotates
// in discrete steps, like a single tile peeled off the lace grid.

interface Props {
  size?:  number;
  color?: string;
}

const OUTER_COUNT = 12;
const GAP         = 3;   // invisible trailing gap

export function PixelLoader({ size = 56, color = 'var(--color-moss-base)' }: Props) {
  const cx  = size / 2;
  const cy  = size / 2;
  const u   = Math.max(2, Math.round(size * 0.058)); // one "pixel" unit
  const outerR = size * 0.37;
  const innerR = size * 0.21;

  // ── Outer ring: 12 lace nodes ──────────────────────────────────────────
  // Alternating shapes: cross (5 squares) and stem (3 squares)
  const outerNodes = Array.from({ length: OUTER_COUNT }, (_, i) => {
    const angle   = (i / OUTER_COUNT) * Math.PI * 2 - Math.PI / 2;
    const nx      = cx + outerR * Math.cos(angle);
    const ny      = cy + outerR * Math.sin(angle);
    const visible = i < OUTER_COUNT - GAP;
    const opacity = visible ? 0.14 + (i / (OUTER_COUNT - GAP - 1)) * 0.86 : 0;

    // Radial unit vectors
    const rx = Math.cos(angle), ry = Math.sin(angle); // outward
    const px = -ry,             py = rx;               // perpendicular (clockwise)

    // Base: 3 squares along the radial axis (outward, center, inward)
    const squares: { x: number; y: number }[] = [
      { x: nx,             y: ny             },
      { x: nx + rx * u,    y: ny + ry * u    },
      { x: nx - rx * u,    y: ny - ry * u    },
    ];

    // Every other node gets perpendicular "wings" → cross/flower shape
    if (i % 2 === 0) {
      squares.push(
        { x: nx + px * u,  y: ny + py * u  },
        { x: nx - px * u,  y: ny - py * u  },
      );
      // Extra outer tip for the wing — 2×1 pixel arm
      squares.push(
        { x: nx + rx * u + px * u, y: ny + ry * u + py * u },
        { x: nx + rx * u - px * u, y: ny + ry * u - py * u },
      );
    } else {
      // Non-wing nodes: add a single outward accent square
      squares.push({ x: nx + rx * 2 * u, y: ny + ry * 2 * u });
    }

    return { squares, opacity };
  });

  // ── Inner ring: small connector pixels between outer nodes ─────────────
  const innerDots = Array.from({ length: OUTER_COUNT }, (_, i) => {
    const angle   = ((i + 0.5) / OUTER_COUNT) * Math.PI * 2 - Math.PI / 2;
    const visible = i < OUTER_COUNT - GAP;
    const opacity = visible ? 0.08 + (i / (OUTER_COUNT - GAP - 1)) * 0.3 : 0;
    return {
      x: cx + innerR * Math.cos(angle),
      y: cy + innerR * Math.sin(angle),
      opacity,
    };
  });

  // ── Center motif: static 5-pixel cross (lace anchor) ───────────────────
  const centerPixels = [
    [0, 0], [u, 0], [-u, 0], [0, u], [0, -u],
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="pixel-loader"
      aria-label="Loading"
      role="status"
    >
      {/* Center cross — static, very dim */}
      {centerPixels.map(([dx, dy], i) => (
        <rect
          key={i}
          x={Math.round(cx + dx - u / 2)}
          y={Math.round(cy + dy - u / 2)}
          width={u} height={u}
          fill={color} opacity={0.1}
        />
      ))}

      {/* Inner connector dots */}
      {innerDots.map((d, i) => (
        <rect
          key={i}
          x={Math.round(d.x - u / 2)}
          y={Math.round(d.y - u / 2)}
          width={u} height={u}
          fill={color} opacity={d.opacity}
        />
      ))}

      {/* Outer lace nodes */}
      {outerNodes.map((node, i) => (
        <g key={i} opacity={node.opacity}>
          {node.squares.map((s, j) => (
            <rect
              key={j}
              x={Math.round(s.x - u / 2)}
              y={Math.round(s.y - u / 2)}
              width={u} height={u}
              fill={color}
            />
          ))}
        </g>
      ))}
    </svg>
  );
}
