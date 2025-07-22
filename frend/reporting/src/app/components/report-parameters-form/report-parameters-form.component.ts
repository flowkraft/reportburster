import {
  Component,
  OnInit,
  OnChanges,
  SimpleChanges,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ValidatorFn,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { debounceTime, distinctUntilChanged, map, Subscription } from 'rxjs';

import * as _ from 'lodash';

interface ParamRef {
  name: string;
}
type MaybeRef<T> = T | ParamRef;

export interface ParamMeta {
  id: string;
  type: string;
  defaultValue?: any;
  constraints?: { [k: string]: MaybeRef<any> };
  uiHints?: { [k: string]: any };
  label?: string;
  description?: string;
}

@Component({
  selector: 'dburst-report-parameters-form',
  templateUrl: './report-parameters-form.component.html',
})
export class ReportParametersFormComponent implements OnInit, OnChanges {
  @Input() parameters: ParamMeta[] = [];
  @Output() validChange = new EventEmitter<boolean>();
  @Output() valueChange = new EventEmitter<{ [id: string]: any }>();

  form: FormGroup;

  subscriptions: Subscription[] = [];

  constructor(private fb: FormBuilder) { }

  ngOnInit() {
    if (this.parameters?.length) {
      this.buildForm(this.parameters);
      // Emit initial values after form is built
      this.valueChange.emit(this.form.value);
      this.validChange.emit(this.form.valid);
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes['parameters'] &&
      this.parameters?.length &&
      !_.isEqual(changes['parameters'].previousValue, changes['parameters'].currentValue)
    ) {
      this.buildForm(this.parameters);
    }
  }

  private buildForm(params: ParamMeta[]): void {
    // 1) Tear down old subscriptions
    this.subscriptions.forEach(s => s.unsubscribe());
    this.subscriptions = [];

    // 2) Build a FormGroup config dictionary
    const controlsConfig: { [key: string]: any[] } = {};
    params.forEach(p => {
      controlsConfig[p.id] = [p.defaultValue ?? null, []];
    });
    this.form = this.fb.group(controlsConfig);

    // 3) Attach validators (static + cross-field)
    params.forEach(p => {
      const ctrl = this.form.get(p.id)!;
      const cons = p.constraints || {};

      // a) static validators
      if (cons.required) {
        ctrl.addValidators(Validators.required);
      }
      if (cons.min != null && !this.isRef(cons.min)) {
        ctrl.addValidators(Validators.min(+cons.min));
      }
      if (cons.max != null && !this.isRef(cons.max)) {
        ctrl.addValidators(Validators.max(+cons.max));
      }

      // b) dynamic (ref-based) validators
      (['min', 'max'] as const).forEach(kind => {
        const v = (cons as any)[kind];
        if (this.isRef(v)) {
          const refName = (v as ParamRef).name;
          const validatorFn: ValidatorFn =
            kind === 'min'
              ? this.minRefValidator(refName, p.type)
              : this.maxRefValidator(refName, p.type);

          ctrl.addValidators(validatorFn);

          // re-validate silently when the reference field changes
          const sub = this.form
            .get(refName)!
            .valueChanges
            .subscribe(() =>
              ctrl.updateValueAndValidity({ onlySelf: true, emitEvent: false })
            );

          this.subscriptions.push(sub);
        }
      });

      // c) initial silent validity run
      ctrl.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    });

    // 4) Emit only when validity actually toggles
    this.subscriptions.push(
      this.form.statusChanges.pipe(
        debounceTime(10),
        map(() => this.form.valid),
        distinctUntilChanged()
      ).subscribe(valid => this.validChange.emit(valid))
    );

    // 5) Emit only distinct value snapshots
    this.subscriptions.push(
      this.form.valueChanges.pipe(
        debounceTime(150),
        distinctUntilChanged((a, b) => _.isEqual(a, b))
      ).subscribe(val => this.valueChange.emit(val))
    );
  }


  private isRef(x: any): x is ParamRef {
    return x && typeof x === 'object' && 'name' in x;
  }

  resolveMin(p: ParamMeta): string | null {
    const v = p.constraints?.min;
    if (!v || this.isRef(v)) return null;
    return String(v);
  }
  resolveMax(p: ParamMeta): string | null {
    const v = p.constraints?.max;
    if (!v || this.isRef(v)) return null;
    return String(v);
  }

  displayConstraint(p: ParamMeta, kind: 'min' | 'max'): string {
    const v = p.constraints?.[kind];
    if (this.isRef(v)) {
      return this.form.get((v as ParamRef).name)!.value;
    }
    return String(v);
  }

  private minRefValidator(refField: string, type: string): ValidatorFn {
    return (c: AbstractControl) => {
      const refVal = this.form.get(refField)!.value;
      if (c.value == null || refVal == null) return null;
      if (type.startsWith('LocalDate')) {
        return new Date(c.value) < new Date(refVal)
          ? { min: { required: refVal } }
          : null;
      }
      return +c.value < +refVal ? { min: { required: +refVal } } : null;
    };
  }

  private maxRefValidator(refField: string, type: string): ValidatorFn {
    return (c: AbstractControl) => {
      const refVal = this.form.get(refField)!.value;
      if (c.value == null || refVal == null) return null;
      if (type.startsWith('LocalDate')) {
        return new Date(c.value) > new Date(refVal)
          ? { max: { required: refVal } }
          : null;
      }
      return +c.value > +refVal ? { max: { required: +refVal } } : null;
    };
  }

  getControlType(p: ParamMeta): string {
    return (p.uiHints?.control || p.type || 'text').toLowerCase();
  }

  loadOptions(p: ParamMeta) {
    // parse p.uiHints.options into { label, value }[]
    return [];
  }
}
