export const tabSamplesTemplate = `<ng-template #tabSamplesTemplate>
  <div class="well">
    
    <div class="row">

      <div class="col-xs-12"
        style="cursor: pointer; height: 480px; overflow: auto"
      >

        <table id="samplesTable"
          class="table table-responsive table-hover table-bordered"
          cellspacing="0"
        >
        
          <thead>
            
            <tr>
              <th style="width:11%">
                {{ 'AREAS.CONFIGURATION-TEMPLATES.TAB-CONF-TEMPLATES.NAME' |
                translate }}
              </th>
              <th style="width:14%">
                What It Does
              </th>
              <th style="width:22%">
                Input
              </th>
              <th>
                Expected Output
              </th>
              <th style="width:3%">
                 Actions
              </th>
         
            </tr>  
      
          </thead>
          <tbody>
            <tr
              id="tr{{sample.id}}"
              *ngFor="let sample of samplesService.samples"
              (click)="onSampleClick(sample)"
              [ngClass]="{ 'info': sample.activeClicked}"
            >
            <td id="td{{sample.id}}">{{sample.name}}<br><button id="btnSamplesLearnMode{{sample.id}}" type="button" class="btn btn-xs btn-primary" (click)="doShowSamplesLearnMoreModal(sample)">Learn More</button>
            </td>
            <td>
                <span class="label label-default" *ngIf="sample.step1 == 'merge'">
                  <i class="fa fa-plus-square-o">&nbsp;</i>
                  <em>1. Merge</em>                
                </span>
                <span class="label label-default" *ngIf="sample.step1 == 'split'">
                  <i class="fa fa-scissors">&nbsp;</i>
                  <em>1. Split </em>
                  <i class="fa fa-files-o">&nbsp;</i>               
                </span>
                <span class="label label-default" *ngIf="sample.step1 == 'mail-merge-emails'">
                  <i class="fa fa-list-ol">&nbsp;</i>
                  <em>1. Mail Merge </em>
                  <i class="fa fa-envelope-open-o">&nbsp;</i>
                </span>
                <span class="label label-default" *ngIf="sample.step1 == 'mail-merge-documents'">
                  <i class="fa fa-list-ol">&nbsp;</i>
                  <em>1. Mail Merge </em>
                  <i class="fa fa-file-word-o">&nbsp;</i>
                </span>
                <span class="label label-default" *ngIf="sample.step1 == 'split' && sample.step2 == 'split'">
                  <i class="fa fa-scissors">&nbsp;</i>
                  <em>2. Split once more </em>                
                  <i class="fa fa-files-o">&nbsp;</i>               
                </span>
                <span class="label label-default" *ngIf="sample.step1 != 'split' && sample.step2 == 'split'">
                  <i class="fa fa-scissors">&nbsp;</i>
                  <em>2. Split </em>                
                  <i class="fa fa-files-o">&nbsp;</i>               
                </span>
                <span class="label label-default" *ngIf="sample.step1 == 'generate'">
                   <i class="fa fa-list-ol">&nbsp;</i> 
                   <em>1. Generate </em>
                   <i class="fa fa-file-word-o">&nbsp;</i>               
                </span>
                <span class="label label-default" *ngIf="sample.step2 == 'email'">
                  <i class="fa fa-envelope-open-o">&nbsp;</i>
                 <em>2. Email</em> 
                </span>
                <span class="label label-default" *ngIf="sample.step3 == 'email'">
                  <i class="fa fa-envelope-open-o">&nbsp;</i>
                 <em>3. Email</em> 
                </span>
            </td>
            <td [innerHTML]="samplesService.getInputHtml(sample.id)"></td>
            <td [innerHTML]="samplesService.getOutputHtml(sample.id)"></td>
            <td>
            
              <button type="button" id="btnSampleTryIt{{sample.id}}" class="btn btn-xs btn-primary" (click)="doTryIt(sample)">&nbsp;&nbsp;&nbsp;&nbsp;Try it&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</button>
              <br><br>
              <!--
              <div class="btn-group dropup"> 
                  <button type="button" *ngIf="sample.visibility == 'visible'" class="btn btn-xs btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">&nbsp;&nbsp;Visible&nbsp;&nbsp;<span class="caret"></span></button>
                  <button type="button" *ngIf="sample.visibility == 'hidden'" class="btn btn-xs btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">&nbsp;&nbsp;<em>Hidden</em>&nbsp;&nbsp;<span class="caret"></span></button>
                <ul class="dropdown-menu dropdown-menu-right">
                  <li *ngIf="sample.visibility == 'visible'" (click)="doToggleSampleVisibility('hidden')">Hide <em>{{sample.name}}</em></li>
                  <li *ngIf="sample.visibility == 'hidden'" (click)="doToggleSampleVisibility('visible')">Show <em>{{sample.name}}</em></li>
                 </ul>
                  </div>
                -->
            </td>
            
            </tr>
          <tbody>
          
        </table>
      
      </div>

    </div>

    <p><br></p><p></p>
    <!-- 
    <div class="row">
    
      <div class="col-xs-3">
      <button
      id="btnHideAllSamples"
      type="button"
      class="btn btn-default"
      (click)="doHideAllSamples()"
      [disabled]="samplesService.countVisibleSamples <= 0"
        
      >
      <i class="fa fa-eye-slash"></i>&nbsp;Hide All Samples
    </button>
    
      </div>
    
      </div>
      -->
     
  </div>
</ng-template>
`;
