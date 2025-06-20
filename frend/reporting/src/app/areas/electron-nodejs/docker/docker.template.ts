export const dockerTemplate = `<!-- <ng-template #dockerTemplate> -->

<div *ngIf="!this.stateStore.configSys.sysInfo.setup.isRestartRequired">
    <span
      id="checkPointDockerPreRequisite"
      [innerHTML]="'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DOCKER.INNER-HTML.REQUIRED-SHORT' | translate"
    ></span>
    <span
      [innerHTML]="'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DOCKER.INNER-HTML.REQUIRED-LONG' | translate"
    ></span>

    <br /><br /><span
      [innerHTML]="'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DOCKER.INNER-HTML.EXTRA' | translate"
    ></span>

    <br />
    <div *ngIf="this.stateStore.configSys.sysInfo.setup.docker.isDockerOk">
      <br />
      <span class="label label-success"
        id="labelGreatDockerWasFound"><i class="fa fa-check-square-o"></i>&nbsp;<strong
          >{{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DOCKER.GREAT' | translate }},
          <em>Docker Desktop</em>
          {{this.stateStore.configSys.sysInfo.setup.docker.version}}
          {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DOCKER.FOUND' | translate }}
          <em>ReportBurster</em></strong
        ></span
      >
    </div>

    <div *ngIf="!this.stateStore.configSys.sysInfo.setup.docker.isDockerOk">
      <span class=" label label-warning"
        ><strong
          ><em>Docker Desktop</em>
          {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DOCKER.NOT-FOUND' | translate
          }}
        </strong></span
      >
      &nbsp;
      <span class="label label-primary"
        ><strong
          >{{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DOCKER.BELOW-INSTRUCTIONS' |
          translate }} <em>Docker Desktop</em></strong
        ></span
      >

      <br /><br />

      <dburst-chocolatey></dburst-chocolatey>
      <br />

      <span class="label label-success" *ngIf="this.stateStore.configSys.sysInfo.setup.chocolatey.isChocoOk"
        ><i class="fa fa-check-square-o"></i>&nbsp;<strong
          ><em>Chocolatey</em>
          {{this.stateStore.configSys.sysInfo.setup.chocolatey.version}}
          {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DOCKER.FOUND-READY' |
          translate }}
          <em>Docker Desktop</em></strong
        ></span
      >
      <span class="label label-warning" *ngIf="!this.stateStore.configSys.sysInfo.setup.chocolatey.isChocoOk"
        ><strong
          ><em>Chocolatey</em>
          {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DOCKER.NOT-FOUND' | translate
          }}, {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DOCKER.YOU-NEED-INSTALL' |
          translate }}
          <em>Chocolatey</em></strong
        ></span
      >

      <br /><br />

      <p-panel #pnlStep2DockerInstallation>
        <h4 id="checkPointInstallDocker">
          <u
            >{{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DOCKER.STEP2' | translate
            }} <em>Docker Desktop</em></u
          >
        </h4>

        <span
          [innerHTML]="'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DOCKER.INNER-HTML.REQUIRED-LONG' | translate"
        ></span>

        <br /><br />

        <button
          id="btnInstallDocker"
          type="button"
          class="btn btn-primary"
          [disabled]="!this.stateStore.configSys.sysInfo.setup.chocolatey.isChocoOk"
          (click)="installDocker()"
        >
          <i class="fa fa-play"></i
          >&nbsp;{{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DOCKER.INSTALL' |
          translate }} <em>Docker Desktop</em>
        </button>
        <span *ngIf="!this.stateStore.configSys.sysInfo.setup.chocolatey.isChocoOk"
          >&nbsp;&nbsp;<strong
            ><em
              >( {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DOCKER.FIRST' |
              translate }} )</em
            ></strong
          ></span
        >
      </p-panel>
    </div>
  </div>

  <div *ngIf="this.stateStore.configSys.sysInfo.setup.isRestartRequired">
    <p-panel #pnlRestartDocumentBurster>
      <h4 id="checkPointRestartDocumentBurster">
        <u
          >{{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DOCKER.RESTARTING' |
          translate }}
          <em>ReportBurster</em>
          {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DOCKER.RESTARTING-REQUIRED' |
          translate }}
        </u>
      </h4>

      <br />

      <button
        id="btnRestartDocumentBurster"
        type="button"
        class="btn btn-primary"
        (click)="restartApp()"
      >
        <i class="fa fa-play"></i
        >&nbsp;{{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DOCKER.RESTART' |
        translate }}Restart <em>ReportBurster</em>
      </button>
    </p-panel>
  </div>

  <!--  </ng-template>-->`;
