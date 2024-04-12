import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ViewChild,
  TemplateRef,
  AfterViewChecked,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';

//import RSS from 'vanilla-rss';

import { leftMenuTemplate } from './templates/_left-menu';
import { tabsTemplate } from './templates/_tabs';

import { tabSupportTemplate } from './templates/tab-support';
import { tabDocumentationTemplate } from './templates/tab-documentation';
import { tabServicesTemplate } from './templates/tab-services';
import { tabExamplesTemplate } from './templates/tab-examples';
import { tabFreeTemplate } from './templates/tab-free';
import { tabReviewsTemplate } from './templates/tab-reviews';
import { tabBlogTemplate } from './templates/tab-blog';
import { tabAboutTemplate } from './templates/tab-about';
import { tabJavaTemplate } from './templates/tab-java';
import { tabTerminalTemplate } from './templates/tab-terminal';
import { tabExtraPackagesTemplate } from './templates/tab-extra-packages';
import { tabSystemDiagnosticsTemplate } from './templates/tab-system-diagnostics';
import { tabUpdateTemplate } from './templates/tab-update';
import { tabComparisonTemplate } from './templates/tab-comparison';
import { tabLogsTemplate } from './templates/tab-logs';
import { tabLicenseTemplate } from './templates/tab-license';
import { SettingsService } from '../../providers/settings.service';
import Utilities from '../../helpers/utilities';
//import { ElectronService } from '../../core/services/electron/electron.service';

@Component({
  selector: 'dburst-help',
  template: `
    <aside class="main-sidebar">
      <section class="sidebar">${leftMenuTemplate}</section>
    </aside>
    <div class="content-wrapper">
      <section class="content"><div>${tabsTemplate}</div></section>
    </div>
    ${tabSupportTemplate} ${tabDocumentationTemplate} ${tabServicesTemplate}
    ${tabExamplesTemplate} ${tabFreeTemplate} ${tabReviewsTemplate}
    ${tabBlogTemplate} ${tabJavaTemplate} ${tabTerminalTemplate}
    ${tabExtraPackagesTemplate} ${tabSystemDiagnosticsTemplate}
    ${tabUpdateTemplate} ${tabAboutTemplate} ${tabComparisonTemplate}
    ${tabLogsTemplate} ${tabLicenseTemplate}
  `,
})
export class HelpComponent implements OnInit, AfterViewChecked {
  @ViewChild('tabSupportTemplate', { static: true })
  tabSupportTemplate: TemplateRef<any>;
  @ViewChild('tabDocumentationTemplate', { static: true })
  tabDocumentationTemplate: TemplateRef<any>;
  @ViewChild('tabServicesTemplate', { static: true })
  tabServicesTemplate: TemplateRef<any>;

  @ViewChild('tabExamplesTemplate', { static: true })
  tabExamplesTemplate: TemplateRef<any>;
  @ViewChild('tabFreeTemplate', { static: true })
  tabFreeTemplate: TemplateRef<any>;
  @ViewChild('tabReviewsTemplate', { static: true })
  tabReviewsTemplate: TemplateRef<any>;

  @ViewChild('tabBlogTemplate', { static: true })
  tabBlogTemplate: TemplateRef<any>;

  @ViewChild('tabJavaTemplate', { static: true })
  tabJavaTemplate: TemplateRef<any>;

  @ViewChild('tabTerminalTemplate', { static: true })
  tabTerminalTemplate: TemplateRef<any>;

  @ViewChild('tabExtraPackagesTemplate', { static: true })
  tabExtraPackagesTemplate: TemplateRef<any>;

  @ViewChild('tabSystemDiagnosticsTemplate', { static: true })
  tabSystemDiagnosticsTemplate: TemplateRef<any>;

  @ViewChild('tabUpdateTemplate', { static: true })
  tabUpdateTemplate: TemplateRef<any>;

  @ViewChild('tabAboutTemplate', { static: true })
  tabAboutTemplate: TemplateRef<any>;
  @ViewChild('tabComparisonTemplate', { static: true })
  tabComparisonTemplate: TemplateRef<any>;

  @ViewChild('tabLogsTemplate', { static: true })
  tabLogsTemplate: TemplateRef<any>;
  @ViewChild('tabLicenseTemplate', { static: true })
  tabLicenseTemplate: TemplateRef<any>;

  protected visibleTabs: {
    id: string;
    heading: string;
    ngTemplateOutlet: string;
  }[];

