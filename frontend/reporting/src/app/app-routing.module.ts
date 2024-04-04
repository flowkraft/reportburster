import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ConfigurationTemplatesComponent } from './areas/_configuration-templates/configuration-templates.component';
import { ConfigurationComponent } from './areas/_configuration/configuration.component';
import { ExternalConnectionsComponent } from './areas/_ext-connections/ext-connections.component';
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
    path: 'processingSample/:leftMenu/:prefilledInputFilePath/:prefilledConfigurationFilePath',
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
    path: 'ext-connections/:goBackLocation/:configurationFilePath/:configurationFileName',
    canActivate: [NoJavaGuard],
    component: ExternalConnectionsComponent,
  },
  {
    path: 'ext-connections',
    canActivate: [NoJavaGuard],
    component: ExternalConnectionsComponent,
  },
  {
    path: 'help/:leftMenu',
    component: HelpComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
