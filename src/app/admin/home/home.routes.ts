import { Routes } from "@angular/router";

const routes: Routes = [
	{
		path: "",
		children: [
			{ path: '', loadComponent: () => import('./pages/list/list.component'), pathMatch: "full" },
			{ path: 'edit/:id', loadComponent: () => import('./pages/edit/edit.component'), pathMatch: "full" },
			{ path: 'statistics/:id', loadComponent: () => import('./pages/stats/stats.component'), pathMatch: "full" },
			{ path: 'map/:id', loadComponent: () => import('./pages/main/main.component'), pathMatch: "full" },
			{ path: 'tokens/:id', loadComponent: () => import('./pages/users/users.component'), pathMatch: "full" },
			{ path: 'table/:id/:table_id', loadComponent: () => import('./pages/table/table.component'), pathMatch: "full" },
			{ path: '**', redirectTo: '', pathMatch: "full" },
		]
	}
];

export default routes;
