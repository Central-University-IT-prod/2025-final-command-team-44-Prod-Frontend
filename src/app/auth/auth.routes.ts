import { Routes } from "@angular/router";

const routes: Routes = [
	{
		path: "",
		children: [
			{ path: 'intro', loadComponent: () => import('./pages/intro/intro.component'), pathMatch: "full" },
			{ path: 'auth/login', loadComponent: () => import('./pages/login/login.component'), pathMatch: "full" },
			{ path: 'auth/register', loadComponent: () => import('./pages/register/register.component'), pathMatch: "full" },
			{ path: '', redirectTo: 'intro', pathMatch: 'full' }
		]
	}
];

export default routes;
