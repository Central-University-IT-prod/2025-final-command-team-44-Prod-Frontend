import { Routes } from "@angular/router";

const routes: Routes = [
	{
		path: "",
		children: [
			{ path: '', loadComponent: () => import('./pages/home/home.component'), pathMatch: "full" },
		]
	},
	{
		path: "coworking/:id",
		children: [
			{ path: '', loadComponent: () => import('./pages/coworking/coworking.component'), pathMatch: "full" },
		]
	},
	{
		path: "booking/:id",
		children: [
			{ path: '', loadComponent: () => import('./pages/booking/booking.component'), pathMatch: "full" },
		]
	},
	{
		path: "profile",
		children: [
			{ path: '', loadComponent: () => import('./pages/profile/profile.component'), pathMatch: "full" },
		]
	},
];

export default routes;
