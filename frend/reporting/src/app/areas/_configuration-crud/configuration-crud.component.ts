import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { leftMenuTemplate } from './templates/_left-menu';

@Component({
  selector: 'dburst-configuration-crud',
  template: `
    <aside class="main-sidebar">
      <section class="sidebar">
        ${leftMenuTemplate}
      </section>
    </aside>
    <div class="content-wrapper">
      <section class="content">
        <dburst-configuration-reports *ngIf="activeSection === 'reports'"></dburst-configuration-reports>
        <dburst-connection-list *ngIf="activeSection === 'connections'"></dburst-connection-list>
        <dburst-cube-list *ngIf="activeSection === 'cubes'"></dburst-cube-list>
      </section>
    </div>
  `,
})
export class ConfigurationCrudComponent implements OnInit {
  activeSection = 'reports';

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      if (params.section) {
        this.activeSection = params.section;
      } else {
        this.activeSection = 'reports';
      }
    });
  }
}
