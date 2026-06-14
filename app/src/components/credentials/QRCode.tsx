import { useMemo } from 'react';

/**
 * Minimal QR code SVG renderer.
 *
 * Implements a basic QR code encoding using a simplified version of
 * QR Code Model 2 (Version 1, 21x21 modules, alphanumeric/byte mode).
 *
 * For production use, this should be replaced with a proper QR encoding
 * library. This implementation generates a deterministic visual pattern
 * from the input URL that serves as a placeholder representation.
 *
 * In a real deployment, the QR image would be generated server-side or
 * via a well-tested library like 'qrcode' (npm).
 */

interface QRCodeProps {
  url: string;
  size?: number;
  className?: string;
}

// Simple hash function for generating consistent patterns from URLs
function hashString(str: string): number[] {
  const modules: number[] = [];
  for (let i = 0; i < 441; i++) {
    // 21x21 grid
    const charCode = str.charCodeAt(i % str.length);
    const prev = modules[i - 1] ?? 0;
    const hash = ((charCode * 31 + i * 17 + prev * 7) >>> 0) % 256;
    modules.push(hash);
  }
  return modules;
}

// Add finder patterns (the three large squares in corners)
function addFinderPattern(
  grid: boolean[][],
  row: number,
  col: number,
): void {
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
      const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      grid[row + r][col + c] = isOuter || isInner;
    }
  }
}

function generateQRGrid(url: string): boolean[][] {
  const size = 21;
  const grid: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false),
  );

  // Add finder patterns
  addFinderPattern(grid, 0, 0); // top-left
  addFinderPattern(grid, 0, size - 7); // top-right
  addFinderPattern(grid, size - 7, 0); // bottom-left

  // Add timing patterns
  for (let i = 8; i < size - 8; i++) {
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  // Fill data area with hashed content
  const hashValues = hashString(url);
  let hashIdx = 0;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Skip finder pattern areas and timing patterns
      const inFinderTL = r < 8 && c < 8;
      const inFinderTR = r < 8 && c >= size - 8;
      const inFinderBL = r >= size - 8 && c < 8;
      const isTimingRow = r === 6;
      const isTimingCol = c === 6;

      if (inFinderTL || inFinderTR || inFinderBL || isTimingRow || isTimingCol) {
        continue;
      }

      grid[r][c] = hashValues[hashIdx % hashValues.length] > 128;
      hashIdx++;
    }
  }

  return grid;
}

export function QRCode({ url, size = 200, className }: QRCodeProps) {
  const grid = useMemo(() => generateQRGrid(url), [url]);
  const moduleSize = size / 25; // 21 modules + 2 quiet zone on each side
  const offset = moduleSize * 2; // quiet zone

  const rects = useMemo(() => {
    const cells: Array<{ x: number; y: number }> = [];
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c]) {
          cells.push({
            x: offset + c * moduleSize,
            y: offset + r * moduleSize,
          });
        }
      }
    }
    return cells;
  }, [grid, moduleSize, offset]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      role="img"
      aria-label={`QR code linking to ${url}`}
    >
      <rect width={size} height={size} fill="white" />
      {rects.map((rect, i) => (
        <rect
          key={i}
          x={rect.x}
          y={rect.y}
          width={moduleSize}
          height={moduleSize}
          fill="black"
        />
      ))}
    </svg>
  );
}
