import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { HtmlDocTemplateDisplay, HtmlDocTemplateInfo, SamplesService } from '../../providers/samples.service';
import { ConfirmService } from '../dialog-confirm/confirm.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ToastrMessagesService } from '../../providers/toastr-messages.service';
import { TranslateService } from '@ngx-translate/core';
import { SettingsService } from '../../providers/settings.service';

@Component({
  selector: 'dburst-templates-gallery-modal',
  templateUrl: './templates-gallery-modal.template.html'
})
export class TemplatesGalleryModalComponent {

  @Input() galleryTags: string[] | null = null;
  @Output() useTemplate = new EventEmitter<HtmlDocTemplateDisplay>();

  constructor(
    protected settingsService: SettingsService,
    protected messagesService: ToastrMessagesService,
    protected translateService: TranslateService,
    protected sanitizer: DomSanitizer,
    protected confirmService: ConfirmService,
    protected samplesService: SamplesService,
  ) { }

  templateSanitizedHtmlCache = new Map<string, SafeHtml>();

  // With this single state variable:
  templateGalleryState: string = 'closed'; // Possible values: 'closed', 'examples-gallery', 'hey-ai', 'readme', 'ai-prompt'

  selectedTemplateAiPrompt: string = '';
  selectedPromptType: 'modify' | 'rebuild' | null = null;
  galleryDialogTitle = 'Examples (Gallery)';

  galleryTemplates: HtmlDocTemplateDisplay[] = [];
  allAvailableTemplates: HtmlDocTemplateInfo[] = []; // Store all templates once loaded
  templatesLoaded = false;

  selectedGalleryTemplateIndex = 0;

  templatePreviewFadeState: string = 'visible';

  selectedTemplateReadme: string = '';
  previousStateBeforeReadme: any = null;
  previousStateBeforeAiPrompt: any = null;

  selectedTemplateModifyPrompt: string = '';
  selectedTemplateScratchPrompt: string = '';

  galleryAiInstructions: string = '';

  @ViewChild('templateCarousel') templateCarousel: any;


  // Component method to add
  escKeyHandler: any;

  addDialogEscapeHandler() {
    // Handle ESC key
    const escHandler = (event) => {
      if (event.key === 'Escape' && this.templateGalleryState !== 'closed') {
        this.closeTemplateGallery();
        // Remove the event listener after closing
        document.removeEventListener('keydown', escHandler);
      }
    };

    // Add event listener
    document.addEventListener('keydown', escHandler);

    // Store for cleanup if needed
    this.escKeyHandler = escHandler;
  }

  async openTemplateGallery() {
    // Reset template index
    this.selectedGalleryTemplateIndex = 0;

    // Set state to examples-gallery with instructions
    // this.templateGalleryState = 'examples-gallery';
    this.templateGalleryState = 'templates';

    // Set initial dialog header
    this.galleryDialogTitle = 'Examples (Gallery)';

    // Clear the HTML cache to ensure fresh rendering
    this.templateSanitizedHtmlCache.clear();

    // Load general AI instructions content
    //const content = await this.settingsService.loadTemplateFileAsync(
    //  'templates/gallery/readme-examples-gallery.md',
    //);

    // Set the content
    // this.galleryAiInstructions = String(content);

    // Reset examples and reload
    this.galleryTemplates = [];
    await this.loadGalleryTemplates();

    if (this.templateCarousel) {
      this.templateCarousel.page = 0;
    }
  }



  closeTemplateGallery() {
    // Simply set state to closed
    this.templateGalleryState = 'closed';

    // Clear content caches that might influence next open
    this.selectedTemplateReadme = '';
    this.selectedTemplateAiPrompt = '';
    this.previousStateBeforeReadme = null;
    this.previousStateBeforeAiPrompt = null;

    // Clear cached HTML
    this.templateSanitizedHtmlCache.clear();
  }

  closeGeneralAiInstructions() {
    if (this.templateGalleryState === 'examples-gallery') {
      this.templateGalleryState = 'templates';
      this.onGalleryTemplateSelected({ page: 0 });
    }
  }

  async onGalleryTemplateSelected(event: any): Promise<void> {
    // Update the index and template data
    this.selectedGalleryTemplateIndex = event.page;
    const currentTemplate = this.getSelectedGalleryTemplate();

    if (!currentTemplate) return;

    // Update dialog header
    this.galleryDialogTitle = `Examples (Gallery) - ${currentTemplate.name || currentTemplate.displayName}`;

    if (this.selectedGalleryTemplateIndex === event.page) {
      return;
    }

    // First hide the current content
    this.templatePreviewFadeState = 'hidden';

    // Update display information
    this.updateGalleryTemplateVariantInfo(currentTemplate);
    this.selectedTemplateReadme = currentTemplate.readmeContent || '';
    this.selectedTemplateModifyPrompt =
      currentTemplate.selectedTemplateModifyPrompt || '';
    this.selectedTemplateScratchPrompt =
      currentTemplate.selectedTemplateScratchPrompt || '';

    // After a short delay, show the new content and force rescale
    setTimeout(() => {
      this.templatePreviewFadeState = 'visible';
      setTimeout(() => {
        // This will ensure scaling is recalculated
        window.dispatchEvent(new Event('resize'));
      }, 50);
    }, 100);
  }

