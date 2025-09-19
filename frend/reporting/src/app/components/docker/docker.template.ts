export const dockerTemplate = `
  <!-- Docker Desktop not found -->
  <div class="row" *ngIf="!stateStore?.configSys?.sysInfo?.setup?.docker?.isDockerOk && !stateStore?.configSys?.sysInfo?.setup?.docker?.version">
    <br />
    <span class="label label-warning">
      <strong>
        <em>Docker Desktop</em>
        {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DOCKER.NOT-FOUND' | translate}}
      </strong>
    </span>
    <br />
    <br />
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

    <a href="#" [routerLink]="['/help', 'starterPacksMenuSelected']" [queryParams]="{activeTab: 'extraPackagesTab'}"
    skipLocationChange="true">
      <button id="btnInstallDockerTabPortal" type="button" class="btn btn-primary">
        {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DOCKER.INSTALL' | translate}}
        <em>Docker Desktop</em>
      </button>
    </a>
    <br/><br/>
  </div>

  <!-- Docker Desktop too old -->
  <div class="row" *ngIf="!stateStore?.configSys?.sysInfo?.setup?.docker?.isDockerOk && stateStore?.configSys?.sysInfo?.setup?.docker?.version">
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

    <a href="#" [routerLink]="['/help', 'starterPacksMenuSelected']" [queryParams]="{activeTab: 'extraPackagesTab'}"
    skipLocationChange="true">
      <button id="btnUpdateDockerTabPortal" type="button" class="btn btn-primary">
        {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DOCKER.UPDATE' | translate}}
        <em>Docker Desktop</em>
      </button>
    </a>
    <br/><br/>
  </div>
`;
