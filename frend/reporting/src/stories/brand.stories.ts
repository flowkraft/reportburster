import { Meta, StoryObj } from '@storybook/angular';
import { BrandComponent } from '../app/components/brand/brand.component';

type Story = StoryObj<BrandComponent>;
const meta: Meta<BrandComponent> = {
  title: 'ReportBurster/Brand',
  component: BrandComponent,
};
// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export default meta;

export const ReportBurster: Story = {};