  getSelectedGalleryTemplate(): HtmlDocTemplateDisplay {
    if (!this.galleryTemplates || this.galleryTemplates.length === 0) {
      return null;
    }

    const template =
      this.galleryTemplates[this.selectedGalleryTemplateIndex || 0];

    // Update display name for multi-file templates
    if (template?.originalTemplate?.templateFilePaths?.length > 1) {
      const total = template.originalTemplate.templateFilePaths.length;
      const current = template.collectionIndex || 1;
      template.displayName = `${template.name} (${current} of ${total})`;
    }

    return template;
  }


  useSelectedTemplate(template: HtmlDocTemplateDisplay) {
    if (
      !template ||
      !template.htmlContent ||
      template.htmlContent.length === 0
    ) {
      return;
    }

    // No context/output type logic here—just emit the selected template
    this.useTemplate.emit(template);
  }


  viewCurrentTemplateInBrowser() {
    const currentTemplate = this.getSelectedGalleryTemplate();
    if (!currentTemplate) return;

    // Get the template path from the template object
    const currentVariantIndex = currentTemplate.currentVariantIndex || 0;
    const templateObjectPath =
      currentTemplate.templateFilePaths?.[currentVariantIndex];

    if (!templateObjectPath) {
      this.messagesService.showError(
        'Cannot view template: Missing template path',
      );
      return;
    }

    // Use the new view-template endpoint specifically designed for browser viewing
    const url = `/api/cfgman/rb/view-template?path=${encodeURIComponent(templateObjectPath)}`;
    window.open(url, '_blank');
  }

  showCurrentTemplateAiPrompt(
    promptType: 'modify' | 'rebuild',
  ): void {
    const currentTemplate = this.getSelectedGalleryTemplate();
    if (!currentTemplate) return;
    this.selectedPromptType = promptType;

    // Set appropriate dialog header based on prompt type
    if (promptType === 'modify') {
      this.galleryDialogTitle =
        'prompt 1: modify this HTML template with some changes, as needed';
    } else {
      this.galleryDialogTitle =
        "prompt 2: build your HTML template from scratch, using this template's (full) prompt as a guide";
    }

    const content =
      promptType === 'modify'
        ? currentTemplate.selectedTemplateModifyPrompt
        : currentTemplate.selectedTemplateScratchPrompt;

    if (!content) {
      this.messagesService.showInfo(
        'No AI prompt available for this template.',
        'Information',
      );
      return;
    }

    this.previousStateBeforeAiPrompt = {
      previousState: this.templateGalleryState,
      templateIndex: this.selectedGalleryTemplateIndex, // Also store the current template index
    };

    this.selectedTemplateAiPrompt = content;
    this.templateGalleryState = 'ai-prompt';
  }

  showCurrentTemplateReadme(): void {
    const currentTemplate = this.getSelectedGalleryTemplate();
    if (!currentTemplate || !currentTemplate.readmeContent) {
      this.messagesService.showInfo(
        'No README available for this template.',
        'Information',
      );
      return;
    }

    // Store the current template index explicitly when opening README
    if (this.templateGalleryState !== 'readme') {
      this.previousStateBeforeReadme = {
        previousState: this.templateGalleryState,
        templateIndex: this.selectedGalleryTemplateIndex,
      };
    }

    this.selectedTemplateReadme = currentTemplate.readmeContent;
    this.templateGalleryState = 'readme';
    this.galleryDialogTitle = 'README';
  }



  closeTemplateReadme() {
    // Always restore the previous state - will always be 'templates'
    this.templateGalleryState = this.previousStateBeforeReadme.previousState;

    // Restore the specific template index
    this.selectedGalleryTemplateIndex =
      this.previousStateBeforeReadme.templateIndex;

    // Update the carousel position if needed
    if (this.templateCarousel) {
      this.templateCarousel.page = this.selectedGalleryTemplateIndex;
    }

    // Update the dialog header to reflect the template name
    const currentTemplate = this.getSelectedGalleryTemplate();
    if (currentTemplate) {
      this.galleryDialogTitle = `Examples (Gallery) - ${currentTemplate.name || currentTemplate.displayName}`;
    }
  }