  ALL_TABS = [
    {
      id: 'supportTab',
      heading: 'AREAS.HELP.TABS.SUPPORT',
      ngTemplateOutlet: 'tabSupportTemplate',
    },
    {
      id: 'docsTab',
      heading: 'AREAS.HELP.TABS.DOCUMENTATION',
      ngTemplateOutlet: 'tabDocumentationTemplate',
    },
    {
      id: 'servicesTab',
      heading: 'AREAS.HELP.TABS.SERVICES',
      ngTemplateOutlet: 'tabServicesTemplate',
    },
    {
      id: 'useCasesTab',
      heading: 'AREAS.HELP.TABS.EXAMPLES',
      ngTemplateOutlet: 'tabExamplesTemplate',
    },
    {
      id: 'freeForSchoolsTab',
      heading: 'AREAS.HELP.TABS.FREE',
      ngTemplateOutlet: 'tabFreeTemplate',
    },
    {
      id: 'reviewsTab',
      heading: 'AREAS.HELP.TABS.REVIEWS',
      ngTemplateOutlet: 'tabReviewsTemplate',
    },
    {
      id: 'blogTab',
      heading: 'AREAS.HELP.TABS.BLOG',
      ngTemplateOutlet: 'tabBlogTemplate',
    },
    {
      id: 'javaTab',
      heading: 'AREAS.HELP.TABS.JAVA',
      ngTemplateOutlet: 'tabJavaTemplate',
    },
    {
      id: 'systemDiagnosticsTab',
      heading: 'AREAS.HELP.TABS.SYSTEM-DIAGNOSTICS',
      ngTemplateOutlet: 'tabSystemDiagnosticsTemplate',
    },
    {
      id: 'terminalTab',
      heading: 'AREAS.HELP.TABS.TERMINAL',
      ngTemplateOutlet: 'tabTerminalTemplate',
    },
    {
      id: 'updateTab',
      heading: 'AREAS.HELP.TABS.UPDATE',
      ngTemplateOutlet: 'tabUpdateTemplate',
    },
    {
      id: 'extraPackagesTab',
      heading: 'AREAS.HELP.TABS.EXTRA-PACKAGES',
      ngTemplateOutlet: 'tabExtraPackagesTemplate',
    },
    {
      id: 'aboutTab',
      heading: 'AREAS.HELP.TABS.ABOUT',
      ngTemplateOutlet: 'tabAboutTemplate',
    },
    {
      id: 'comparisonTab',
      heading: 'AREAS.HELP.TABS.COMPARISON',
      ngTemplateOutlet: 'tabComparisonTemplate',
    },
    {
      id: 'licenseTab',
      heading: 'SHARED-TABS.LICENSE',
      ngTemplateOutlet: 'tabLicenseTemplate',
    },
    {
      id: 'logsTab',
      heading: 'SHARED-TABS.LOGGING-TRACING',
      ngTemplateOutlet: 'tabLogsTemplate',
    },
  ];

  MENU_SELECTED_X_VISIBLE_TABS = [
    {
      selectedMenu: 'supportMenuSelected',
      visibleTabs: ['supportTab', 'licenseTab', 'logsTab'],
    },
    {
      selectedMenu: 'docsMenuSelected',
      visibleTabs: ['docsTab', 'licenseTab'],
    },
    {
      selectedMenu: 'servicesMenuSelected',
      visibleTabs: ['servicesTab', 'licenseTab'],
    },
    {
      selectedMenu: 'useCasesMenuSelected',
      visibleTabs: ['useCasesTab', 'licenseTab'],
    },
    {
      selectedMenu: 'freeForSchoolsMenuSelected',
      visibleTabs: ['freeForSchoolsTab', 'licenseTab'],
    },
    {
      selectedMenu: 'reviewsMenuSelected',
      visibleTabs: ['reviewsTab', 'licenseTab'],
    },
    {
      selectedMenu: 'blogMenuSelected',
      visibleTabs: ['blogTab', 'licenseTab'],
    },
    {
      selectedMenu: 'installSetupMenuSelected',
      visibleTabs: [
        'javaTab',
        'systemDiagnosticsTab',
        'terminalTab',
        'updateTab',
        'extraPackagesTab',
        'licenseTab',
      ],
    },
    {
      selectedMenu: 'licenseMenuSelected',
      visibleTabs: ['licenseTab', 'logsTab'],
    },
    {
      selectedMenu: 'aboutMenuSelected',
      visibleTabs: ['aboutTab', 'comparisonTab', 'licenseTab'],
    },
  ];

  //rssParser: typeof RSS;

  currentLeftMenu: string;

  constructor(
    protected route: ActivatedRoute,
    protected changeDetectorRef: ChangeDetectorRef,
    protected settingsService: SettingsService,
    //protected electronService: ElectronService,
  ) {}

  async ngOnInit() {
    this.settingsService.currentConfigurationTemplateName = '';
    this.settingsService.currentConfigurationTemplatePath = '';

    this.route.params.subscribe(async (params) => {
      if (params.leftMenu) {
        this.currentLeftMenu = params.leftMenu;
      } else {
        this.currentLeftMenu = 'supportMenuSelected';
      }

      this.refreshTabs();
    });
  }

  ngAfterViewChecked() {
    this.refreshBlogRss();
  }

  refreshTabs() {
    this.visibleTabs = [];
    this.changeDetectorRef.detectChanges();

    const visibleTabsIds = this.MENU_SELECTED_X_VISIBLE_TABS.find((item) => {
      return item.selectedMenu === this.currentLeftMenu;
    }).visibleTabs;

    this.visibleTabs = this.ALL_TABS.filter((item) => {
      return visibleTabsIds.includes(item.id);
    });
  }

  isRunningInsideElectron(): boolean {
    return Utilities.isRunningInsideElectron();
  }

  refreshBlogRss() {
    if (this.currentLeftMenu !== 'blogMenuSelected') {
      return;
    }

    /*
    const blogEntriesFetchedCount = document.querySelectorAll(
      '#blogRss .feed-container'
    ).length;

    if (blogEntriesFetchedCount == 0 && !this.rssParser) {
      this.rssParser = new RSS(
        document.querySelector('#blogRss'),
        'https://www.pdfburst.com/blog/feed/',
        {
          limit: 100,
          ssl: true,
          layoutTemplate: '<div class="feed-container">{entries}</div>',
          entryTemplate:
            '<a href="{url}" target="_blank"><h4>{title}</h4></a><br><br>{shortBodyPlain} <a href="{url}" target="_blank"> ... Read More</a><hr>',
        }
      );
      return this.rssParser.render();
    }
    */
  }
}
