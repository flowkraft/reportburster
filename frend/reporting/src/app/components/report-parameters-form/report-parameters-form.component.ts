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

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    if (this.parameters?.length) {
      this.buildForm(this.parameters);
      // Emit initial values after form is built
      this.valueChange.emit(this.form.value);
      this.validChange.emit(this.form.valid);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['parameters'] && this.parameters?.length) {
      this.buildForm(this.parameters);
    }
  }

  private buildForm(params: ParamMeta[]) {
    const group: { [key: string]: any[] } = {};
    for (const p of params) {
      group[p.id] = [p.defaultValue ?? null, []];
    }

    this.form = this.fb.group(group);

    for (const p of params) {
      const ctrl = this.form.get(p.id)!;
      const cons = p.constraints || {};

      if (cons.required) {
        ctrl.addValidators(Validators.required);
      }

      // literal min/max for numbers
      if (cons.min != null && !this.isRef(cons.min)) {
        ctrl.addValidators(Validators.min(+cons.min));
      }
      if (cons.max != null && !this.isRef(cons.max)) {
        ctrl.addValidators(Validators.max(+cons.max));
      }

      // dynamic min/max (ParamRef)
      for (const kind of ['min', 'max'] as const) {
        const v = (cons as any)[kind];
        if (this.isRef(v)) {
          const ref = (v as ParamRef).name;
          const fn =
            kind === 'min'
              ? this.minRefValidator(ref, p.type)
              : this.maxRefValidator(ref, p.type);
          ctrl.addValidators(fn);
          this.form
            .get(ref)!
            .valueChanges.subscribe(() => ctrl.updateValueAndValidity());
        }
      }

      ctrl.updateValueAndValidity();
    }

    // emit valid & value changes
    this.form.statusChanges.subscribe((s) =>
      this.validChange.emit(this.form.valid),
    );
    this.form.valueChanges.subscribe((v) => this.valueChange.emit(v));

    setTimeout(() => {
      this.valueChange.emit(this.form.value);
      this.validChange.emit(this.form.valid);
    });
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
