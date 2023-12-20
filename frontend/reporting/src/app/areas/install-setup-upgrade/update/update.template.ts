export const updateTemplate = `<div *ngIf="succint">
    <!--
  <div id="updateNowSuccint" *ngIf="licenseService?.isNewerVersionAvailable">
    <u
      ><em>{{ settingsService?.product }}</em
      >&nbsp;{{ licenseService?.latestVersion }}</u
    >
    {{
      "AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.UPDATE-NOW.IS-AVAILABLE"
        | translate
    }}!&nbsp;
    <button
      type="button"
      class="btn btn-primary btn-xs"
      (click)="handleUpdateNow()"
      [disabled]="executionStatsService?.jobStats.numberOfActiveJobs > 0"
    >
      {{
        "AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.UPDATE-NOW.UPDATE-NOW"
          | translate
      }}</button
    >&nbsp;<span
      *ngIf="executionStatsService?.logStats.updateErrMessage"
      class="label label-danger"
      >{{ "AREAS.STATUS-BAR.UPDATE-DOWNLOAD-ERROR" | translate }}</span
    >
  </div>-->
  </div>
  <div *ngIf="!succint">
    <div *ngIf="!licenseService?.isNewerVersionAvailable">
      <h4>
        <span class="label label-default"
          >{{ "AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.UPDATE-NOW.NOTHING-UPDATE"
          | translate }}</span
        >
        ({{ "AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.UPDATE-NOW.LATEST-VERSION" |
        translate }})
      </h4>
    </div>
    <div *ngIf="licenseService?.isNewerVersionAvailable">
      <br />
      <strong
        >{{ "AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.UPDATE-NOW.UPDATED-VERSION"
        | translate }}
        <em>{{ settingsService?.product }}</em>
        {{ "AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.UPDATE-NOW.IS-AVAILABLE" |
        translate }}.</strong
      >
      <br />
      <br />
      {{ "AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.UPDATE-NOW.YOU-CAN" | translate
      }}
      <u
        ><em>{{ settingsService?.product }}</em>&nbsp;{{
        licenseService?.latestVersion }}</u
      >
      {{ "AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.UPDATE-NOW.AUTOMATICALLY" |
      translate }}.
      <br />
      <br />
      <button
        type="button"
        class="btn btn-primary"
        (click)="handleUpdateNow()"
        [disabled]="executionStatsService?.jobStats.numberOfActiveJobs > 0"
      >
        {{ "AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.UPDATE-NOW.UPDATE-NOW" |
        translate }}</button
      >&nbsp;<span
        *ngIf="executionStatsService?.logStats.updateErrMessage"
        class="label label-danger"
        >{{ "AREAS.STATUS-BAR.UPDATE-DOWNLOAD-ERROR" | translate }}</span
      >
      <br />
      <br />
      {{ "AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.UPDATE-NOW.WAIT1" | translate
      }}
      <em>{{ settingsService?.product }}</em>
      {{ "AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.UPDATE-NOW.WAIT2" | translate
      }},
      <em>{{ settingsService?.product }}</em>
      {{ "AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.UPDATE-NOW.WAIT3" | translate
      }}.
      <br /><br />
      <dburst-when-updating></dburst-when-updating>
    </div>
    <div class="row" *ngIf="!licenseService?.isNewerVersionAvailable">
      <hr />
      <div class="col-xs-12">
        <input
          type="checkbox"
          id="btnLetMeUpdateManually"
          [(ngModel)]="letMeUpdateManually"
        />
        <label for="btnLetMeUpdateManually" class="checkboxlabel"
          >{{ "AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.UPDATE-NOW.LET-ME1" |
          translate }}
          <em>{{ settingsService?.product }}</em>
          {{ "AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.UPDATE-NOW.LET-ME2" |
          translate }}
        </label>
      </div>
    </div>
    <br />
    <div *ngIf="letMeUpdateManually">
      <div class="row">
        <div class="col-xs-9">
          <input
            id="oldDbInstallationFolder"
            [(ngModel)]="letMeUpdateSourceDirectoryPath"
            class="form-control"
            autofocus
            required
          /><em
            >(*) {{ "AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.UPDATE-NOW.SELECT" |
            translate }} DocumentBurster.exe</em
          >
        </div>

        <div class="col-xs-3">
          <dburst-button-native-system-dialog
            value="Select"
            dialogType="folder"
            (pathsSelected)="onExistingInstallationFolderSelected($event)"
          ></dburst-button-native-system-dialog>
        </div>
      </div>
      <br />
      <div class="row" *ngIf="letMeUpdateSourceDirectoryPath">
        <div
          class="col-xs-12"
          *ngIf="updateInfo?.errorMsg"
          style="overflow-x: scroll"
        >
          <span id="errorMsg" class="label label-warning" style="word-wrap: break-word"
            >{{ updateInfo?.errorMsg }}</span
          >
        </div>
        <div
          class="col-xs-9"
          *ngIf="!updateInfo?.errorMsg"
          style="height: 350px; overflow-y: scroll; overflow-x: auto"
        >
          <dburst-when-updating [updateInfo]="updateInfo"></dburst-when-updating
          ><br />
          <strong
            >{{ "AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.UPDATE-NOW.FOLLOWING1" |
            translate }} {{ updateInfo?.updateSourceDirectoryPath }}
            <span *ngIf="updateInfo?.updateSourceVersion"
              >(v{{ updateInfo?.updateSourceVersion }})</span
            >
            {{ "AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.UPDATE-NOW.FOLLOWING2" |
            translate }} {{ homeDirectoryPath }} (v{{ settingsService?.version
            }})</strong
          >
          <br /><br />
          <strong
            >{{ "AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.UPDATE-NOW.FOLLOWING3" |
            translate }}</strong
          ><br /><br />
          <ol>
            <li *ngFor="let configFile of updateInfo?.migrateConfigFiles">
              {{ configFile[0] }} - {{ configFile[1] }}
            </li>
          </ol>
          <br />
          <strong *ngIf="updateInfo?.migrateScriptFiles.length == 0"
            ><u
              >{{ "AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.UPDATE-NOW.FOLLOWING4"
              | translate }}</u
            ></strong
          >
          <div *ngIf="updateInfo?.migrateScriptFiles.length > 0">
            <strong
              >{{ "AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.UPDATE-NOW.FOLLOWING5"
              | translate }}</strong
            ><br /><br />
            <ol>
              <li *ngFor="let scriptFile of updateInfo?.migrateScriptFiles">
                {{ scriptFile[0] }} - {{ scriptFile[1] }}
              </li>
            </ol>
          </div>
          <br />
          <strong *ngIf="updateInfo?.templatesFolders.length == 0"
            ><u
              >{{ "AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.UPDATE-NOW.FOLLOWING6"
              | translate }}</u
            ></strong
          >
          <div *ngIf="updateInfo?.templatesFolders.length > 0">
            <strong
              >{{ "AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.UPDATE-NOW.FOLLOWING7"
              | translate }}</strong
            ><br /><br />
            <ol>
              <li *ngFor="let templatesFolder of updateInfo?.templatesFolders">
                {{ templatesFolder[0] }} - {{ templatesFolder[1] }}
              </li>
            </ol>
          </div>
        </div>
        <div class="col-xs-9" *ngIf="!updateInfo?.errorMsg && letMeUpdateSourceDirectoryPath !='testground/upgrade/baseline/DocumentBurster'">
          <br />
          <button
            id="btnMigrate"
            type="button"
            class="btn btn-primary"
            (click)="handleMigrateCopyAboveFiles()"
            [disabled]="executionStatsService?.jobStats.numberOfActiveJobs > 0"
          >
            <i class="fa fa-arrow-up"></i>&nbsp;{{
            "AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.UPDATE-NOW.FOLLOWING13" |
            translate }}
          </button>
        </div>
        <div class="col-xs-9" *ngIf="letMeUpdateSourceDirectoryPath =='testground/upgrade/baseline/DocumentBurster'">
        <br />
        <button
          id="btnE2EFillInfo"
          type="button"
          class="btn btn-primary"
          (click)="onExistingInstallationFolderSelected('testground/upgrade/baseline/DocumentBurster')"
        >
          <i class="fa fa-arrow-up"></i>&nbsp;Fill Info
        </button>
      </div>
      </div>
    </div>
  </div> `;
