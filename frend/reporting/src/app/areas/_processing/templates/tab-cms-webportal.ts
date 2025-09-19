export const tabCmsWebPortalTemplate = `<ng-template
  #tabCmsWebPortalTemplate
>
  <div class="well">
    <div class="row" style="margin-bottom: 3px">
      <div class="col-xs-12">
        <a href="https://www.reportburster.com/docs/cms-webportal" target="_blank" class="btn btn-primary btn-sm">
            <i class="fa fa-book"></i>&nbsp;ReportBurster Portal
        </a></div>
    </div>
    
    <br/>
    <div class="row">
      <div class="col-xs-12">
        <p>Set up ReportBurster Portal in no time—just like your very own (simple) web CMS—and start effortlessly distributing payroll, invoices, and reports through the internet. Take control of your reporting workflow and share documents securely and efficiently!</p>
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

    <!--<dburst-docker></dburst-docker>-->

  </div>
</ng-template> `;
