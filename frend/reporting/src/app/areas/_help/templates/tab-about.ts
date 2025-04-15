export const tabAboutTemplate = `<ng-template #tabAboutTemplate>
  <div class="well">

    <strong>{{
      'AREAS.HELP.TAB-ABOUT.VERSION' | translate }}</strong>
    <br>
    <br>
    <span class="label label-default">
      <em>{{settingsService.product}}</em>&nbsp;{{settingsService.version}}
    </span>

    <hr>
    <div [innerHTML]="'AREAS.HELP.TAB-ABOUT.INNER-HTML.LICENSE-2-OPTIONS' | translate"></div>

    <br>
    <br>
    <ol>
      <li>{{
        'AREAS.HELP.TAB-ABOUT.PURCHASE-COMMERCIAL-LICENSE' | translate }}&nbsp;
        <a href="https://www.pdfburst.com/store" target="_blank">
          <button class="btn btn-primary btn-xs" type="button">{{
            'AREAS.HELP.TAB-ABOUT.BUY-NOW' | translate }}</button>
        </a>
      </li>
      <li>
        Server Side Public License (SSPL) v1.0 Open Source License  
      </li>
    </ol>

    <hr>

    <strong id='checkPointHelpAbout'>{{
      'AREAS.HELP.TAB-ABOUT.COPYRIGHT' | translate }}</strong>
    <br>
    <br>
    <a href="https://www.reportburster.com/contact.html" target="_blank">&#9400; {{
      'AREAS.HELP.TAB-ABOUT.COPYRIGHT-YEARS' | translate }}</a>

  </div>
</ng-template>
`;