  closeTemplateAiPrompt() {
    // Always restore the previous state - will always be 'templates'
    this.templateGalleryState = this.previousStateBeforeAiPrompt.previousState;

    // Restore the specific template index
    this.selectedGalleryTemplateIndex =
      this.previousStateBeforeAiPrompt.templateIndex;

    // Update the carousel position if needed
    if (this.templateCarousel) {
      this.templateCarousel.page = this.selectedGalleryTemplateIndex;
    }

    // Update the dialog header to reflect the template name
    const currentTemplate = this.getSelectedGalleryTemplate();
    if (currentTemplate) {
      this.galleryDialogTitle = `Examples (Gallery) - ${currentTemplate.name || currentTemplate.displayName}`;
    }

    // Clear the backup state after using it
    this.previousStateBeforeAiPrompt = null;
    this.selectedPromptType = null;
  }

  async copyTemplatePromptToClipboard(): Promise<void> {
    if (!this.selectedTemplateAiPrompt) {
      this.messagesService.showInfo('No prompt content to copy', 'Information');
      return;
    }

    await navigator.clipboard.writeText(this.selectedTemplateAiPrompt);
    this.messagesService.showInfo('Prompt copied to clipboard!', 'Success');
  }


  openBingAICopilot() {
    window.open('https://copilot.microsoft.com', '_blank');
  }

  sanitizeHtmlForIframe(html: string, templatePath?: string): SafeHtml {
    if (!html) {
      return this.sanitizer.bypassSecurityTrustHtml('');
    }
    const cacheKey = templatePath || '';
    if (this.templateSanitizedHtmlCache.has(cacheKey)) {
      return this.templateSanitizedHtmlCache.get(cacheKey);
    }
    const baseDirUrl = templatePath
      ? templatePath.substring(0, templatePath.lastIndexOf('/') + 1)
      : '';
    const tempDoc = document.implementation.createHTMLDocument('');
    const tempDiv = tempDoc.createElement('div');
    tempDiv.innerHTML = html;

    // Process regular images
    const images = tempDiv.querySelectorAll('img');
    images.forEach((img) => {
      const src = img.getAttribute('src');
      if (src && !src.startsWith('http') && !src.startsWith('data:')) {
        const assetPath = `${baseDirUrl}${src}`;
        img.setAttribute(
          'src',
          `/api/cfgman/rb/serve-asset?path=${encodeURIComponent(assetPath)}`,
        );
      }
    });

    // Process background images
    const elementsWithStyle = tempDiv.querySelectorAll(
      '[style*="background-image"]',
    );
    elementsWithStyle.forEach((el) => {
      const style = el.getAttribute('style');
      if (style) {
        const bgMatch = style.match(
          /background-image:\s*url\(['"]?([^'")]+)['"]?\)/i,
        );
        if (
          bgMatch &&
          bgMatch[1] &&
          !bgMatch[1].startsWith('http') &&
          !bgMatch[1].startsWith('data:')
        ) {
          const assetPath = `${baseDirUrl}${bgMatch[1]}`;
          const newStyle = style.replace(
            bgMatch[0],
            `background-image: url('/api/cfgman/rb/serve-asset?path=${encodeURIComponent(assetPath)}')`,
          );
          el.setAttribute('style', newStyle);
        }
      }
    });

    const processedHtml = tempDiv.innerHTML;
    const safeHtml = this.sanitizer.bypassSecurityTrustHtml(processedHtml);
    this.templateSanitizedHtmlCache.set(cacheKey, safeHtml);
    return safeHtml;
  }

  async loadGalleryTemplates() {
    this.galleryTemplates = [];

    // Reset display properties
    this.selectedTemplateReadme = '';

    //console.log(
    //  'Current output type when loading examples:',
    //  currentOutputType,
    //);

    // Load templates only once
    if (!this.templatesLoaded) {
      this.allAvailableTemplates =
        await this.samplesService.getHtmlDocTemplates();
      this.templatesLoaded = true;
    }



    //console.log(`Filtered templates count: ${filteredTemplates.length}`);
    const filteredTemplates = this.allAvailableTemplates.filter((template) => {
      if (this.galleryTags === null) {
        // Show all except 'excel'
        return !template.tags?.includes('excel');
      }
      // Otherwise: match any of the tags
      return template.tags.some(tag => this.galleryTags.includes(tag));
    });

    // Process filtered templates
    filteredTemplates.forEach((template) => {
      //console.log(`Adding template to gallery: ${template.name}`);

      if (template.templateFilePaths.length > 1) {
        // For multi-file templates, create variants
        template.templateFilePaths.forEach((path, index) => {
          const variantTemplate: HtmlDocTemplateDisplay = {
            ...template,
            templateFilePaths: [path], // Keep only the current path
            displayName: `${template.name} (${index + 1} of ${template.templateFilePaths.length})`,
            originalTemplate: template,
            collectionIndex: index + 1,
            currentVariantIndex: 0,
            isLoaded: false,
            htmlContent: [],
            category: this.deriveCategoryFromTags(template.tags),
          };
          this.galleryTemplates.push(variantTemplate);
        });
      } else {
        // Single template handling
        this.galleryTemplates.push({
          ...template,
          displayName: template.name,
          isLoaded: false,
          htmlContent: [],
          currentVariantIndex: 0,
          category: this.deriveCategoryFromTags(template.tags),
        });
      }
    });

    // Rest of the method remains the same
    if (this.galleryTemplates.length > 0) {
      this.selectedGalleryTemplateIndex = 0;
      await Promise.all(
        this.galleryTemplates.map((_, index) =>
          this.loadGalleryTemplateContent(index),
        ),
      );
      const firstTemplate = this.galleryTemplates[0];
      if (firstTemplate) {
        this.selectedTemplateReadme = firstTemplate.readmeContent || '';
        this.selectedTemplateModifyPrompt =
          firstTemplate.selectedTemplateModifyPrompt || '';
        this.selectedTemplateScratchPrompt =
          firstTemplate.selectedTemplateScratchPrompt || '';
      }
    }
  }

