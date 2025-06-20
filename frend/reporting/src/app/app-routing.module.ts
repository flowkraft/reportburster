import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ConfigurationTemplatesComponent } from './areas/_configuration-templates/configuration-templates.component';
import { ConfigurationComponent } from './areas/_configuration/configuration.component';
import { ConnectionListComponent } from './areas/_configuration-connections/configuration-connections.component';
import { HelpComponent } from './areas/_help/help.component';

import { ProcessingComponent } from './areas/_processing/processing.component';
import { NoJavaGuard } from './app-nojava-route-guard';
/*
import { ConfigurationComponent } from './areas/_configuration/configuration.component';
import { ConfigurationTemplatesComponent } from './areas/_configuration-templates/configuration-templates.component';
import { HelpComponent } from './areas/_help/help.component';
*/
const routes: Routes = [
  {
    path: '',
    component: ProcessingComponent,
  },
  {
    path: 'processing/:leftMenu',
    canActivate: [NoJavaGuard],
    component: ProcessingComponent,
  },
  {
    path: 'processingSampleBurst/:leftMenu/:prefilledInputFilePath/:prefilledConfigurationFilePath',
    canActivate: [NoJavaGuard],
    component: ProcessingComponent,
  },
  {
    path: 'processingSampleGenerate/:leftMenu/:prefilledSelectedMailMergeClassicReport/:prefilledInputFilePath',
    canActivate: [NoJavaGuard],
    component: ProcessingComponent,
  },
  {
    path: 'processingQa/:leftMenu',
    canActivate: [NoJavaGuard],
    component: ProcessingComponent,
  },
  {
    path: 'processingQa/:leftMenu/:prefilledInputFilePath',
    canActivate: [NoJavaGuard],
    component: ProcessingComponent,
  },
  {
    path: 'processingQa/:leftMenu/:prefilledInputFilePath/:prefilledConfigurationFilePath',
    canActivate: [NoJavaGuard],
    component: ProcessingComponent,
  },
  {
    path: 'processingQa/:leftMenu/:prefilledInputFilePath/:prefilledConfigurationFilePath/:whichAction',
    canActivate: [NoJavaGuard],
    component: ProcessingComponent,
  },
  {
    path: 'configuration/:leftMenu/:configurationFilePath/:configurationFileName/:reloadConfiguration',
    canActivate: [NoJavaGuard],
    component: ConfigurationComponent,
  },
  {
    path: 'configuration/:leftMenu/:configurationFilePath/:configurationFileName',
    canActivate: [NoJavaGuard],
    component: ConfigurationComponent,
  },
  {
    path: 'configuration-templates',
    canActivate: [NoJavaGuard],
    component: ConfigurationTemplatesComponent,
  },
  {
    path: 'configuration-connections/:goBackLocation/:configurationFilePath/:configurationFileName',
    canActivate: [NoJavaGuard],
    component: ConnectionListComponent,
  },
  {
    path: 'configuration-connections',
    canActivate: [NoJavaGuard],
    component: ConnectionListComponent,
  },
  {
    path: 'help/:leftMenu',
    component: HelpComponent,
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      useHash: true,
      initialNavigation: 'disabled',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
