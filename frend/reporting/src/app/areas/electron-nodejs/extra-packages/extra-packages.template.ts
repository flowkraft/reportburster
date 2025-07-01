export const extraPackagesTemplate = `<!-- <ng-template #extraPackagesTemplate> -->

  <div *ngIf="this.stateStore.configSys.sysInfo.setup.chocolatey.isChocoOk">
    <span [innerHTML]="'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.EXTRA-PACKAGES.INNER-HTML.ABOUT' | translate"></span>
    <div
      *ngFor="let extraPackage of this.extraPackages"
      [ngClass]="{'panel panel-primary': extraPackage.status != 'not-installed', 'panel panel-default' : extraPackage.status == 'not-installed' }"
    >
      <div class="panel-heading">
        <h3 class="panel-title">
          <a href="{{extraPackage.website}}" target="_blank"
            ><span>{{extraPackage.website}}</span
            >&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <span *ngIf="extraPackage.status == 'not-installed'"
              ><em>{{ 'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.EXTRA-PACKAGES.INSTALLED.NOT' | translate }}</em></span
            ><span *ngIf="extraPackage.status != 'not-installed'"
              ><strong><u>{{ 'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.EXTRA-PACKAGES.INSTALLED.ALREADY' | translate }}</u></strong></span
            ></a
          >
          
        </h3>
      </div>

      <div id="package-{{extraPackage.id}}" class="panel-body">
        <a href="{{extraPackage.website}}" target="_blank">
          <img *ngIf="extraPackage.icon && extraPackage.icon.length > 0" src="assets/images/{{extraPackage.icon}}" height="48" />
          {{extraPackage.name}}
        </a>
        {{extraPackage.description}}
        
        <!-- Show dependency information if it exists -->
        <div *ngIf="extraPackage.dependsOn && extraPackage.dependsOn.length > 0">
          <br/>Depends on: <em><strong>{{extraPackage.dependsOn}}</strong></em>
        </div>
        
        <!-- Only show commands if they exist -->
        <div *ngIf="extraPackage.cmdInstall && extraPackage.cmdInstall.length > 0">
          <br/>{{ 'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.EXTRA-PACKAGES.COMMANDS.INSTALL' | translate }}:&nbsp;<em><strong>{{extraPackage.cmdInstall}}</strong></em>
        </div>
        
        <div *ngIf="extraPackage.cmdUnInstall && extraPackage.cmdUnInstall.length > 0">
          <br/>{{ 'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.EXTRA-PACKAGES.COMMANDS.UNINSTALL' | translate }}:&nbsp;<em><strong>{{extraPackage.cmdUnInstall}}</strong></em>
        </div>
        
        <div *ngIf="extraPackage.cmdGetInfo && extraPackage.cmdGetInfo.length > 0">
          <br/>{{ 'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.EXTRA-PACKAGES.COMMANDS.GET-INFO' | translate }}:&nbsp;<em><strong>{{extraPackage.cmdGetInfo}}</strong></em>
        </div>
        
        <br />
      </div>
      
    </div>
  </div>
  <!--  </ng-template>-->`;
