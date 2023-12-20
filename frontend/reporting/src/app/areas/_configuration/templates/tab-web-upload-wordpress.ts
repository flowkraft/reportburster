export const tabWebUploadWordPressTemplate = `<ng-template #tabWebUploadWordPressTemplate>
  <div class="well">

    <div class="row">

      <div class="col-xs-1">
        <a href="https://wordpress.com/" target="_blank">
          <i class="fa fa-wordpress fa-2x"></i>
        </a>
      </div>
      <div class="col-xs-11" style="left:-20px;top:-2px">
        <h5
          [innerHTML]="'AREAS.CONFIGURATION.TAB-WEB-UPLOAD-WORDPRESS.INNER-HTML.USE-DOCUMENTBURSTER-WORDPRESS' | translate">
        </h5>
      </div>

    </div>

    <br>

    <div class="row">

      <div class="col-xs-2">{{'AREAS.CONFIGURATION.TAB-WEB-UPLOAD-WORDPRESS.COMMAND' | translate }}
      </div>
      <div class="col-xs-7">
        <input id="wordPressCommand"
          [(ngModel)]="xmlSettings?.documentburster.settings.webuploadsettings.wordpresscommand"
          (ngModelChange)='settingsChangedEventHandler($event)' class="form-control" />
      </div>

      <div class="col-xs-3">
        <dburst-button-variables id="btnWordPressVariables"
          (sendSelectedVariable)="updateFormControlWithSelectedVariable('wordPressCommand',$event)">
        </dburst-button-variables>
      </div>

    </div>

    <p></p>

    <div class="row">

      <div class="col-xs-2">{{'AREAS.CONFIGURATION.TAB-WEB-UPLOAD-WORDPRESS.EXAMPLE' | translate }}</div>
      <div class="col-xs-7">
        <em>--user "documentburster:password" -X POST --data "code=1234 &customer=Northridge Pharmaceuticals
          &product=Nebulizer
          Machine&amount=200.00 &date=December 28th, 2015&status=Unpaid"
          https://portal.reportburster.com/wp-json/pods/invoices
        </em>
      </div>

    </div>

    <p></p>

    <div class="row">

      <div class="col-xs-2">{{'AREAS.CONFIGURATION.TAB-WEB-UPLOAD-WORDPRESS.EXAMPLES' | translate }}</div>
      <div class="col-xs-7">
        <a href="https://portal.reportburster.com/use-cases/" target="_blank">https://portal.reportburster.com/use-cases/
        </a>
        <p></p>
        <p></p>
        &nbsp;&nbsp;
        <a href="https://portal.reportburster.com/use-cases/" target="_blank">1. Web + DocumentBurster = Customer
          Payment Portal</a>
        <br> &nbsp;&nbsp;
        <a href="https://portal.reportburster.com/use-cases/" target="_blank">2. Web + DocumentBurster =
          Invoices2People</a>
        <br> &nbsp;&nbsp;
        <a href="https://portal.reportburster.com/use-cases/" target="_blank">3. Web + DocumentBurster =
          Bills2People</a>
        <br> &nbsp;&nbsp;
        <a href="https://portal.reportburster.com/use-cases/" target="_blank">4. Web + DocumentBurster =
          PurchaseOrders2People</a>
        <br> &nbsp;&nbsp;
        <a href="https://portal.reportburster.com/use-cases/" target="_blank">5. Web + DocumentBurster =
          Statements2People</a>
        <br> &nbsp;&nbsp;
        <a href="https://portal.reportburster.com/use-cases/" target="_blank">6. Web + DocumentBurster =
          Payslips2People</a>
        <br> &nbsp;&nbsp;
        <a href="https://portal.reportburster.com/use-cases/" target="_blank">7. Web + DocumentBurster =
          SchoolReports2People</a>
        <br> &nbsp;&nbsp;
        <a href="https://portal.reportburster.com/use-cases/" target="_blank">8. Web + DocumentBurster =
          Contracts2People</a>
        <br> &nbsp;&nbsp;
        <a href="https://portal.reportburster.com/use-cases/" target="_blank">9. Web + DocumentBurster =
          AnyDocument2People </a>

      </div>

    </div>

  </div>
</ng-template>
`;
