export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export enum ElementType {
  TEXT = 'text',
  IMAGE = 'image',
  TABLE = 'table',
  HEADER = 'header',
  FOOTER = 'footer',
  PAGE_NUMBER = 'pageNumber'
}

export interface ElementStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
  backgroundColor?: string;
  border?: string;
  borderStyle?: string;
  padding?: number;
  zIndex?: number;
  // Table specific
  borderColor?: string;
  borderWidth?: number;
  rowHeight?: number; // Table row height
  headerHeight?: number; // Table header height
}

export interface TableColumn {
  field: string;
  header: string;
  width: number;
}

export interface PrintElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string; // For text/image url
  variable?: string;
  data?: any[]; // For table
  columns?: TableColumn[]; // For table
  style: ElementStyle;
}

export interface Page {
  id: string;
  elements: PrintElement[];
}

export interface DesignerState {
  pages: Page[];
  currentPageIndex: number;
  selectedElementId: string | null;
  selectedElementIds: string[];
  selectedGuideId: string | null;
  canvasSize: Size; // A4 usually
  zoom: number;
  isDragging: boolean;
  showGrid: boolean;
  guides: Guide[];
  historyPast: Page[][];
  historyFuture: Page[][];
}

export interface Guide {
  id: string;
  type: 'horizontal' | 'vertical';
  position: number; // pixel position
}

// Dynamic properties schema for element-specific fields
export interface PropertyFieldOption {
  label: string;
  value: string | number;
}

export interface PropertyField {
  label: string;
  type: 'number' | 'text' | 'textarea' | 'color' | 'action' | 'select';
  target: 'element' | 'style' | 'data';
  key?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  actionName?: string;
  options?: PropertyFieldOption[];
}

export interface PropertySection {
  title: string;
  fields: PropertyField[];
}

export interface ElementPropertiesSchema {
  sections: PropertySection[];
}
