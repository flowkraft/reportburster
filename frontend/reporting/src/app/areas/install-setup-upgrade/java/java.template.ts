export const javaTemplate = `<!-- <ng-template #javaTemplate> -->

  <div *ngIf="!bashService.isRestartRequired">
    <strong
      id="checkPointJavaPreRequisite"
      [innerHTML]="'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.JAVA.INNER-HTML.REQUIRED-SHORT' | translate"
    ></strong>

    <br /><br /><span
      [innerHTML]="'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.JAVA.INNER-HTML.REQUIRED-LONG' | translate"
    ></span>

    <br />
    <div *ngIf="bashService.isJavaOk">
      <br />
      <span class="label label-success"
        ><i class="fa fa-check-square-o"></i>&nbsp;<strong
          >{{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.JAVA.GREAT' | translate }},
          <em>Java</em>
          {{bashService.javaVersion}}
          {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.JAVA.FOUND' | translate }}
          <em>DocumentBurster</em></strong
        ></span
      >
    </div>

    <div *ngIf="!bashService.isJavaOk">
      <span class=" label label-warning"
        ><strong
          ><em>Java</em>
          {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.JAVA.NOT-FOUND' | translate
          }}
        </strong></span
      >
      &nbsp;
      <span class="label label-primary"
        ><strong
          >{{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.JAVA.BELOW-INSTRUCTIONS' |
          translate }} <em>Java</em></strong
        ></span
      >

      <br /><br />

      <dburst-chocolatey></dburst-chocolatey>
      <br />

      <span class="label label-success" *ngIf="bashService.isChocoOk"
        ><i class="fa fa-check-square-o"></i>&nbsp;<strong
          ><em>Chocolatey</em>
          {{bashService.chocoVersion}}
          {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.JAVA.FOUND-READY' |
          translate }}
          <em>Java</em></strong
        ></span
      >
      <span class="label label-warning" *ngIf="!bashService.isChocoOk"
        ><strong
          ><em>Chocolatey</em>
          {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.JAVA.NOT-FOUND' | translate
          }}, {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.JAVA.YOU-NEED-INSTALL' |
          translate }}
          <em>Chocolatey</em></strong
        ></span
      >

      <br /><br />

      <p-panel #pnlStep2JavaInstallation>
        <h4 id="checkPointInstallJava">
          <u
            >{{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.JAVA.STEP2' | translate
            }} <em>Java</em></u
          >
        </h4>

        <span
          [innerHTML]="'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.JAVA.INNER-HTML.REQUIRED-LONG' | translate"
        ></span>

        <br /><br />

        <button
          id="btnInstallJava"
          type="button"
          class="btn btn-primary"
          [disabled]="!bashService.isChocoOk"
          (click)="installJava()"
        >
          <i class="fa fa-play"></i
          >&nbsp;{{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.JAVA.INSTALL' |
          translate }} <em>Java</em>
        </button>
        <span *ngIf="!bashService.isChocoOk"
          >&nbsp;&nbsp;<strong
            ><em
              >( {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.JAVA.FIRST' |
              translate }} )</em
            ></strong
          ></span
        >
      </p-panel>
    </div>
  </div>

  <div *ngIf="bashService.isRestartRequired">
    <p-panel #pnlRestartDocumentBurster>
      <h4 id="checkPointRestartDocumentBurster">
        <u
          >{{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.JAVA.RESTARTING' |
          translate }}
          <em>DocumentBurster</em>
          {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.JAVA.RESTARTING-REQUIRED' |
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
        >&nbsp;{{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.JAVA.RESTART' |
        translate }}Restart <em>DocumentBurster</em>
      </button>
    </p-panel>
  </div>

  <!--  </ng-template>-->`;
