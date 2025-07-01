import { Injectable } from '@angular/core';
import {
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { StateStoreService } from './providers/state-store.service';

@Injectable({
  providedIn: 'root',
})
export class NoJavaGuard {
  constructor(
    private router: Router,
    private storeService: StateStoreService,
  ) {}

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Promise<boolean | UrlTree> {
    if (this.storeService.configSys.sysInfo.setup.java.isJavaOk) {
      return true;
    } else {
      //alert(
      //  'To use ReportBurster, Java 11 (or newer) must be installed on your computer.',
      //);
      this.router.navigate(['/help', 'installSetupMenuSelected'], {
        skipLocationChange: true,
      });
      return false;
    }
  }
}
