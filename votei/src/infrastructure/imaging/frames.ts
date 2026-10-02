import { findCargo, type ComposeSpec } from '@/core/compose/entities/composition';
import { findFrame, type Frame } from '@/core/compose/entities/frame';

/**
 * Satori element tree. Satori takes a React-shaped object, so we build the
 * tree by hand and keep React out of the server render path entirely.
 */
export interface SatoriNode {
  type: string;
  props: {
    style?: Record<string, unknown>;
    children?: SatoriNode[] | string;
  };
}

const BASE = 1080;

function node(
  type: string,
  style: Record<string, unknown>,
  children?: SatoriNode[] | string
): SatoriNode {
  return { type, props: { style, children } };
}

function ringBackground(frame: Frame): Record<string, unknown> {
  const { ring, ringAlt } = frame.palette;
  switch (frame.motif) {
    case 'gradient':
      return { backgroundImage: `linear-gradient(135deg, ${ring} 0%, ${ringAlt} 100%)` };
    case 'stripes':
      return {
        backgroundImage: `linear-gradient(90deg, ${ring} 0%, ${ringAlt} 50%, ${ring} 100%)`,
      };
    case 'flag':
    case 'solid':
    default:
      return { backgroundColor: ring };
  }
}

/**
 * Four bars rather than a CSS border: a border cannot carry a gradient, and
 * the centre has to stay transparent for the photo underneath.
 */
function ringBars(frame: Frame, thickness: number): SatoriNode[] {
  const fill = ringBackground(frame);
  return [
    node('div', { position: 'absolute', top: 0, left: 0, right: 0, height: thickness, ...fill }),
    node('div', { position: 'absolute', bottom: 0, left: 0, right: 0, height: thickness, ...fill }),
    node('div', {
      position: 'absolute',
      top: thickness,
      bottom: thickness,
      left: 0,
      width: thickness,
      ...fill,
    }),
    node('div', {
      position: 'absolute',
      top: thickness,
      bottom: thickness,
      right: 0,
      width: thickness,
      ...fill,
    }),
  ];
}

/** Inner accent line. On the flag motif this is what makes it read as a flag. */
function innerRing(frame: Frame, offset: number, thickness: number): SatoriNode {
  const color = frame.motif === 'flag' ? frame.palette.ringAlt : frame.palette.accent;
  return node('div', {
    position: 'absolute',
    top: offset,
    left: offset,
    right: offset,
    bottom: offset,
    borderWidth: thickness,
    borderStyle: 'solid',
    borderColor: color,
    opacity: frame.motif === 'flag' ? 1 : 0.55,
  });
}

function banner(frame: Frame, spec: ComposeSpec, scale: number): SatoriNode {
  const px = (n: number) => Math.round(n * scale);
  const cargo = findCargo(spec.cargo);
  const hasNome = Boolean(spec.nome);

  const headline = node(
    'div',
    {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    [
      node(
        'div',
        {
          fontFamily: 'Inter',
          fontWeight: 700,
          fontSize: px(58),
          letterSpacing: px(4),
          color: frame.palette.bannerText,
          marginRight: px(20),
        },
        'VOTEI'
      ),
      node(
        'div',
        {
          fontFamily: 'Anton',
          fontSize: px(132),
          lineHeight: 1,
          color: frame.palette.accent,
          letterSpacing: px(2),
        },
        spec.numero
      ),
    ]
  );

  const children: SatoriNode[] = [headline];

  if (hasNome) {
    children.push(
      node(
        'div',
        {
          fontFamily: 'Inter',
          fontWeight: 500,
          fontSize: px(34),
          letterSpacing: px(3),
          color: frame.palette.bannerText,
          opacity: 0.92,
          marginTop: px(2),
        },
        `${spec.nome!.toUpperCase()}${cargo ? ` · ${cargo.label.toUpperCase()}` : ''}`
      )
    );
  }

  return node(
    'div',
    {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: px(hasNome ? 268 : 216),
      backgroundColor: frame.palette.banner,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: px(hasNome ? 14 : 8),
    },
    children
  );
}

/**
 * Tiled diagonal mark on the free preview. The preview is rendered on the
 * server for exactly this reason: a client-side watermark is a suggestion.
 */
function watermarkLayer(scale: number): SatoriNode {
  const px = (n: number) => Math.round(n * scale);
  const rows: SatoriNode[] = [];

  for (let i = 0; i < 9; i += 1) {
    rows.push(
      node(
        'div',
        {
          fontFamily: 'Inter',
          fontWeight: 700,
          fontSize: px(46),
          letterSpacing: px(6),
          color: '#FFFFFF',
          opacity: 0.34,
          marginBottom: px(44),
          whiteSpace: 'nowrap',
        },
        'VOTEI.APP  ·  VOTEI.APP  ·  VOTEI.APP'
      )
    );
  }

  return node(
    'div',
    {
      position: 'absolute',
      top: px(-220),
      left: px(-260),
      right: px(-260),
      bottom: px(-220),
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      transform: 'rotate(-28deg)',
    },
    rows
  );
}

export function buildFrameTree(params: {
  spec: ComposeSpec;
  size: number;
  watermark: boolean;
}): SatoriNode {
  const frame = findFrame(params.spec.frameId);
  if (!frame) throw new Error(`Unknown frame: ${params.spec.frameId}`);

  const scale = params.size / BASE;
  const px = (n: number) => Math.round(n * scale);
  const thickness = px(26);

  const children: SatoriNode[] = [
    ...ringBars(frame, thickness),
    innerRing(frame, thickness + px(12), Math.max(2, px(8))),
    banner(frame, params.spec, scale),
  ];

  if (params.watermark) children.push(watermarkLayer(scale));

  return node(
    'div',
    {
      position: 'relative',
      width: params.size,
      height: params.size,
      display: 'flex',
    },
    children
  );
}
