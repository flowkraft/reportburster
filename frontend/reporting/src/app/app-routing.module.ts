import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ConfigurationTemplatesComponent } from './areas/_configuration-templates/configuration-templates.component';
import { ConfigurationComponent } from './areas/_configuration/configuration.component';
import { ExternalConnectionsComponent } from './areas/_ext-connections/ext-connections.component';
import { HelpComponent } from './areas/_help/help.component';

import { ProcessingComponent } from './areas/_processing/processing.component';
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
    component: ProcessingComponent,
  },
  {
    path: 'processingSample/:leftMenu/:prefilledInputFilePath/:prefilledConfigurationFilePath',
    component: ProcessingComponent,
  },
  {
    path: 'processingQa/:leftMenu',
    component: ProcessingComponent,
  },
  {
    path: 'processingQa/:leftMenu/:prefilledInputFilePath',
    component: ProcessingComponent,
  },
  {
    path: 'processingQa/:leftMenu/:prefilledInputFilePath/:prefilledConfigurationFilePath/:whichAction',
    component: ProcessingComponent,
  },
  {
    path: 'configuration/:leftMenu/:configurationFilePath/:configurationFileName/:reloadConfiguration',
    component: ConfigurationComponent,
  },
  {
    path: 'configuration/:leftMenu/:configurationFilePath/:configurationFileName',
    component: ConfigurationComponent,
  },
  {
    path: 'configuration-templates',
    component: ConfigurationTemplatesComponent,
  },
  {
    path: 'ext-connections/:goBackLocation/:configurationFilePath/:configurationFileName',
    component: ExternalConnectionsComponent,
  },
  {
    path: 'ext-connections',
    component: ExternalConnectionsComponent,
  },
  { path: 'help/:leftMenu', component: HelpComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
