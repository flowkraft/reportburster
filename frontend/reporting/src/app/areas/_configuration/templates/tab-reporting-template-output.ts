export const tabReportingTemplateOutputTemplate = `<ng-template
  #tabReportingTemplateOutputTemplate
>
  <div class="well">
    <div class="row">
      <div class="col-xs-2">
        {{ 'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.OUTPUT-TYPE' | translate }}
      </div>
      <div class="col-xs-10">
        <select
          id="reportOutputType"
          class="form-control"
          [(ngModel)]="xmlReporting?.documentburster.report.template.outputtype"
          (ngModelChange)="settingsChangedEventHandler($event)"
          (change)="onReportOutputTypeChanged()"
        >
          <option value="output.none">
            {{ 'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.TYPE-NONE' | translate }}
          </option>
          <option value="output.pdf">
            {{ 'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.TYPE-PDF' | translate }}
          </option>
          <option value="output.xlsx">
            {{ 'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.TYPE-XLSX' | translate }}
          </option>
          <option value="output.html">
            {{ 'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.TYPE-HTML' | translate }}
          </option>
          <option value="output.docx">
            {{ 'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.TYPE-DOCX' | translate }}
          </option>
        </select>
      </div>
    </div>
    <p></p>
    <!-- Add this help text when None is selected -->
    <div class="row" *ngIf="xmlReporting?.documentburster.report.template.outputtype === 'output.none'">
      <div class="col-xs-offset-2 col-xs-10">
        <span id="noneOutputTypeHelp" class="help-block">
          <i class="fa fa-info-circle text-info"></i>&nbsp;
          {{ 'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.NONE-OUTPUT-HELP' | translate }}
        </span>
      </div>
    </div>
    
    <div
      *ngIf="askForFeatureService.alreadyImplementedFeatures.includes(xmlReporting?.documentburster.report.template.outputtype)"
    >
      <div
        class="row"
        id="reportTemplateContainer"
        *ngIf="xmlReporting?.documentburster.report.template.outputtype != 'output.none'"
      >
        <div class="col-xs-2">
          {{ (xmlReporting?.documentburster.report.template.outputtype === 'output.docx' ? 
            'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.TEMPLATE-FILE': 
            'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.TEMPLATE-HTML') | translate }}
        </div>

        <div class="col-xs-10">
        
          <!-- Template file selector for DOCX -->
          <ng-select
            *ngIf="xmlReporting?.documentburster.report.template.outputtype === 'output.docx'"
            id="selectTemplateFile"
            [(ngModel)]="selectedReportTemplateFile"
            (change)="onSelectTemplateFileChanged($event)"
            appendTo="body"
            style="margin-bottom: 10px;"
          >
             <ng-template ng-notfound-tmp>
                <div id="noDocxTemplatesFound" class="ng-option disabled">
                  <i class="fa fa-exclamation-triangle text-warning"></i> 
                  {{ 'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.NO-TEMPLATES-FOUND' | translate }}<br>
                  <code id="noDocxTemplatesFoundCode" style="background-color: #f8f8f8; padding: 4px; margin-top: 5px; display: block; word-break: break-all;">
                    {{absoluteTemplateFolderPath ? absoluteTemplateFolderPath : 
                      (settingsService.CONFIGURATION_TEMPLATES_FOLDER_PATH + '/reports/' + 
                      settingsService.currentConfigurationTemplate?.folderName)}}
                  </code>
                </div>
              </ng-template>
            
            <ng-option
              *ngFor="let reportTemplate of settingsService.getReportTemplates(xmlReporting?.documentburster.report.template.outputtype, {samples: xmlReporting?.documentburster.report.template.documentpath?.includes('/samples/')})"
              [value]="reportTemplate"
              >
              <span id="{{reportTemplate.fileName}}">
              {{reportTemplate.fileName}}
              <span *ngIf="reportTemplate.type.includes('-sample')">
                {{ 'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.DIALOG.SAMPLE-LABEL' | translate }}
              </span>
              </span>  
              </ng-option
            >
          </ng-select>

          <!-- Shared toolbar for all output types except 'none' -->
          <div class="shared-toolbar" 
              *ngIf="xmlReporting?.documentburster.report.template.outputtype !== 'output.none'"
              style="margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; flex-wrap: nowrap; min-width: fit-content;">
              <div class="btn-group" style="white-space: nowrap; display: inline-flex;">
                <button type="button" 
                        id="btnAiCopilot"
                        class="btn btn-sm btn-default" 
                        style="border-top-right-radius: 0; border-bottom-right-radius: 0;"
                        (click)="openBingAICopilot()">
                  {{ 'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.BUTTONS.LAUNCH-COPILOT' | translate }}&nbsp;
                  <img src="https://studiostaticassetsprod.azureedge.net/bundle-cmc/favicon.svg" 
                      style="height: 16px; width: 16px" 
                      alt="Copilot" /> 
                </button>
                <button type="button" 
                        id="btnAiDropdownToggle"
                        class="btn btn-sm btn-default dropdown-toggle" 
                        style="border-top-left-radius: 0; border-bottom-left-radius: 0; border-left: 1px solid #ccc; width: 20px; padding-left: 5px; padding-right: 5px;"
                        data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                  <span class="caret"></span>
                  <span class="sr-only">Toggle Dropdown</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-right">
                  <li>
                    <a href="javascript:void(0)" 
                      id="btnAskAiForHelp"  
                      (click)="askAiForHelp()">
                      <i class="fa fa-star"></i> <strong>{{ 'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.BUTTONS.HEY-AI' | translate }}</strong>
                    </a>
                  </li>
                </ul>
              </div>
              
              <button type="button" 
                      id="btnOpenTemplateGallery"
                      class="btn btn-sm btn-default" style="margin-left: 5px;" 
                      (click)="openTemplateGallery()">
                <i class="fa fa-list-alt"></i> {{ 'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.BUTTONS.EXAMPLES-GALLERY' | translate }}
              </button>
            </div>
            
            <!-- Template path display (right-aligned, expanded) -->
            <div *ngIf="absoluteTemplateFolderPath" 
                style="display: flex; align-items: center; overflow: hidden; flex: 1; margin-left: 15px; max-width: 70%;">
              <div id="divTruncatedAbsoluteTemplateFolderPath" class="truncated-path" 
                  style="font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; background-color: #f8f8f8; padding: 4px 8px; border-radius: 3px; border: 1px solid #e0e0e0; margin-right: 5px; width: 100%;"
                  [title]="absoluteTemplateFolderPath || getTemplateRelativeFolderPath()">
                {{absoluteTemplateFolderPath || getTemplateRelativeFolderPath()}}
              </div>
              <button type="button" 
                      id="btnCopyTemplatePathToClipboard"
                      class="btn btn-sm btn-default" 
                      title="Copy path to clipboard"
                      (click)="copyTemplatePathToClipboard()">
                <i class="fa fa-clipboard"></i>
              </button>
            </div>
          </div>


          <!-- HTML editor for HTML, PDF and XLSX -->
          <div>
              
              <!-- Code editor only (when preview is hidden) -->
              <div id="codeJarHtmlTemplateEditorDiv" *ngIf="!reportPreviewVisible && (xmlReporting?.documentburster.report.template.outputtype === 'output.html' || 
                    xmlReporting?.documentburster.report.template.outputtype === 'output.pdf' || 
                    xmlReporting?.documentburster.report.template.outputtype === 'output.xlsx')">
                <ngx-codejar
                  id="codeJarHtmlTemplateEditor"  
                  [(code)]="activeReportTemplateHtml"
                  (codeChange)="onTemplateHtmlContentChanged($event)"
                  [highlightMethod]="highlightMethod"
                  [highlighter]="'prism'"
                  [showLineNumbers]="true"
                  style="height: 446px; border: 1px solid #ccc; border-radius: 4px 4px 0 0; overflow-y: auto;"
                ></ngx-codejar>
                <button type="button" 
                        id="btnToggleHtmlPreviewShow"
                        class="btn btn-default btn-block" 
                        style="border-top-left-radius: 0; border-top-right-radius: 0; margin: 0; border: 1px solid #ddd; border-top: none; box-sizing: border-box;"
                        (click)="toggleHtmlPreview()">
                  <i class="fa fa-eye"></i> {{ 'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.BUTTONS.SHOW-PREVIEW' | translate }}
                </button>
              </div>

              <!-- Split pane with editor and preview -->
              <as-split *ngIf="reportPreviewVisible && (xmlReporting?.documentburster.report.template.outputtype === 'output.html' || 
                    xmlReporting?.documentburster.report.template.outputtype === 'output.pdf' || 
                    xmlReporting?.documentburster.report.template.outputtype === 'output.xlsx')" direction="horizontal" 
                        [gutterSize]="8" [useTransition]="true"
                        style="height: 480px;">
                
                <!-- Editor Pane -->
                <as-split-area [size]="50" [minSize]="20">
                  <div id="codeJarHtmlTemplateEditorDiv" style="height: 100%; display: flex; flex-direction: column;">
                    <ngx-codejar
                      id="codeJarHtmlTemplateEditor"
                      [(code)]="activeReportTemplateHtml"
                      (codeChange)="onTemplateHtmlContentChanged($event)"
                      [highlightMethod]="highlightMethod"
                      [highlighter]="'prism'"
                      [showLineNumbers]="true"
                      style="flex: 1; border: 1px solid #ccc; border-radius: 4px 4px 0 0; overflow-y: auto;"
                    ></ngx-codejar>
                    <button type="button" 
                            id="btnToggleHtmlPreviewHide"
                            class="btn btn-default btn-block" 
                            style="border-top-left-radius: 0; border-top-right-radius: 0; margin: 0; border: 1px solid #ddd; border-top: none; box-sizing: border-box;"
                            (click)="toggleHtmlPreview()">
                      <i class="fa fa-code"></i> {{ 'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.BUTTONS.EXPAND-EDITOR' | translate }}
                    </button>
                  </div>
                </as-split-area>
                
                <!-- Preview Pane -->
                <as-split-area [size]="50" [minSize]="20">
                  <div class="preview-container" style="height: 100%; display: flex; flex-direction: column; overflow: hidden; box-sizing: border-box;">
                    <iframe 
                            id="reportPreviewPane"
                            [srcdoc]="sanitizedReportPreview" 
                            style="width: 100%; flex: 1; border: 1px solid #ddd; border-radius: 4px 4px 0 0; overflow: auto; box-sizing: border-box;" 
                            frameborder="0">
                    </iframe>
                    <button id="btnViewHtmlInBrowser" type="button" class="btn btn-default btn-block" 
                            style="border-top-left-radius: 0; border-top-right-radius: 0; margin: 0; border: 1px solid #ddd; border-top: none; box-sizing: border-box;"
                            (click)="openTemplateInBrowser(null, xmlReporting.documentburster.report.template.documentpath)">
                      <i class="fa fa-external-link"></i> {{ 'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.BUTTONS.VIEW-IN-BROWSER' | translate }}
                    </button>
                  </div>
                </as-split-area>
              </as-split>
              
          </div>
        </div>
      </div>
    </div>
    <div
      *ngIf="!askForFeatureService.alreadyImplementedFeatures.includes(xmlReporting?.documentburster.report.template.outputtype)"
    >
      <div class="row">
        <div class="col-xs-2"></div>
        <div class="col-xs-5">
          <button
            type="button"
            class="btn btn-primary btn-block"
            (click)="onAskForFeatureModalShow(xmlReporting?.documentburster.report.template.outputtype)"
          >
            <span [innerHTML]="'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.BUTTONS.REQUEST-FEATURE' | translate"></span>
          </button>
        </div>
      </div>
    </div>
  </div>
  
  <p-dialog
    id="templateGalleryModal"
    [header]="galleryDialogTitle"
    [visible]="templateGalleryState !== 'closed'"
    [modal]="true"
    [style]="{width: '95vw', height: '95vh'}" 
    [closable]="false"
    [closeOnEscape]="false"
    [contentStyle]="{padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%'}"
    (onShow)="addDialogEscapeHandler()">
    
    <ng-template pTemplate="header">
      <span id="galleryDialogTitle">{{galleryDialogTitle}}</span>
      <button type="button" id="btnCloseTemplateGalleryX" class="close" (click)="closeTemplateGallery()" 
              style="position: absolute; right: 15px; top: 10px; font-size: 21px; padding: 0; line-height: 1; margin: 0;">
        <span>&times;</span>
      </button>
    </ng-template>

    <div style="flex: 1; overflow: hidden; position: relative; display: flex; flex-direction: column; height: calc(89vh - 120px);">
      <!-- General AI Instructions (shown when first opening in AI mode) -->
      <div *ngIf="templateGalleryState === 'examples-gallery' || templateGalleryState === 'hey-ai'" id="aiInstructionsContainer" class="ai-instructions-container" 
          style="padding: 20px; height: 100%; overflow: auto; background-color: white;">
        
        <!-- Render the markdown instructions -->
        <markdown id="aiInstructionsContent" [data]="galleryAiInstructions"></markdown>
        <br/><br/><br/>
        <!-- Button to proceed to templates -->
        <div *ngIf="templateGalleryState === 'examples-gallery'" style="margin-top: 20px; text-align: center;">
          <button type="button" id="btnConfirmAiGalleryInstructions" class="btn btn-primary btn-lg" (click)="closeGeneralAiInstructions()">
            <i class="fa fa-check-circle"></i>&nbsp;{{ 'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.DIALOG.GALLERY-CONFIRM' | translate }}
          </button>
        </div>

        <!-- Link to  -->
        <div *ngIf="templateGalleryState === 'hey-ai'" style="margin-top: 20px; text-align: center;">
          <a href="https://www.reportburster.com/docs/artificial-intelligence" target="_blank" 
            id="btnConfirmAiHelp" 
            class="btn btn-primary btn-lg" 
            role="button">
            <i class="fa fa-check-circle"></i>&nbsp;{{ 'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.DIALOG.AI-HELP-CONFIRM' | translate }}
          </a>
        </div>
      </div>
    
      <p-carousel #templateCarousel
          id="galleryTemplateCarousel"
          [value]="galleryTemplates" 
          [numVisible]="1" 
          [numScroll]="1" 
          [circular]="true"
          [showIndicators]="false"
          [showNavigators]="true"
          [page]="selectedGalleryTemplateIndex"
          (onPage)="onGalleryTemplateSelected($event)"
          [responsiveOptions]="[
            {breakpoint: '1024px', numVisible: 1},
            {breakpoint: '768px', numVisible: 1},
            {breakpoint: '560px', numVisible: 1}
          ]"
          [style]="{height: '100%', display: 'flex', flexDirection: 'column'}"
          *ngIf="templateGalleryState === 'templates' && galleryTemplates && galleryTemplates.length > 0">
        <ng-template let-example pTemplate="item">
          <div 
              id="galleryTemplatePreviewContainer"
              class="template-example-preview" 
              style="width: 100%; height: calc(89vh - 200px); display: flex; justify-content: center; align-items: center; overflow: hidden; padding: 10px;">
              <iframe #templateIframe
                [id]="'template-iframe-' + (example?.id || selectedGalleryTemplateIndex)"
                [srcdoc]="sanitizeHtmlForIframe(example?.htmlContent?.[example?.currentVariantIndex || 0], example?.templateFilePaths?.[example?.currentVariantIndex || 0])"
                [ngClass]="{'fade-transition': true, 'fade-hidden': templatePreviewFadeState === 'hidden'}"
                scaleIframe
                scrolling="no"
                style="width: 100%; height: 100%; border: none;">
              </iframe>
          </div>
        </ng-template>
      </p-carousel>

      <!-- Show a loading indicator only when in templates mode and no data is available -->
      <div *ngIf="templateGalleryState === 'templates' && (!galleryTemplates || galleryTemplates.length === 0)" class="text-center p-4">
        <span>{{ 'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.DIALOG.LOADING' | translate }}</span>
      </div>

      <!-- README viewer (show when README is visible) -->
      <div *ngIf="templateGalleryState === 'readme'" id="readmeDialogContainer" class="readme-container" style="padding: 20px; height: 100%; overflow: auto; background-color: white;">
        <div style="position: sticky; top: 0; background-color: #f5f5f5; padding: 10px; margin-bottom: 15px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0;">{{ 'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.DIALOG.README-TITLE' | translate }}</h3>
          <button type="button" id="btnBackToTemplate" class="btn btn-sm btn-default" (click)="closeTemplateReadme()">
            <i class="fa fa-arrow-left"></i> {{ 'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.BUTTONS.BACK-TO-TEMPLATE' | translate }}
          </button>
        </div>
        
        <!-- Use ngx-markdown to render the Markdown content -->
        <markdown id="templateReadmeContent" [data]="selectedTemplateReadme"></markdown>
      </div>

      <!-- AI Prompt viewer (show when AI prompt is visible) -->
      <div *ngIf="templateGalleryState === 'ai-prompt'" id="aiPromptContainer" class="ai-prompt-container" style="padding: 20px; height: 100%; overflow: auto; background-color: white;">
        <div style="position: sticky; top: 0; background-color: #f5f5f5; padding: 10px; margin-bottom: 15px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
          <h5 id="aiPromptSteps" style="margin: 0;">
            <span [innerHTML]="'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.AI-INSTRUCTIONS.STEP1' | translate"></span><br/>
            
            <ng-container *ngIf="!selectedTemplateAiPrompt || !selectedTemplateAiPrompt.includes('Customization Instructions')">
              <span [innerHTML]="'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.AI-INSTRUCTIONS.STEP2-GENERAL' | translate"></span><br/>
            </ng-container>
            
            <ng-container *ngIf="selectedTemplateAiPrompt && selectedTemplateAiPrompt.includes('Customization Instructions')">
              <span [innerHTML]="'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.AI-INSTRUCTIONS.STEP2-CUSTOM' | translate"></span><br/>
            </ng-container>
            
            <span [innerHTML]="'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.AI-INSTRUCTIONS.STEP3' | translate"></span><br/>
            <span [innerHTML]="'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.AI-INSTRUCTIONS.STEP4' | translate"></span><br/><br/>
            <span [innerHTML]="'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.AI-INSTRUCTIONS.COLOR-TIP' | translate"></span>
          </h5>
          
          <button type="button" id="btnBackToTemplate" class="btn btn-sm btn-default" (click)="closeTemplateAiPrompt()">
            <i class="fa fa-arrow-left"></i> {{ 'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.BUTTONS.BACK-TO-TEMPLATE' | translate }}
          </button>
        </div>
        
        <!-- Replace the Copilot button with Copy to Clipboard -->
        <div style="margin-top: 20px; margin-bottom: 20px; text-align: center;">
          <button type="button"  style="width: 250px" 
               id="btnCopyTemplatePromptToClipboardTop" class="btn btn-default" (click)="copyTemplatePromptToClipboard()">
            <i class="fa fa-clipboard"></i> {{ 'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.BUTTONS.COPY-CLIPBOARD-PROMPT' | translate }}
          </button>&nbsp;&nbsp;&nbsp;
          <button type="button" 
                id="btnAiCopilotPromptTop"
                class="btn btn-primary"
                style="width: 250px" 
                (click)="openBingAICopilot()">
              {{ 'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.BUTTONS.LAUNCH-COPILOT' | translate }}
              <img src="https://studiostaticassetsprod.azureedge.net/bundle-cmc/favicon.svg" 
                  style="height: 16px; width: 16px" 
                  alt="Copilot" />
          </button>
        </div>
        
        <!-- Use ngx-markdown to render the Markdown content -->
        <markdown id="aiPromptContent" [data]="selectedTemplateAiPrompt || ''" style="display: block; border: 1px solid #ddd; border-radius: 4px; padding: 15px; background-color: #f9f9f9;"></markdown>
        
        <!-- Replace the Copilot button with Copy to Clipboard -->
        <div style="margin-top: 20px; text-align: center;">
          <button type="button" id="btnCopyTemplatePromptToClipboardBottom" style="width: 250px" 
                class="btn btn-default" (click)="copyTemplatePromptToClipboard()">
            <i class="fa fa-clipboard"></i> {{ 'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.BUTTONS.COPY-CLIPBOARD-PROMPT' | translate }}
          </button>
          <button type="button" 
                id="btnAiCopilotPromptBottom"
                class="btn btn-primary"
                style="width: 250px" 
                (click)="openBingAICopilot()">
              {{ 'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.BUTTONS.LAUNCH-COPILOT' | translate }}
              <img src="https://studiostaticassetsprod.azureedge.net/bundle-cmc/favicon.svg" 
                  style="height: 16px; width: 16px" 
                  alt="Copilot" />
          </button>
        </div>
      </div>
    
    </div>

    <div class="template-footer p-dialog-footer" style="display: flex; align-items: center; justify-content: space-between; width: 100%; border-top: 1px solid #e9e9e9; padding: 10px; margin-top: auto;">
      <div class="template-info" style="text-align: left; flex: 3; padding-right: 10px; overflow: hidden;" *ngIf="templateGalleryState === 'templates' || templateGalleryState === 'readme' || templateGalleryState === 'ai-prompt'">
        <div class="template-tags" *ngIf="getSelectedGalleryTemplate()?.tags">
          <span class="badge badge-info tag-badge" 
                *ngFor="let tag of getSelectedGalleryTemplate()?.tags"
                style="display: inline-block; margin-right: 5px; margin-bottom: 3px; padding: 3px 6px; background-color: #f8f9fa; color: #495057; border-radius: 4px; font-size: 90%;">
            {{tag}}
          </span>
        </div>
      </div>
      
      <div style="flex: 1; display: flex; justify-content: flex-end; align-items: center; flex-wrap: nowrap;">
          <!-- Only show template-specific buttons when NOT on general instructions -->
          <ng-container *ngIf="templateGalleryState !== 'examples-gallery' && templateGalleryState !== 'hey-ai'">

              <!-- Conditionally show either the "Use Template" or "Get AI Prompt" button -->
              <button type="button" 
                  id="btnUseSelectedTemplate"
                  class="btn btn-default" style="margin-left: 5px;"
                  *ngIf="templateGalleryState === 'templates'" 
                  (click)="useSelectedTemplate(getSelectedGalleryTemplate())">
                  {{ 'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.BUTTONS.USE-TEMPLATE' | translate }}
              </button>
              
              <button type="button" id="btnViewHtmlInBrowserModal" class="btn btn-default" (click)="openTemplateInBrowser(getSelectedGalleryTemplate())">
                <i class="fa fa-external-link"></i> {{ 'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.BUTTONS.VIEW-IN-BROWSER' | translate }}
              </button>
              
              <div style="margin-left: 5px; display: inline-block;" *ngIf="templateGalleryState === 'templates'">
                <div style="display: flex; flex-direction: row;" class="dropup">
                  <button type="button" id="btnGetAiPrompt" class="btn btn-primary" 
                          style="border-top-right-radius: 0; border-bottom-right-radius: 0; margin-right: 0;"
                          (click)="showTemplateAiPrompt(getSelectedGalleryTemplate(), 'modify')">
                    <i class="fa fa-magic"></i> {{ 'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.BUTTONS.GET-AI-PROMPT' | translate }}
                  </button>
                  <button type="button" id="btnAiPromptDropdownToggle" class="btn btn-primary" 
                          style="border-top-left-radius: 0; border-bottom-left-radius: 0; border-left: 1px solid rgba(255,255,255,0.3); width: 30px; padding: 6px 10px;"
                          data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    <span class="caret"></span>
                  </button>
                  <ul class="dropdown-menu dropdown-menu-right" style="margin-top: 0; margin-bottom: 2px;">
                    <li><a href="javascript:void(0)" id="btnAiPromptModify" (click)="showTemplateAiPrompt(getSelectedGalleryTemplate(), 'modify')">
                      {{ 'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.DIALOG.PROMPT-MODIFY' | translate }}</a>
                    </li>
                    <li><a href="javascript:void(0)" id="btnAiPromptRebuild" (click)="showTemplateAiPrompt(getSelectedGalleryTemplate(), 'rebuild')">
                      {{ 'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.DIALOG.PROMPT-REBUILD' | translate }}</a>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Update the Readme button to only appear when README content exists -->
              <button type="button" 
                      id="btnViewTemplateReadme"
                      class="btn btn-default" style="margin-left: 5px;" 
                      (click)="showTemplateReadme(getSelectedGalleryTemplate())"
                      *ngIf="selectedTemplateReadme">
                <i class="fa fa-book"></i> {{ 'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.BUTTONS.README' | translate }}
              </button>
          </ng-container>

          <button type="button" 
                  id="btnCloseTemplateGallery"
                  class="btn btn-default" style="margin-left: 5px;" 
                  (click)="closeTemplateGallery()">
            {{ 'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.BUTTONS.CLOSE' | translate }}
          </button>
        </div>
    </div>
  </p-dialog>
  
  <!-- Add this at the bottom of your component template -->
  <p-confirmDialog [style]="{width: '450px'}"></p-confirmDialog>

</ng-template>`;
