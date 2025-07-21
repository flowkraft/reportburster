import { Directive, Input, OnChanges } from "@angular/core";
import { TabDirective } from "ngx-bootstrap/tabs";

@Directive({
    selector: '[tabOrder]'
})
export class TabOrderDirective implements OnChanges {

    @Input() tabOrder = 0;

    constructor(private tab: TabDirective) { }

    ngOnChanges() {
        (this.tab as any).__tabOrder = +this.tabOrder;
        this.tab.tabset.tabs.sort((a: any, b: any) => a.__tabOrder - b.__tabOrder);
    }
}