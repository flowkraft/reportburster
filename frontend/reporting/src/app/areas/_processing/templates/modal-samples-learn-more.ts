export const modalSamplesLearnMoreTemplate = `<p-dialog [header]="modalSampleInfo.title" [(visible)]="isModalSamplesLearnMoreVisible" [modal]="true" width="800"
  height="200" class="modal-dialog-center">
  <div style="margin: 25px;">
  
  <div class="row">
    
  <div class="col-xs-2">
    <strong>{{
      'AREAS.TOP-MENU-HEADER.DOCUMENTATION' | translate
    }}</strong> 
  </div>

  <div class="col-xs-10">
      <a href="{{modalSampleInfo.documentation}}" target="_blank">{{modalSampleInfo.documentation}}</a>    
  </div>
 
 </div>
  <br/>  
  <div class="row">
      <div class="col-xs-2">
      {{
        'SAMPLES.MODAL.FEATURES' | translate
      }}
      </div>
      
      <div class="col-xs-10">
        
      <input
          type="checkbox"
          id="btnCapReportSplitting"
          [ngModel]="modalSampleInfo.capReportSplitting" onclick="return false;"
          />
        <label 
          for="btnCapReportSplitting" class="checkboxlabel">
          &nbsp;{{'AREAS.CONFIGURATION-TEMPLATES.MODAL-CONF-TEMPLATE.CAP-REPORT-SPLITTING' | translate}}
        </label>
        &nbsp;&nbsp;

        <input
          type="checkbox"
          id="btnCapReportDistribution"
          [ngModel]="modalSampleInfo.capReportDistribution" onclick="return false;"
          />
        <label 
          for="btnCapReportDistribution" class="checkboxlabel">
          &nbsp;{{'AREAS.CONFIGURATION-TEMPLATES.MODAL-CONF-TEMPLATE.CAP-REPORT-DISTRIBUTION' | translate}}
        </label>
        &nbsp;&nbsp;
        <input
          type="checkbox"
          id="btnCapReportGenerationMailMerge"
          [ngModel]="modalSampleInfo.capReportGenerationMailMerge" onclick="return false;"
          />
        <label 
          for="btnCapReportGenerationMailMerge" class="checkboxlabel">
          &nbsp;{{'AREAS.CONFIGURATION-TEMPLATES.MODAL-CONF-TEMPLATE.CAP-REPORT-GENERATION' | translate}}
        </label>
              
      </div>
    
    </div>
    <p></p>
    
    <div class="row">
    <div class="col-xs-2">
    {{
      'SAMPLES.MODAL.INPUT' | translate
    }}
    </div>

    <div class="col-xs-10">

        <span [innerHTML]="modalSampleInfo.inputDetails"></span>
            
    </div>
  </div>
  
  <br/>
  <br/>

  <div class="row">
  <div class="col-xs-2">
  {{
    'SAMPLES.MODAL.EXPECTED-OUTPUT' | translate
  }}
  </div>

  <div class="col-xs-10" [innerHTML]="modalSampleInfo.outputDetails">
  </div>
</div>

<br/>
<br/>

  <div class="row">

      <div class="col-xs-2">{{
        'SAMPLES.MODAL.NOTES' | translate
      }}
      </div>
      
      <div id="div{{modalSampleInfo.id}}" class="col-xs-10" [innerHTML] = "modalSampleInfo.notes">

          
      </div>    
  </div>
    
  <p></p>
  
  <div class="row" *ngIf="!modalSampleInfo.capReportGenerationMailMerge">
    
    <div class="col-xs-2">
    {{
      'SAMPLES.MODAL.CONFIGURATION' | translate
    }}
      </div>

      <div class="col-xs-10">
        <input type="text" id="templateHowTo" class="form-control"
          [ngModel]="modalSampleInfo.configurationFilePath" readonly />
        
      </div>
    </div>
    <br/>
    <div class="row">
    
    <div class="col-xs-2">
      
    </div>
  
    <div class="col-xs-10">
      <button type="button" id="btnViewConfigurationFile{{modalSampleInfo.id}}" class="btn btn-xs btn-default" (click)="doSampleViewConfigurationFile(modalSampleInfo.configurationFilePath, modalSampleInfo.configurationFileName)">&nbsp;&nbsp;&nbsp;&nbsp;View Configuration File&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</button>
    </div>
   
   </div>
   
    </div> 

    
    <p></p>
    
  <p-footer>
    <button id="btnCloseSamplesLearnMoreModal" class="btn btn-flat btn-default" type="button" (click)="doCloseSamplesLearnMoreModal()">
      {{ 'BUTTONS.CLOSE' | translate }}
    </button>
  </p-footer>
</p-dialog>
`;
