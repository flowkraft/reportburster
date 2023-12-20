export const extraPackagesTemplate = `<!-- <ng-template #extraPackagesTemplate> -->

  <div *ngIf="bashService.isChocoOk">
    <h5>
      <strong
        >Do more with <em>DocumentBurster</em> by installing more useful 
        packages</strong
      >
    </h5>
    <br />

    <div
      *ngFor="let extraPackage of this.extraPackages"
      [ngClass]="{'panel panel-primary': extraPackage.status != 'not-installed', 'panel panel-default' : extraPackage.status == 'not-installed' }"
    >
      <div class="panel-heading">
        <h3 class="panel-title">
          <a href="{{extraPackage.website}}" target="_blank"
            >{{extraPackage.name}}
            <span *ngIf="extraPackage.status == 'not-installed'"
              >(<em>not installed</em>)</span
            ><span *ngIf="extraPackage.status != 'not-installed'"
              >(<em>installed</em>)</span
            ></a
          >
          &nbsp;
          <button
            id="btnInstall"
            type="button"
            class="btn btn-xs btn-primary"
            *ngIf="extraPackage.status === 'not-installed'"
            (click)="doInstallUninstallAction(extraPackage, 'install')"
            [disabled]="executionStatsService.jobStats.numberOfActiveJobs > 0"
          >
            <strong
              >{{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.JAVA.INSTALL' |
              translate }}&nbsp;{{extraPackage.name}}</strong
            >
          </button>
          <button
            id="btnUnInstall"
            type="button"
            class="btn btn-xs btn-default"
            *ngIf="extraPackage.status === 'installed'"
            (click)="doInstallUninstallAction(extraPackage, 'uninstall')"
            [disabled]="executionStatsService.jobStats.numberOfActiveJobs > 0"
          >
            <strong
              >{{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.JAVA.UNINSTALL' |
              translate }}&nbsp;{{extraPackage.name}}</strong
            >
          </button>
        </h3>
      </div>

      <div class="panel-body">
        <a href="{{extraPackage.website}}" target="_blank"
          ><img src="assets/images/{{extraPackage.icon}}" />
          {{extraPackage.name}}</a
        >
        {{extraPackage.description}}
        <br />
      </div>
    </div>
  </div>
  <!--  </ng-template>-->`;
