export const tabWebUploadDocumentBursterWebTemplate = `<ng-template #tabWebUploadDocumentBursterWebTemplate>
  <div class="well">

    <div class="row">

      <div class="col-xs-1">
        <a href="https://portal.reportburster.com" target="_blank">
          <i class="fa fa-cc-visa fa-2x"></i>
        </a>
      </div>
      <div class="col-xs-11" style="left:-15px;top:-10px">
        <h5 [innerHTML]="'AREAS.CONFIGURATION.TAB-WEB-UPLOAD-DOCUMENTBURSTER.ACCEPT-FASTER-SAFER' | translate">
        </h5>
      </div>

    </div>


    <br>

    <div class="row">

      <div class="col-xs-2">{{'AREAS.CONFIGURATION.TAB-WEB-UPLOAD-DOCUMENTBURSTER.COMMAND' | translate }}
      </div>
      <div class="col-xs-7">
        <input id="documentBursterWebCommand"
          [(ngModel)]="xmlSettings?.documentburster.settings.webuploadsettings.documentbursterwebcommand"
          (ngModelChange)='settingsChangedEventHandler($event)' class="form-control" />
      </div>

      <div class="col-xs-3">
        <dburst-button-variables id="btnDocumentBursterWebVariables"
          (sendSelectedVariable)="updateFormControlWithSelectedVariable('documentBursterWebCommand',$event)">
        </dburst-button-variables>
      </div>

    </div>

    <br>

    <div class="row">

      <div class="col-xs-2">{{'AREAS.CONFIGURATION.TAB-WEB-UPLOAD-DOCUMENTBURSTER.EXAMPLES' | translate }}</div>
      <div class="col-xs-7">
        <a href="https://portal.reportburster.com/use-cases/" target="_blank">
          <span>https://portal.reportburster.com/use-cases/ </span>
        </a>
        <br>
        <br>
        <a href="https://portal.reportburster.com/use-cases/" target="_blank">1. Web + DocumentBurster = Customer Payment
          Portal</a>
        <br>
        <a href="https://portal.reportburster.com/use-cases/" target="_blank">2. Web + DocumentBurster = Invoices2People</a>
        <br>
        <a href="https://portal.reportburster.com/use-cases/" target="_blank">3. Web + DocumentBurster = Bills2People</a>
        <br>
        <a href="https://portal.reportburster.com/use-cases/" target="_blank">4. Web + DocumentBurster =
          PurchaseOrders2People</a>
        <br>
        <a href="https://portal.reportburster.com/use-cases/" target="_blank">5. Web + DocumentBurster =
          Statements2People</a>
        <br>
        <a href="https://portal.reportburster.com/use-cases/" target="_blank">6. Web + DocumentBurster = Payslips2People</a>
        <br>
        <a href="https://portal.reportburster.com/use-cases/" target="_blank">7. Web + DocumentBurster =
          SchoolReports2People</a>
        <br>
        <a href="https://portal.reportburster.com/use-cases/" target="_blank">8. Web + DocumentBurster = Contracts2People</a>
        <br>
        <a href="https://portal.reportburster.com/use-cases/" target="_blank">9. Web + DocumentBurster =
          AnyDocument2People</a>
      </div>

    </div>
    <br>
    <div class="row">

      <div class="col-xs-3">
        <a href="https://portal.reportburster.com" target="_blank">
          <button class="btn btn-primary" type="button">{{'AREAS.CONFIGURATION.TAB-WEB-UPLOAD-DOCUMENTBURSTER.LIVE-DEMO'
            | translate }}</button>
        </a>
      </div>

    </div>

  </div>
</ng-template>
`;
