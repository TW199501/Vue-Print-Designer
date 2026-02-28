import { v4 as uuidv4 } from 'uuid';
import { PAPER_SIZES } from '@/constants/paper';
import { ElementType, type BrandingSettings, type Page, type PrintElement, type WatermarkSettings } from '@/types';

type ElementStyleRecord = Record<string, any>;

export const DEFAULT_FONT_FAMILY = '"DFKai-SB", "BiauKai", serif';
export const DEFAULT_CANVAS_SIZE = { ...PAPER_SIZES.A4 };
export const DEFAULT_CANVAS_BACKGROUND = '#ffffff';
export const DEFAULT_UNIT: 'mm' | 'px' | 'pt' = 'mm';
export const DEFAULT_HEADER_HEIGHT = 100;
export const DEFAULT_FOOTER_HEIGHT = 100;

export const DEFAULT_WATERMARK: WatermarkSettings = {
  enabled: false,
  text: '',
  angle: -30,
  color: '#000000',
  opacity: 0.1,
  size: 24,
  density: 160
};

export const DEFAULT_BRANDING: BrandingSettings = {
  title: '',
  logoUrl: '',
  showTitle: true,
  showLogo: true
};

const COMMON_STYLE_DEFAULTS: ElementStyleRecord = {
  zIndex: 1,
  rotate: 0
};

const TYPOGRAPHY_STYLE_DEFAULTS: ElementStyleRecord = {
  fontFamily: DEFAULT_FONT_FAMILY,
  fontSize: 14,
  fontWeight: '400',
  fontStyle: 'normal',
  textAlign: 'left',
  textDecoration: 'none',
  color: '#000000',
  backgroundColor: 'transparent',
  padding: 0,
  writingMode: 'horizontal-tb'
};

const ELEMENT_SIZE_DEFAULTS: Record<ElementType, { width: number; height: number }> = {
  [ElementType.TEXT]: { width: 200, height: 100 },
  [ElementType.IMAGE]: { width: 200, height: 100 },
  [ElementType.TABLE]: { width: 200, height: 150 },
  [ElementType.PAGE_NUMBER]: { width: 52, height: 20 },
  [ElementType.BARCODE]: { width: 200, height: 80 },
  [ElementType.QRCODE]: { width: 100, height: 100 },
  [ElementType.LINE]: { width: 200, height: 20 },
  [ElementType.RECT]: { width: 100, height: 100 },
  [ElementType.CIRCLE]: { width: 100, height: 100 }
};

const ELEMENT_STYLE_DEFAULTS: Record<ElementType, ElementStyleRecord> = {
  [ElementType.TEXT]: {
    ...TYPOGRAPHY_STYLE_DEFAULTS
  },
  [ElementType.IMAGE]: {
    backgroundColor: 'transparent',
    borderStyle: 'none',
    borderWidth: 0,
    borderColor: '#000000'
  },
  [ElementType.TABLE]: {
    ...TYPOGRAPHY_STYLE_DEFAULTS,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000000',
    rowHeight: 30,
    headerHeight: 40,
    footerHeight: 30,
    headerBackgroundColor: '#f3f4f6',
    footerBackgroundColor: '#f9fafb',
    headerColor: '#000000',
    footerColor: '#000000',
    headerFontSize: 14,
    footerFontSize: 14
  },
  [ElementType.PAGE_NUMBER]: {
    ...TYPOGRAPHY_STYLE_DEFAULTS
  },
  [ElementType.BARCODE]: {
    color: '#000000',
    barcodeFormat: 'CODE128',
    showText: true,
    barcodeWidth: 2,
    barcodeHeight: 40,
    textPosition: 'bottom',
    textAlign: 'center',
    margin: 0,
    fontSize: 20
  },
  [ElementType.QRCODE]: {
    color: '#000000',
    qrErrorCorrection: 'M'
  },
  [ElementType.LINE]: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000000'
  },
  [ElementType.RECT]: {
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 0
  },
  [ElementType.CIRCLE]: {
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000000'
  }
};

const PAGE_NUMBER_DEFAULTS: Partial<PrintElement> = {
  format: '1/Total',
  labelText: '',
  labelPosition: 'before',
  labelFontSize: 14,
  labelColor: '#000000',
  labelFontFamily: DEFAULT_FONT_FAMILY,
  labelFontWeight: '400',
  labelBackgroundColor: 'transparent',
  labelBorderStyle: 'none',
  labelBorderWidth: 0,
  labelBorderColor: '#000000'
};

