export const terminalTemplate = `
<!-- <ng-template #terminalTemplate> -->
<p-sidebar
  [(visible)]="availableCommandsVisible"
  position="right"
  [closeOnEscape]
  [style]="{width:'30em'}"
>
  <br /><br /><br /><br /><br />
  <strong
    >{{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.TERMINAL.MAIN-COMMANDS' |
    translate }}</strong
  >
  <br /><br />
  <ol>
    <li>
      <span
        [innerHTML]="'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.TERMINAL.INNER-HTML.FIND-JAVA-VERSION' | translate"
      ></span
      >: <code>java --version</code>
    </li>
    <li>
      <span
        [innerHTML]="'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.TERMINAL.INNER-HTML.FIND-CHOCOLATEY-VERSION' | translate"
      ></span
      >: <code>choco --version</code>
    </li>
    <li>
      <span
        [innerHTML]="'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.TERMINAL.INNER-HTML.INSTALL-CHOCOLATEY' | translate"
      ></span
      >: <code>install chocolatey</code>
    </li>
    <li>
      <span
        [innerHTML]="'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.TERMINAL.INNER-HTML.UNINSTALL-CHOCOLATEY' | translate"
      ></span
      >: <code>uninstall chocolatey</code>
    </li>
    <li>
      <span
        [innerHTML]="'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.TERMINAL.INNER-HTML.INSTALL-JAVA' | translate"
      ></span
      >: <code>choco install openjdk --yes</code>
    </li>
    <li>
      <span
        [innerHTML]="'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.TERMINAL.INNER-HTML.UNINSTALL-JAVA' | translate"
      ></span
      >: <code>choco uninstall openjdk --yes</code>
    </li>
  </ol>
  <br />
  <strong
    >{{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.TERMINAL.OTHER-COMMANDS' |
    translate }}</strong
  >
  <br /><br />
  <ol>
    <li>
      <span
        [innerHTML]="'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.TERMINAL.INNER-HTML.INSTALL-JAVA8' | translate"
      ></span
      >: <code>choco install jre8 --yes</code>
    </li>
    <li>
      <span
        [innerHTML]="'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.TERMINAL.INNER-HTML.INSTALL-JAVA8-32BIT' | translate"
      ></span
      >: <code>choco install jre8 -PackageParameters "/exclude:64" --yes</code>
    </li>
    <li>
      <span
        [innerHTML]="'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.TERMINAL.INNER-HTML.UNINSTALL-JAVA8' | translate"
      ></span
      >: <code>choco uninstall jre8 --yes</code>
    </li>
  </ol>
</p-sidebar>

<p-panel #pnlTerminal header="{{headerLevel}}" (keydown)="honourReadOnly()">
  <p-terminal id="p-terminal" prompt="documentburster> "></p-terminal>
</p-panel>

<button
  id="btnToggleReadOnly"
  type="button"
  [ngClass]="{'btn': true, 'btn-md': true, 'btn-primary': !readOnly,'btn-default': readOnly}"
  (click)="toggleReadOnly()"
>
  <i class="fa fa-keyboard-o"></i>&nbsp;<em
    ><span *ngIf="readOnly"
      >{{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.TERMINAL.LET-ME' | translate
      }}</span
    >
    <span *ngIf="!readOnly"
      >{{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.TERMINAL.IM-DONE' | translate
      }}</span
    ></em
  >
</button>

<span *ngIf="readOnly"
  >&nbsp;&nbsp;(<strong
    >{{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.TERMINAL.I-KNOW' | translate
    }}</strong
  >)</span
>
<button
  type="button"
  class="btn btn-link"
  *ngIf="!readOnly"
  (click)="availableCommandsVisible = true"
>
  {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.TERMINAL.VIEW-AVAILABLE-COMMANDS' |
  translate }}
</button>

<!--  </ng-template>-->
`;
