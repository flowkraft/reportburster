export const tabCmsWebPortalTemplate = `<ng-template
  #tabCmsWebPortalTemplate
>
  <div class="well">
    <div class="row" style="margin-top: 10px">
      <div class="col-xs-12">
        <dburst-apps-manager
          [dropdownDirection]="'expandedList'"
          [inputAppsToShow]="['cms-webportal']"
        >
        </dburst-apps-manager>
      </div>
    </div>

    <div class="row">
      <div class="col-xs-12">
        <dburst-ai-manager #aiManagerInstance hidden></dburst-ai-manager>
        <button
          type="button"
          class="btn btn-default"
          (click)="askAiForHelp('cms.webportal')"
        >
          <i class="fa fa-magic"></i> Hey AI, Help Me With Web Portal / CMS ...
        </button>
      </div>
    </div>

    <!--<dburst-docker></dburst-docker>-->

  </div>
</ng-template> `;
