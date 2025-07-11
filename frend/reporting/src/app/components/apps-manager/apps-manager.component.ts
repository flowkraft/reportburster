import { Component, Input, OnInit } from '@angular/core';
import { ShellService } from '../../providers/shell.service';
import { ToastrMessagesService } from '../../providers/toastr-messages.service';
import { AppsManagerService, ManagedApp } from './apps-manager.service';
import { ConfirmService } from '../dialog-confirm/confirm.service';

// This interface should be defined in a shared models file


@Component({
  selector: 'dburst-apps-manager',
  templateUrl: './apps-manager.template.html',
})
export class AppsManagerComponent implements OnInit {
  @Input() apps: ManagedApp[] = [];
  @Input() dropdownDirection: 'up' | 'down' | 'expandedList' = 'down';

  // We can add more specific inputs if needed, e.g., for single-app display
  // @Input() appId: string;

  constructor(
   protected appsManagerService: AppsManagerService,
   protected confirmService: ConfirmService,
       
  ) {}

  async ngOnInit(): Promise<void> {
    //this.apps = await this.appsManagerService.getAllApps();
  }

  
  async onToggleApp(app: ManagedApp) {
    let dialogQuestion = `Start ${app.name}?`;
    if (app.state === 'running') {
      dialogQuestion = `Stop ${app.name}?`;
    }

    this.confirmService.askConfirmation({
      message: dialogQuestion,
      confirmAction: async () => {
        await this.appsManagerService.toggleApp(app);
        // Refresh the app state after toggling
        if (this.apps && this.apps.length > 0) {
          const ids = this.apps.map(a => a.id);
          this.apps = await Promise.all(ids.map(id => this.appsManagerService.getAppById(id)));
        }
      }
    });
  }

}