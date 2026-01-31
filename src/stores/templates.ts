import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import { useDesignerStore } from './designer';

export interface Template {
  id: string;
  name: string;
  data: any;
  updatedAt: number;
}

export const useTemplateStore = defineStore('templates', {
  state: () => ({
    templates: [] as Template[],
    currentTemplateId: null as string | null,
  }),
  actions: {
    loadTemplates() {
      const stored = localStorage.getItem('print-designer-templates');
      if (stored) {
        try {
          this.templates = JSON.parse(stored);
          // Sort by updatedAt desc
          this.templates.sort((a, b) => b.updatedAt - a.updatedAt);
        } catch (e) {
          console.error('Failed to parse templates', e);
          this.templates = [];
        }
      }
    },
    
    saveToLocalStorage() {
      localStorage.setItem('print-designer-templates', JSON.stringify(this.templates));
    },

    saveCurrentTemplate(name: string) {
      const designerStore = useDesignerStore();
      const data = {
        pages: designerStore.pages,
        canvasSize: designerStore.canvasSize,
        guides: designerStore.guides,
        zoom: designerStore.zoom,
        showGrid: designerStore.showGrid,
        headerHeight: designerStore.headerHeight,
        footerHeight: designerStore.footerHeight,
        showHeaderLine: designerStore.showHeaderLine,
        showFooterLine: designerStore.showFooterLine,
        showMinimap: designerStore.showMinimap,
        canvasBackground: designerStore.canvasBackground,
        // Add other necessary state here
      };

      if (this.currentTemplateId) {
        // Update existing
        const index = this.templates.findIndex(t => t.id === this.currentTemplateId);
        if (index !== -1) {
          this.templates[index].data = data;
          this.templates[index].name = name; // Update name just in case
          this.templates[index].updatedAt = Date.now();
        } else {
          // ID exists but not found? Treat as new.
          this.createTemplate(name, data);
        }
      } else {
        // Create new
        this.createTemplate(name, data);
      }
      this.saveToLocalStorage();
    },

    createTemplate(name: string, data?: any) {
      const designerStore = useDesignerStore();
      const newData = data || {
        pages: designerStore.pages,
        canvasSize: designerStore.canvasSize,
        // ... capture current state if data not provided
      };
      
      const newTemplate: Template = {
        id: uuidv4(),
        name,
        data: newData,
        updatedAt: Date.now()
      };
      
      this.templates.unshift(newTemplate);
      this.currentTemplateId = newTemplate.id;
      this.saveToLocalStorage();
    },

    deleteTemplate(id: string) {
      this.templates = this.templates.filter(t => t.id !== id);
      if (this.currentTemplateId === id) {
        this.currentTemplateId = null;
      }
      this.saveToLocalStorage();
    },

    renameTemplate(id: string, newName: string) {
      const t = this.templates.find(t => t.id === id);
      if (t) {
        t.name = newName;
        t.updatedAt = Date.now();
        this.saveToLocalStorage();
      }
    },

    copyTemplate(id: string) {
      const t = this.templates.find(t => t.id === id);
      if (t) {
        const newTemplate: Template = {
          id: uuidv4(),
          name: `${t.name} Copy`,
          data: JSON.parse(JSON.stringify(t.data)),
          updatedAt: Date.now()
        };
        this.templates.unshift(newTemplate);
        this.saveToLocalStorage();
      }
    },

    loadTemplate(id: string) {
      const t = this.templates.find(t => t.id === id);
      if (t) {
        const designerStore = useDesignerStore();
        const data = t.data;
        
        // Restore state
        if (data.pages) designerStore.pages = data.pages;
        if (data.canvasSize) designerStore.canvasSize = data.canvasSize;
        if (data.guides) designerStore.guides = data.guides;
        if (data.zoom !== undefined) designerStore.zoom = data.zoom;
        if (data.showGrid !== undefined) designerStore.showGrid = data.showGrid;
        if (data.headerHeight !== undefined) designerStore.headerHeight = data.headerHeight;
        if (data.footerHeight !== undefined) designerStore.footerHeight = data.footerHeight;
        if (data.showHeaderLine !== undefined) designerStore.showHeaderLine = data.showHeaderLine;
        if (data.showFooterLine !== undefined) designerStore.showFooterLine = data.showFooterLine;
        if (data.showMinimap !== undefined) designerStore.showMinimap = data.showMinimap;
        if (data.canvasBackground !== undefined) designerStore.canvasBackground = data.canvasBackground;
        
        // Reset selection and history
        designerStore.selectedElementId = null;
        designerStore.selectedGuideId = null;
        designerStore.historyPast = [];
        designerStore.historyFuture = [];
        
        this.currentTemplateId = id;
      }
    }
  }
});
