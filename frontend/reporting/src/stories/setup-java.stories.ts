import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { baseMeta } from './_utils/setup';
import { JavaComponent } from '../app/areas/install-setup-upgrade/java/java.component';
import { ChocolateyComponent } from '../app/areas/install-setup-upgrade/chocolatey/chocolatey.component';

import { StateStoreService } from '../app/providers/state-store.service';
import { ElectronService } from '../app/core/services';

type Story = StoryObj<JavaComponent>;

const defaultMeta: Meta<JavaComponent> = {
  ...baseMeta,
  title: 'ReportBurster/Setup/Java',
  component: JavaComponent,
  decorators: [
    ...baseMeta.decorators,
    moduleMetadata({
      declarations: [ChocolateyComponent],
    }),
  ],
};

export default defaultMeta;

const mockElectronService = {
  restartElectronApp: () => console.log('restartElectronApp called'),
  typeCommandOnTerminalAndThenPressEnter: (command: string) =>
    console.log(`Command executed: ${command}`),
};

const storeServiceIsRestartRequiredTrue = new StateStoreService();

storeServiceIsRestartRequiredTrue.setup.isRestartRequired = true;

export const isRestartRequiredTrue: Story = {
  render: () => ({
    // Define application-wide providers directly in the render function
    applicationConfig: {
      providers: [
        {
          provide: StateStoreService,
          useValue: storeServiceIsRestartRequiredTrue,
        },
        {
          provide: ElectronService,
          useValue: mockElectronService,
        },
      ],
    },
  }),
};

const storeServiceIsRestartRequiredFalseIsJavaOKFalseIsChocoOKFalse1 =
  new StateStoreService();

storeServiceIsRestartRequiredFalseIsJavaOKFalseIsChocoOKFalse1.setup.isRestartRequired =
  false;

//storeServiceIsRestartRequiredFalseIsJavaOKFalseIsChocoOKFalse.setup.java.isJavaOk =
//  false;
//storeServiceIsRestartRequiredFalseIsJavaOKFalseIsChocoOKFalse.setup.chocolatey.isChocoOk =
//  false;

export const isRestartRequiredFalseIsJavaOKFalseIsChocoOKFalse1: Story = {
  render: () => ({
    // Define application-wide providers directly in the render function
    applicationConfig: {
      providers: [
        {
          provide: StateStoreService,
          useValue:
            storeServiceIsRestartRequiredFalseIsJavaOKFalseIsChocoOKFalse1,
        },
        {
          provide: ElectronService,
          useValue: mockElectronService,
        },
      ],
    },
  }),
};

const storeServiceIsRestartRequiredFalseIsJavaOKFalseIsChocoOKFalse2 =
  new StateStoreService();

storeServiceIsRestartRequiredFalseIsJavaOKFalseIsChocoOKFalse2.setup.isRestartRequired =
  false;

storeServiceIsRestartRequiredFalseIsJavaOKFalseIsChocoOKFalse2.setup.java.isJavaOk =
  false;
storeServiceIsRestartRequiredFalseIsJavaOKFalseIsChocoOKFalse2.setup.chocolatey.isChocoOk =
  false;

export const isRestartRequiredFalseIsJavaOKFalseIsChocoOKFalse2: Story = {
  render: () => ({
    // Define application-wide providers directly in the render function
    applicationConfig: {
      providers: [
        {
          provide: StateStoreService,
          useValue:
            storeServiceIsRestartRequiredFalseIsJavaOKFalseIsChocoOKFalse2,
        },
        {
          provide: ElectronService,
          useValue: mockElectronService,
        },
      ],
    },
  }),
};

const storeServiceIsRestartRequiredFalseIsJavaOKFalseIsChocoOKTrue =
  new StateStoreService();

storeServiceIsRestartRequiredFalseIsJavaOKFalseIsChocoOKTrue.setup.isRestartRequired =
  false;

storeServiceIsRestartRequiredFalseIsJavaOKFalseIsChocoOKTrue.setup.java.isJavaOk =
  false;
storeServiceIsRestartRequiredFalseIsJavaOKFalseIsChocoOKTrue.setup.chocolatey.isChocoOk =
  true;

export const isRestartRequiredFalseIsJavaOKFalseIsChocoOKTrue: Story = {
  render: () => ({
    // Define application-wide providers directly in the render function
    applicationConfig: {
      providers: [
        {
          provide: StateStoreService,
          useValue:
            storeServiceIsRestartRequiredFalseIsJavaOKFalseIsChocoOKTrue,
        },
        {
          provide: ElectronService,
          useValue: mockElectronService,
        },
      ],
    },
  }),
};

const storeServiceIsRestartRequiredFalseIsJavaOKTrueIsChocoOKTrue =
  new StateStoreService();

storeServiceIsRestartRequiredFalseIsJavaOKTrueIsChocoOKTrue.setup.isRestartRequired =
  false;

storeServiceIsRestartRequiredFalseIsJavaOKTrueIsChocoOKTrue.setup.java.isJavaOk =
  true;
storeServiceIsRestartRequiredFalseIsJavaOKTrueIsChocoOKTrue.setup.chocolatey.isChocoOk =
  true;

export const isRestartRequiredFalseIsJavaOKTrueIsChocoOKTrue: Story = {
  render: () => ({
    // Define application-wide providers directly in the render function
    applicationConfig: {
      providers: [
        {
          provide: StateStoreService,
          useValue: storeServiceIsRestartRequiredFalseIsJavaOKTrueIsChocoOKTrue,
        },
        {
          provide: ElectronService,
          useValue: mockElectronService,
        },
      ],
    },
  }),
};
