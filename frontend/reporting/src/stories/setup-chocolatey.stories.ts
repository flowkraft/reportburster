import { Meta, StoryObj } from '@storybook/angular';
import { baseMeta } from './_utils/setup';
import { StateStoreService } from '../app/providers/state-store.service';
import { ElectronService } from '../app/core/services';
import { ChocolateyComponent } from '../app/areas/install-setup-upgrade/chocolatey/chocolatey.component';

type Story = StoryObj<ChocolateyComponent>;
const defaultMeta: Meta<ChocolateyComponent> = {
  ...baseMeta,
  title: 'ReportBurster/Setup/Chocolatey',
  component: ChocolateyComponent,
};

export default defaultMeta;

const mockElectronService = {
  typeCommandOnTerminalAndThenPressEnter: (command: string) =>
    console.log(`Command executed: ${command}`),
};

const storeServiceIsChocoOkFalse = new StateStoreService();

storeServiceIsChocoOkFalse.setup.chocolatey.isChocoOk = false;

export const IsChocoOkFalse: Story = {
  render: () => ({
    // Define application-wide providers directly in the render function
    applicationConfig: {
      providers: [
        {
          provide: StateStoreService,
          useValue: storeServiceIsChocoOkFalse,
        },
        {
          provide: ElectronService,
          useValue: mockElectronService,
        },
      ],
    },
  }),
};

const storeServiceIsChocoOkTrue = new StateStoreService();

storeServiceIsChocoOkTrue.setup.chocolatey.isChocoOk = true;

export const IsChocoOkTrue: Story = {
  render: () => ({
    // Define application-wide providers directly in the render function
    applicationConfig: {
      providers: [
        {
          provide: StateStoreService,
          useValue: storeServiceIsChocoOkTrue,
        },
        {
          provide: ElectronService,
          useValue: mockElectronService,
        },
      ],
    },
  }),
};
