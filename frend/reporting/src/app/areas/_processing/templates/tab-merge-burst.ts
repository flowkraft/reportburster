export const tabMergeBurstTemplate = `<ng-template #tabMergeBurstTemplate>
  <div class="well">
    <div class="panel panel-default">
      <div class="panel-body">
        <div class="row">
          <div
            class="col-xs-10"
            style="cursor: pointer; height: 200px; overflow: auto"
          >
            <table
              id="filesTable"
              class="table table-responsive table-hover table-bordered"
              cellspacing="0"
            >
              <thead>
                <tr>
                  <th class="col-xs-3">
                    {{ 'AREAS.PROCESSING.TAB-MERGE-BURST.NAME' | translate }}
                  </th>
                  <!--
                  <th class="col-xs-9">
                    {{ 'AREAS.PROCESSING.TAB-MERGE-BURST.PATH' | translate }}
                  </th>
                  -->
                </tr>
              </thead>
              <tbody>
                <tr
                  *ngFor="let file of processingService.procMergeBurstInfo.inputFiles"
                  [ngClass]="{ 'info': file.selected
                  } "
                  (click)="onFileSelected(file)"
                >
                  <td>{{file.name}}</td>
                  <!--<td>{{file.path}}</td>-->
                </tr>
              </tbody>
            </table>
          </div>

          <div class="col-xs-2">
          <label for="mergeFilesUploadInput" class="btn btn-default btn-block"><i class="fa fa-folder-open-o' }}"></i>&nbsp;Add</label>
          <input id="mergeFilesUploadInput" type="file" multiple (change)="onFilesAdded($event)" #mergeFilesUploadInput style="display: none;" />           
          <!--  
          <dburst-button-native-system-dialog
              btnId="mergeFilesUploadInput"
              value="&nbsp;&nbsp;&nbsp;&nbsp;{{
              'AREAS.PROCESSING.TAB-MERGE-BURST.ADD' | translate }}"
              dialogType="files"
              (pathsSelected)="onFilesAdded($event)"
            ></dburst-button-native-system-dialog>
            -->
            
            <button
              id="btnDeletePdfFile"
              type="button"
              class="btn btn-default btn-block"
              (click)="onSelectedFileDelete()"
              [disabled]="!processingService.procMergeBurstInfo.selectedFile"
              style="margin-top: 5px"
            >
              <span class="glyphicon glyphicon-minus"></span>&nbsp;&nbsp;{{
              'AREAS.PROCESSING.TAB-MERGE-BURST.DELETE' | translate }}
            </button>

            <button
              id="btnUpPdfFile"
              type="button"
              class="btn btn-default btn-block"
              (click)="onSelectedFileUp()"
              [disabled]="!processingService.procMergeBurstInfo.selectedFile"
            >
              <span class="glyphicon glyphicon-arrow-up"></span>&nbsp;&nbsp;{{
              'AREAS.PROCESSING.TAB-MERGE-BURST.UP' | translate }}
            </button>

            <button
              id="btnDownPdfFile"
              type="button"
              class="btn btn-default btn-block"
              (click)="onSelectedFileDown()"
              [disabled]="!processingService.procMergeBurstInfo.selectedFile"
            >
              <span class="glyphicon glyphicon-arrow-down"></span>&nbsp;&nbsp;{{
              'AREAS.PROCESSING.TAB-MERGE-BURST.DOWN' | translate }}
            </button>

            <button
              id="btnClearPdfFiles"
              type="button"
              class="btn btn-default btn-block"
              (click)="onClearFiles()"
              [disabled]="processingService.procMergeBurstInfo.inputFiles.length === 0"
            >
              <i class="fa fa-eraser"></i>&nbsp;&nbsp;{{
              'AREAS.PROCESSING.TAB-MERGE-BURST.CLEAR' | translate }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="panel panel-default">
      <div class="panel-body">
        <div class="row">
          <div class="col-xs-2">
            {{ 'AREAS.PROCESSING.TAB-MERGE-BURST.MERGED-FILE-NAME' | translate
            }}
          </div>
          <div class="col-xs-9">
            <input
              id="mergedFileName"
              [(ngModel)]="processingService.procMergeBurstInfo.mergedFileName"
              (change)="saveMergedFileSetting();"
              class="form-control"
            />
          </div>
        </div>
        <div class="row">
          <div class="col-xs-2"></div>
          <div class="col-xs-9">
            <span
              id="mergedFileNameRequired"
              class="label label-default"
              *ngIf="!processingService.procMergeBurstInfo.mergedFileName"
              >{{ 'AREAS.PROCESSING.TAB-MERGE-BURST.MERGED-FILE-NAME-REQUIRED' |
              translate }}</span
            >
            <span
              id="mergedFileNamePdfExtensionRequired"
              class="label label-default"
              *ngIf="processingService.procMergeBurstInfo.mergedFileName && !processingService.procMergeBurstInfo.mergedFileName.endsWith('.pdf')"
              >{{
              'AREAS.PROCESSING.TAB-MERGE-BURST.MERGED-FILE-NAME-PDF-EXTENSION'
              | translate }}</span
            >
          </div>
        </div>

        <div class="row">
          <div class="col-xs-2"></div>
          <div class="col-xs-3">
            <div class="checkbox">
              <label id="btnBurstMergedFile">
                <input
                  type="checkbox"
                  [(ngModel)]="processingService.procMergeBurstInfo.shouldBurstResultedMergedFile"
                />
                {{ 'AREAS.PROCESSING.TAB-MERGE-BURST.BURST-MERGED-FILE' |
                translate }}
              </label>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-xs-2"></div>
          <div class="col-xs-1" style="margin-right: 20px">
            <button
              id="btnRun"
              type="button"
              class="btn btn-primary"
              (click)="doMergeBurst()"
              [disabled]="!processingService.procMergeBurstInfo.mergedFileName || !processingService.procMergeBurstInfo.mergedFileName.endsWith('.pdf') || processingService.procMergeBurstInfo.inputFiles.length<=1 || executionStatsService.jobStats.numberOfActiveJobs > 0"
            >
              <i class="fa fa-play"></i>&nbsp;{{
              'AREAS.PROCESSING.TAB-MERGE-BURST.RUN' | translate }}
            </button>
          </div>

          <div class="col-xs-3">
            <dburst-button-clear-logs></dburst-button-clear-logs>
          </div>

          <div class="col-xs-3" style="margin-left: -20px">
          <!--
            <dburst-button-native-system-dialog style="display: none;"
              value="{{
              'AREAS.PROCESSING.TAB-BURST.VIEW-REPORTS' | translate }}"
              dialogType="file"
            >
            </dburst-button-native-system-dialog>
            -->

          </div>
        </div>

        <div class="row">
          <div class="col-xs-2"></div>
          <div class="col-xs-9">
            <span
              id="twoOrMoreRequired"
              class="label label-default"
              *ngIf="processingService.procMergeBurstInfo.inputFiles.length<=1"
              >{{ 'AREAS.PROCESSING.TAB-MERGE-BURST.SELECT-2-OR-MORE' |
              translate }}</span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</ng-template>
`;