const DEFAULT_CONTENT_BY_TYPE: Partial<Record<ElementType, string>> = {
  [ElementType.TEXT]: '',
  [ElementType.IMAGE]: '',
  [ElementType.BARCODE]: '12345678',
  [ElementType.QRCODE]: 'https://example.com'
};

const ELEMENT_TYPES = new Set(Object.values(ElementType));

const toFiniteNumber = (value: unknown, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const toPositiveNumber = (value: unknown, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const normalizeUnit = (unit: unknown): 'mm' | 'px' | 'pt' => {
  if (unit === 'mm' || unit === 'px' || unit === 'pt') {
    return unit;
  }
  return DEFAULT_UNIT;
};

export const normalizeCanvasSize = (size: any) => {
  const width = toPositiveNumber(size?.width, DEFAULT_CANVAS_SIZE.width);
  const height = toPositiveNumber(size?.height, DEFAULT_CANVAS_SIZE.height);
  return {
    width: Math.round(width),
    height: Math.round(height)
  };
};

export const normalizeWatermark = (watermark: any): WatermarkSettings => {
  if (!watermark || typeof watermark !== 'object') {
    return { ...DEFAULT_WATERMARK };
  }
  return {
    ...DEFAULT_WATERMARK,
    ...watermark
  };
};

export const getElementSizeDefaults = (type: ElementType) => {
  return ELEMENT_SIZE_DEFAULTS[type] || ELEMENT_SIZE_DEFAULTS[ElementType.TEXT];
};

export const getElementStyleDefaults = (type: ElementType): ElementStyleRecord => {
  return {
    ...COMMON_STYLE_DEFAULTS,
    ...(ELEMENT_STYLE_DEFAULTS[type] || {})
  };
};

export const applyElementDefaults = <T extends Partial<PrintElement>>(rawElement: T): T => {
  const source = (rawElement && typeof rawElement === 'object') ? rawElement : ({} as T);
  const type = ELEMENT_TYPES.has(source.type as ElementType)
    ? (source.type as ElementType)
    : ElementType.TEXT;

  const sizeDefaults = getElementSizeDefaults(type);
  const styleDefaults = getElementStyleDefaults(type);
  const sourceStyle = (source.style && typeof source.style === 'object') ? (source.style as ElementStyleRecord) : {};

  const normalized: PrintElement = {
    ...(source as PrintElement),
    type,
    x: Math.round(toFiniteNumber(source.x, 0)),
    y: Math.round(toFiniteNumber(source.y, 0)),
    width: Math.round(toPositiveNumber(source.width, sizeDefaults.width)),
    height: Math.round(toPositiveNumber(source.height, sizeDefaults.height)),
    variable: typeof source.variable === 'string' ? source.variable : '',
    locked: source.locked === true,
    style: {
      ...styleDefaults,
      ...sourceStyle
    }
  };

  if (normalized.content === undefined && DEFAULT_CONTENT_BY_TYPE[type] !== undefined) {
    normalized.content = DEFAULT_CONTENT_BY_TYPE[type];
  }

  if (type === ElementType.PAGE_NUMBER) {
    Object.entries(PAGE_NUMBER_DEFAULTS).forEach(([key, value]) => {
      if ((normalized as any)[key] === undefined) {
        (normalized as any)[key] = value;
      }
    });
  }

  if (type === ElementType.TABLE) {
    if (normalized.autoPaginate === undefined) {
      normalized.autoPaginate = true;
    }
    if (normalized.tfootRepeat === undefined) {
      normalized.tfootRepeat = true;
    }
    if (normalized.showFooter === undefined) {
      normalized.showFooter = true;
    }
  }

  return normalized as T;
};

export const createDefaultPage = (): Page => ({
  id: uuidv4(),
  elements: []
});

export const applyPageDefaults = (page: any): Page => {
  const rawElements = Array.isArray(page?.elements) ? page.elements : [];
  const elements = rawElements
    .filter((element: any) => element && typeof element === 'object')
    .map((element: Partial<PrintElement>) => {
      const normalized = applyElementDefaults(element);
      return {
        ...(normalized as PrintElement),
        id: (normalized as PrintElement).id || uuidv4()
      };
    });

  return {
    id: (typeof page?.id === 'string' && page.id) ? page.id : uuidv4(),
    elements
  };
};

export const applyPagesDefaults = (pages: any): Page[] => {
  if (!Array.isArray(pages) || pages.length === 0) {
    return [createDefaultPage()];
  }

  const normalizedPages = pages
    .filter((page: any) => page && typeof page === 'object')
    .map((page: any) => applyPageDefaults(page));

  if (normalizedPages.length === 0) {
    return [createDefaultPage()];
  }

  return normalizedPages;
};
