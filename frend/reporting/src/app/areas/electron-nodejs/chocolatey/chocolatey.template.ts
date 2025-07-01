export const chocolateyTemplate = ` <!--<ng-template #chocolateyTemplate> -->
  <p-panel #pnlStep1ChocoInstallation>
    <h4 id="checkPointChocolatey">
      <div *ngIf="!this.stateStore.configSys.sysInfo.setup.chocolatey.isChocoOk">
        <u
          >{{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.CHOCOLATEY.STEP1' |
          translate }} <em>Chocolatey</em></u
        >
      </div>
      <div *ngIf="this.stateStore.configSys.sysInfo.setup.chocolatey.isChocoOk">
        <s
          >{{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.CHOCOLATEY.STEP1' |
          translate }} <em>Chocolatey</em></s
        >&nbsp;&nbsp;<span class="label label-default"
          ><i class="fa fa-check-square-o"></i
          >&nbsp;{{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.CHOCOLATEY.INSTALLED'
          | translate }}</span
        >
      </div>
    </h4>
    <div
      [innerHTML]="'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.CHOCOLATEY.INNER-HTML.BEFORE-JAVA' | translate"
    ></div>
    <br /><br />
    <button
      id="btnInstallChocolatey"
      *ngIf="!this.stateStore.configSys.sysInfo.setup.chocolatey.isChocoOk"
      type="button"
      class="btn btn-primary"
      (click)="installChocolatey()"
    >
      <i class="fa fa-play"></i
      >&nbsp;{{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.JAVA.INSTALL' | translate
      }} <em>Chocolatey</em>
    </button>
  </p-panel>
  <!--</ng-template> -->`;
