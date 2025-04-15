import { Routes } from "@angular/router";
import { AdminRoutesGuard } from "./core/guards/admin-routes.guard";
import { isAuthenticatedGuard } from "./core/guards/is-authenticated.guard";
import { UserRoutesGuard } from "./core/guards/user-routes.guard";

export const routes: Routes = [
	{
		path: "",
		loadChildren: () => import("./auth/auth.routes"),
		canActivate: [isAuthenticatedGuard],
	},
	{
		path: "admin",
		loadChildren: () => import("./admin/admin.routes"),
		canActivate: [AdminRoutesGuard],
	},
	{
		path: "user",
		loadChildren: () => import("./user/user.routes"),
		canActivate: [UserRoutesGuard],
	},
	{
		path: "**",
		pathMatch: "full",
		redirectTo: "",
	},
];
