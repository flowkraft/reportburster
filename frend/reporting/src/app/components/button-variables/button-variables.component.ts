import { Component, Output, EventEmitter, Input } from '@angular/core';

import { modalVariablesTemplate } from './modal-variables.template';
import { StateStoreService } from '../../providers/state-store.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'dburst-button-variables',
  template: `
    <button
      type="button"
      class="btn"
      (click)="onModalShow()"
      style="width: 100%;padding-left:6px"
      [disabled]="shouldBeDisabled"
    >
      <i class="fa fa-list-ol"></i>&nbsp;Variables&nbsp;
    </button>
    ${modalVariablesTemplate}
  `,
})
export class ButtonVariablesComponent {
  isModalVariablesVisible = false;
  showMoreCheckBoxValue = false;

  variables: Array<{ name: string; type: string; active: boolean }>;

  @Input() shouldBeDisabled: boolean = false;
  @Output() sendSelectedVariable: EventEmitter<string> = new EventEmitter();

  constructor(
    protected stateStore: StateStoreService,
    private translate: TranslateService,
  ) {}

  builtInVariables = [
    {
      name: '${input_document_name}',
      type: 'built-in',
      active: false,
    },
    {
      name: '${input_document_extension}',
      type: 'built-in',
      active: false,
    },
    {
      name: '${output_type_extension}',
      type: 'built-in',
      active: false,
    },
    {
      name: '${burst_token}',
      type: 'built-in',
      active: false,
    },
    {
      name: '${burst_index}',
      type: 'built-in',
      active: false,
    },
    {
      name: '${now?string["yyyy.MM.dd_HH.mm.ss"]}',
      type: 'built-in',
      active: false,
    },
    {
      name: '${now_default_date}',
      type: 'built-in',
      active: false,
    },
    {
      name: '${now_short_date}',
      type: 'built-in',
      active: false,
    },
    {
      name: '${now_medium_date}',
      type: 'built-in',
      active: false,
    },
    {
      name: '${now_long_date}',
      type: 'built-in',
      active: false,
    },
    {
      name: '${now_full_date}',
      type: 'built-in',
      active: false,
    },
    {
      name: '${now_quarter}',
      type: 'built-in',
      active: false,
    },
    {
      name: '${extracted_file_path}',
      type: 'built-in',
      active: false,
    },
    {
      name: '${extracted_file_paths_after_splitting_2nd_time}',
      type: 'built-in',
      active: false,
    },
  ];

  getShortListUserVariables() {
    if (
      this.stateStore.configSys.currentConfigFile.configuration.settings
        .numberofuservariables <= 5
    ) {
      return this.getAllUserVariables();
    } else {
      return this.getAllUserVariables().filter((variable) => {
        return ['${var0}', '${var1}', '${var2}'].includes(variable.name);
      });
    }
  }

  getAllUserVariables() {
    const allUserVariables = [];

    //console.log(
    //  `this.numberOfUserVariables = ${this.stateStore.configSys.currentConfigFile.configuration.settings.numberofuservariables}`,
    //);

    for (
      let i = 0;
      i <
      this.stateStore.configSys.currentConfigFile.configuration.settings
        .numberofuservariables;
      i++
    ) {
      allUserVariables.push({
        name: '${var' + i + '}',
        type: 'user-defined',
        active: false,
      });
    }

    //console.log(`allUserVariables = ${JSON.stringify(allUserVariables)}`);
    return allUserVariables;
  }

  getVariables(): Array<any> {
    return this.builtInVariables.concat(this.getAllUserVariables());
  }

  onShowMore() {
    if (this.showMoreCheckBoxValue) {
      this.variables = this.builtInVariables.concat(this.getAllUserVariables());
    } else {
      this.variables = this.builtInVariables.concat(
        this.getShortListUserVariables(),
      );
    }

    //console.log(
    //  `onShowMore() - this.variables = ${JSON.stringify(this.variables)}`,
    //);
  }

  onVariableClick(variable) {
    this.variables.forEach((element) => {
      element.active = element.name === variable.name ? true : false;
    });
  }

  getSelectedVariable(): {
    name: string;
    type: string;
    active: boolean;
  } {
    if (!this.variables) {
      return undefined;
    }

    return this.variables.find((variable) => {
      return variable.active;
    });
  }

  onModalShow() {
    this.onShowMore();

    this.isModalVariablesVisible = true;
  }

  onModalClose() {
    this.isModalVariablesVisible = false;
  }

  onModalOK() {
    this.sendSelectedVariable.emit(this.getSelectedVariable().name);
    this.isModalVariablesVisible = false;
  }
}
