export const tabCmsWebPortalTemplate = `<ng-template
  #tabCmsWebPortalTemplate
>
  <div class="well">
    <div class="row" style="margin-bottom: 3px">
      <div class="col-xs-12">
        <a href="https://www.reportburster.com/docs/cms-webportal" target="_blank" class="btn btn-default btn-sm">
            <i class="fa fa-book"></i>&nbsp;ReportBurster Portal
        </a></div>
    </div>
    
    <!-- Docker Desktop is installed - show normal content -->
    <div *ngIf="storeService.configSys.sysInfo.setup.docker.isDockerOk">
      <br/>
      <div class="row">
        <div class="col-xs-12">
          <p>Set up ReportBurster Portal in no time—just like your very own (simple) web CMS—and start effortlessly distributing payroll, invoices, and reports through the internet. Take control of your reporting workflow and share documents securely and efficiently!</p>
        </div>
      </div>
      
      <div class="row" style="margin-top: 10px">
        <div class="col-xs-12">
          <dburst-apps-manager
            [displayMode]="'expandedList'"
            [apps]="cmsPortalApp"
          >
          </dburst-apps-manager>
        </div>
      </div>
    
    </div>
    
    <!-- Docker Desktop not found -->
    <div class="row" *ngIf="!storeService.configSys.sysInfo.setup.docker.isDockerOk && !storeService.configSys.sysInfo.setup.docker.version">
      <br /><br />
      <span class="label label-warning">
        <strong>
          <em>Docker Desktop</em>
          {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DOCKER.NOT-FOUND' | translate}}
        </strong>
      </span>
      <br /><br />

      <span
        id="checkPointDockerPreRequisite"
        [innerHTML]="'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DOCKER.INNER-HTML.REQUIRED-SHORT' | translate"
      ></span>
      <span
        [innerHTML]="'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DOCKER.INNER-HTML.REQUIRED-LONG' | translate"
      ></span>

      <br /><br />
      <span
        [innerHTML]="'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DOCKER.INNER-HTML.EXTRA' | translate"
      ></span>

      <br /><br />

      <a href="#" [routerLink]="['/help', 'installSetupMenuSelected']"
      skipLocationChange="true">
        <button id="btnInstallDockerTabPortal" type="button" class="btn btn-primary">
          {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DOCKER.INSTALL' | translate}}
          <em>Docker Desktop</em>
        </button>
      </a>
    </div>

    <!-- Docker Desktop too old -->
    <div class="row" *ngIf="!storeService.configSys.sysInfo.setup.docker.isDockerOk && storeService.configSys.sysInfo.setup.docker.version">
      <br /><br />
      <span id="dockerInstallationOld" class="label label-warning">
        <strong>
          <em>Docker Desktop</em>
          {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DOCKER.TOO-OLD' | translate}}
        </strong>
      </span>
      
      <br /><br />

      <span
        id="checkPointDockerPreRequisite"
        [innerHTML]="'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DOCKER.INNER-HTML.REQUIRED-SHORT' | translate"
      ></span>
      
      <br /><br />

      <span
        [innerHTML]="'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DOCKER.INNER-HTML.TOO-OLD' | translate"
      ></span>

      <br /><br />

      <a href="#" [routerLink]="['/help', 'installSetupMenuSelected']"
      skipLocationChange="true">
        <button id="btnUpdateDockerTabPortal" type="button" class="btn btn-primary">
          {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DOCKER.UPDATE' | translate}}
          <em>Docker Desktop</em>
        </button>
      </a>
    </div>

  </div>
</ng-template> `;
