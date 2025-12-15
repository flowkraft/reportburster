export const tabCmsWebPortalTemplate = `<ng-template
  #tabCmsWebPortalTemplate
>
  <div class="well">
    
     <div class="row" style="margin-top: 10px">
      <div class="col-xs-12">
        <dburst-apps-manager
          [dropdownDirection]="'expandedList'"
          [inputAppsToShow]="['flowkraft-frend-grails']"
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

    <div class="row" style="margin-top: 15px">
      <div class="col-xs-12 text-center">
        <a
          href="#"
          [routerLink]="['/help','appsMenuSelected']"
          skipLocationChange="true"
          class="btn btn-default"
          style="font-size: 1.05em; padding: 8px 20px; border-radius: 4px;"
        >
          <i class="fa fa-th-large" style="margin-right: 6px;"></i>Discover Powerful Apps & Tools That Perfectly Complement ReportBurster
        </a>
      </div>
    </div>

    <!--<dburst-docker></dburst-docker>-->

  </div>
</ng-template> `;
