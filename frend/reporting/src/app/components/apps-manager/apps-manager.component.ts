import { Component, Input, OnInit } from '@angular/core';
import { ShellService } from '../../providers/shell.service';
import { ToastrMessagesService } from '../../providers/toastr-messages.service';
import { AppsManagerService, ManagedApp } from './apps-manager.service';

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
   protected appsManagerService: AppsManagerService
  ) {}

  ngOnInit(): void {
    // Initialize app states, perhaps by checking their status if possible
    // For now, we'll default them to 'unknown' or 'stopped'
    this.apps.forEach(app => app.state = 'stopped');
  }

  
}