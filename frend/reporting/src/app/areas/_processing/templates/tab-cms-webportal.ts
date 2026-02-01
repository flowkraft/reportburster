export const tabCmsWebPortalTemplate = `<ng-template
  #tabCmsWebPortalTemplate
>
  <div class="well">
    
  <div class="row" style="margin-top: 15px">
      <div class="col-xs-12 text-center">
        <a
          href="#"
          [routerLink]="['/help','appsMenuSelected']"
          skipLocationChange="true"
          class="btn btn-default"
          style="font-size: 1.05em; padding: 8px 20px; border-radius: 4px;"
        >
          <u>Explore More Apps That Go Well Together with ReportBurster</u>
        </a>
      </div>
  </div>
    
  <br/>

  <div class="row" style="margin-top: 10px">
      <div class="col-xs-12">
        <dburst-apps-manager
          [dropdownDirection]="'expandedList'"
          [inputAppsToShow]="['flowkraft-grails']"
          [showDevButtons]="false"
        >
        </dburst-apps-manager>
      </div>
    </div>

    <div class="row" style="margin-top: 10px">
      <div class="col-xs-12">
        <dburst-apps-manager
          [dropdownDirection]="'expandedList'"
          [inputAppsToShow]="['cms-webportal']"
          [askAiForHelpOutputTypeCode]="'cms.webportal'"
          [showDevButtons]="false"
        >
        </dburst-apps-manager>
      </div>
    </div>


    <!--<dburst-docker></dburst-docker>-->

  </div>
</ng-template> `;
