export const modalSamplesLearnMoreTemplate = `<p-dialog [header]="modalSampleInfo.title" [(visible)]="isModalSamplesLearnMoreVisible" [modal]="true" width="800"
  height="200" class="modal-dialog-center">
  <div style="margin: 25px;">
    
  
      <div class="col-xs-2">
      {{
        'AREAS.CONFIGURATION-TEMPLATES.MODAL-CONF-TEMPLATE.CAPABILITIES' | translate
      }}
      </div>
      
      <div class="col-xs-10">
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
    <p></p>
  
    <div class="row">
  
    <div class="col-xs-2">
      Input
    </div>

    <div class="col-xs-10">

        <span [innerHTML]="modalSampleInfo.inputDetails"></span>
            
    </div>
  </div>
  
  <p></p>
  
  <div class="row">
  <div class="col-xs-2">
    Expected Output
  </div>

  <div class="col-xs-10" [innerHTML]="modalSampleInfo.outputDetails">
  </div>
</div>


  <div class="row">

      <div class="col-xs-2">Notes
      </div>
      
      <div class="col-xs-10" [innerHTML] = "modalSampleInfo.notes">

          
      </div>    
  </div>
    
  <p></p>
  
  <div class="row" *ngIf="!modalSampleInfo.capReportGenerationMailMerge">
    
    <div class="col-xs-2">
        Configuration
      </div>

      <div class="col-xs-10">
        <input type="text" id="templateHowTo" class="form-control"
          [ngModel]="modalSampleInfo.configurationRelativePath" readonly />
        
      </div>
    </div>
    
  </div> 

  <p-footer>
    <button id="btnClose" class="btn btn-flat btn-default" type="button" (click)="doCloseSamplesLearnMoreModal()">
      {{ 'BUTTONS.CLOSE' | translate }}
    </button>
  </p-footer>
</p-dialog>
`;
