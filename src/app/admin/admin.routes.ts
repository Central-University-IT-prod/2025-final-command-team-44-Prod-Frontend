import { Routes } from "@angular/router";

export const routes: Routes = [
	{
		path: "",
		loadChildren: () => import("./home/home.routes"),
	},
	{
		path: '**',
		pathMatch: 'full',
		redirectTo: 'list',
	}
];

export default routes;