export const tabCmsWebPortalTemplate = `<ng-template
  #tabCmsWebPortalTemplate
>
  <div class="well">
    <div class="row" style="margin-bottom: 3px">
      <div class="col-xs-12">
        <a href="https://www.reportburster.com/docs/web-portal-cms" target="_blank" class="btn btn-primary btn-sm">
            <i class="fa fa-book"></i>&nbsp;ReportBurster Self-Service Web Portal (CMS)
        </a></div>
    </div>
    
    <br/>
    <div class="row">
      <div class="col-xs-12">
        <p>Set up ReportBurster Portal in no time — just like your very own (simple) web CMS — and start effortlessly distributing payroll, invoices, and reports through Internet. Take control of your reporting workflow and share documents securely and efficiently!</p>
      </div>
    </div>
    
    <div class="row" style="margin-top: 10px">
      <div class="col-xs-12">
        <dburst-apps-manager
          [dropdownDirection]="'expandedList'"
          [apps]="cmsPortalApp"
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