  async loadGalleryTemplateContent(index: number) {
    const template = this.galleryTemplates[index];
    if (!template) return;
    if (template.isLoaded) return; // do not reload if already loaded

    // Reset loading state
    template.isLoaded = false;
    template.htmlContent = [];
    template.currentVariantIndex = 0;

    try {
      // Load each HTML file of the template and pre-cache it
      for (let i = 0; i < template.templateFilePaths.length; i++) {
        const path = template.templateFilePaths[i];
        const content = await this.settingsService.loadTemplateFileAsync(path);
        if (content) {
          template.htmlContent.push(content);
          if (!this.templateSanitizedHtmlCache.has(path)) {
            const safeHtml = this.sanitizeHtmlForIframe(content, path);
            this.templateSanitizedHtmlCache.set(path, safeHtml);
          }
        }
      }

      // With the first (main) template file, load associated README and AI prompts
      if (template.templateFilePaths.length > 0) {
        const path = template.templateFilePaths[0];
        const lastSlashIndex = path.lastIndexOf('/');
        const lastDotIndex = path.lastIndexOf('.');
        if (lastSlashIndex !== -1 && lastDotIndex !== -1) {
          const templateName = path.substring(lastSlashIndex + 1, lastDotIndex);
          const dirPath = path.substring(0, lastSlashIndex);

          // Load README
          try {
            const readmePath = `${dirPath}/${templateName}-readme.md`;
            const readmeContent =
              await this.settingsService.loadTemplateFileAsync(readmePath);
            template.readmeContent =
              readmeContent && readmeContent.length > 0 ? readmeContent : '';
          } catch (error) {
            template.readmeContent = '';
          }

          // Load AI prompt for “modify”
          try {
            const promptModifyPath = `${dirPath}/${templateName}-ai_prompt_modify.md`;
            const promptModifyContent =
              await this.settingsService.loadTemplateFileAsync(
                promptModifyPath,
              );
            template.selectedTemplateModifyPrompt =
              promptModifyContent && promptModifyContent.length > 0
                ? promptModifyContent
                : '';
          } catch (error) {
            template.selectedTemplateModifyPrompt = '';
          }

          // Load AI prompt for “scratch”
          try {
            const promptScratchPath = `${dirPath}/${templateName}-ai_prompt_scratch.md`;
            const promptScratchContent =
              await this.settingsService.loadTemplateFileAsync(
                promptScratchPath,
              );
            template.selectedTemplateScratchPrompt =
              promptScratchContent && promptScratchContent.length > 0
                ? promptScratchContent
                : '';
          } catch (error) {
            template.selectedTemplateScratchPrompt = '';
          }
        }
      }

      template.isLoaded = true;
      //this.changeDetectorRef.detectChanges();
    } catch (error) {
      console.error('Error loading template content:', error);
      template.isLoaded = false;
    }
  }


  private updateGalleryTemplateVariantInfo(
    template: HtmlDocTemplateDisplay,
  ): void {
    if (!template) return;
    if (template.originalTemplate?.templateFilePaths?.length > 1) {
      const total = template.originalTemplate.templateFilePaths.length;
      const current = (template.currentVariantIndex || 0) + 1;
      template.displayName = `${template.name} (${current} of ${total})`;
    }
    //this.changeDetectorRef.detectChanges();
  }

  private deriveCategoryFromTags(tags: string[]): string {
    if (tags.includes('invoice')) return 'Invoice';
    if (tags.includes('report')) return 'Report';
    if (tags.includes('letter')) return 'Letter';
    return 'Other';
  }
}