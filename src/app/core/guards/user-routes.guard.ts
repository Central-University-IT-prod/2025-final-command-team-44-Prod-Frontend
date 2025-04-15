import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from "@angular/router";
import { UserService } from "../../auth/services/user.service";

@Injectable({
	providedIn: "root",
})
export class UserRoutesGuard implements CanActivate {

	constructor(
		private userService: UserService,
		private router: Router,
	) {}

	canActivate(
		route: ActivatedRouteSnapshot,
		state: RouterStateSnapshot,
	): boolean {
		const isAuthenticated = this.userService.isAuthenticated();
		if (!isAuthenticated) {
			this.router.navigate(['/intro'])
			return false;
		} else if (this.userService.isAdmin()) {
			this.router.navigate(["/admin"]);
			return true;
		} else {
			return true;
		}
	}

}
