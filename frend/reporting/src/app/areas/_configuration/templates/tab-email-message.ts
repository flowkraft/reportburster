export const tabEmailMessageTemplate = `<ng-template #tabEmailMessageTemplate>
  <div class="well">

    <div class="row">

      <div class="col-xs-1">{{
        'AREAS.CONFIGURATION.TAB-EMAIL-MESSAGE.TO' | translate }}</div>
      <div class="col-xs-8">
        <input id="emailToAddress" [(ngModel)]="xmlSettings?.documentburster.settings.emailsettings.to"
          (ngModelChange)='settingsChangedEventHandler($event)' class="form-control" />
      </div>

      <div class="col-xs-3">
        <dburst-button-variables id="btnEmailToAddressVariables"
          (sendSelectedVariable)="updateFormControlWithSelectedVariable('emailToAddress',$event)">
        </dburst-button-variables>
      </div>

    </div>

    <p>
      <div class="row">

        <div class="col-xs-1">{{
          'AREAS.CONFIGURATION.TAB-EMAIL-MESSAGE.CC' | translate }}</div>
        <div class="col-xs-8">
          <input id="emailCcAddress" [(ngModel)]="xmlSettings?.documentburster.settings.emailsettings.cc"
            (ngModelChange)='settingsChangedEventHandler($event)' class="form-control" />
        </div>

        <div class="col-xs-3">
          <dburst-button-variables id="btnEmailCcAddressVariables"
            (sendSelectedVariable)="updateFormControlWithSelectedVariable('emailCcAddress',$event)">
          </dburst-button-variables>
        </div>

      </div>

      <p>
        <div class="row">

          <div class="col-xs-1">{{
            'AREAS.CONFIGURATION.TAB-EMAIL-MESSAGE.BCC' | translate }}</div>
          <div class="col-xs-8">
            <input id="emailBccAddress" [(ngModel)]="xmlSettings?.documentburster.settings.emailsettings.bcc"
              (ngModelChange)='settingsChangedEventHandler($event)' class="form-control" />
          </div>

          <div class="col-xs-3">
            <dburst-button-variables id="btnEmailBccAddressVariables"
              (sendSelectedVariable)="updateFormControlWithSelectedVariable('emailBccAddress',$event)">
            </dburst-button-variables>
          </div>

        </div>

        <p>
          <div class="row">

            <div class="col-xs-1">{{
              'AREAS.CONFIGURATION.TAB-EMAIL-MESSAGE.SUBJECT' | translate }}</div>
            <div class="col-xs-8">
              <input id="emailSubject" [(ngModel)]="xmlSettings?.documentburster.settings.emailsettings.subject"
                (ngModelChange)='settingsChangedEventHandler($event)' class="form-control" />
            </div>

            <div class="col-xs-3">
              <dburst-button-variables id="btnEmailSubjectVariables"
                (sendSelectedVariable)="updateFormControlWithSelectedVariable('emailSubject',$event)">
              </dburst-button-variables>
            </div>

          </div>

          <p></p>

          <div class="row">

            <div class="col-xs-1">{{
                'AREAS.CONFIGURATION.TAB-EMAIL-MESSAGE.MESSAGE' | translate }}</div>
            <div class="col-xs-8">

              <p-editor [style]="{'height':'250px'}"
                id="wysiwygEmailMessage"
                *ngIf="xmlSettings?.documentburster.settings.htmlemail && 
                !xmlSettings?.documentburster.settings.htmlemaileditcode"
                [(ngModel)]="xmlSettings?.documentburster.settings.emailsettings.html"
                (onTextChange)="settingsChangedQuillEventHandler($event)"
                (onSelectionChange)="onEditorSelectionChanged($event)"
                (onInit)="onEditorCreated($event)">
                <ng-template pTemplate="header">
                  <span class="ql-formats">
                    <button type="button" class="ql-bold" aria-label="Bold"></button>
                    <button type="button" class="ql-italic" aria-label="Italic"></button>
                    <button type="button" class="ql-underline" aria-label="Underline"></button>
                  </span>
                  <span class="ql-formats">
                    <button class="ql-list" value="ordered" aria-label="Ordered List" type="button"></button>
                    <button class="ql-list" value="bullet" aria-label="Unordered List" type="button"></button>
                  </span>
                </ng-template>
              </p-editor>

              <textarea class="form-control" rows="14" id="htmlCodeEmailMessage"
                *ngIf="xmlSettings?.documentburster.settings.htmlemail && xmlSettings?.documentburster.settings.htmlemaileditcode"
                [(ngModel)]="xmlSettings?.documentburster.settings.emailsettings.html"
                (ngModelChange)='settingsChangedEventHandler($event)'></textarea>

              <textarea class="form-control" rows="14" id="textEmailMessage"
                *ngIf="!xmlSettings?.documentburster.settings.htmlemail"
                [(ngModel)]="xmlSettings?.documentburster.settings.emailsettings.text"
                (ngModelChange)='settingsChangedEventHandler($event)'></textarea>

            </div>

            <div class="col-xs-3">

              <dburst-button-variables id="btnWysiwygEmailMessageVariables"
                (sendSelectedVariable)="updateQuillFormControlWithSelectedVariable($event)"
                *ngIf="xmlSettings?.documentburster.settings.htmlemail && !xmlSettings?.documentburster.settings.htmlemaileditcode">
              </dburst-button-variables>
              <dburst-button-variables id="btnHtmlCodeEmailMessageVariables"
                (sendSelectedVariable)="updateFormControlWithSelectedVariable('htmlCodeEmailMessage',$event)"
                *ngIf="xmlSettings?.documentburster.settings.htmlemail && xmlSettings?.documentburster.settings.htmlemaileditcode">
              </dburst-button-variables>
              <dburst-button-variables id="btnTextEmailMessageVariables"
                (sendSelectedVariable)="updateFormControlWithSelectedVariable('textEmailMessage',$event)"
                *ngIf="!xmlSettings?.documentburster.settings.htmlemail">
              </dburst-button-variables>

              <dburst-button-html-preview [htmlCode]="xmlSettings?.documentburster.settings.emailsettings.html"
                *ngIf="xmlSettings?.documentburster.settings.htmlemail && xmlSettings?.documentburster.settings.htmlemaileditcode">
              </dburst-button-html-preview>

              <!--
        
              <dburst-button-native-system-dialog value="{{
                  'AREAS.CONFIGURATION.TAB-EMAIL-MESSAGE.LOAD-TEMPLATE' | translate }}" dialogType="file"
                (pathsSelected)="onLoadHTMLTemplateClick($event)"
                *ngIf="xmlSettings?.documentburster.settings.htmlemail && xmlSettings.documentburster.settings.htmlemaileditcode">
              </dburst-button-native-system-dialog>

              <dburst-button-native-system-dialog value="{{
                  'AREAS.CONFIGURATION.TAB-EMAIL-MESSAGE.SAVE-TEMPLATE' | translate }}" dialogType="file"
                saveDialog="true" (pathsSelected)="onSaveHTMLTemplateClick($event)"
                *ngIf="xmlSettings?.documentburster.settings.htmlemail && xmlSettings.documentburster.settings.htmlemaileditcode">
              </dburst-button-native-system-dialog>
              -->

            </div>

          </div>

  </div>

</ng-template>
`;
