import { Component, ElementRef, signal, ViewChild } from "@angular/core";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { LocationInfo, LocationResponse } from "../../../../../generated";
import { DataService } from "../../../../core/services/data.service";
import { NavbarService } from "../../services/navbar.service";

@Component({
	selector: "app-list",
	imports: [
		RouterLink,
		MatProgressSpinner,
	],
	templateUrl: "./list.component.html",
	styleUrl: "./list.component.css",
})
export default class ListComponent {
	@ViewChild("cardContainer") cardContainer !: ElementRef;

	locations = signal<LocationInfo[] | null>(null);

	constructor(
		private dataService: DataService,
		private navbarService: NavbarService,
		private route: ActivatedRoute,
		private router: Router,
	) {
		this.getCardList();
		this.navbarService.locationId.set(null);
	}

	getCardList() {
		this.dataService.getLocations()
			.then(locations => {
				this.locations.set(locations);
			}).catch(error => {});
	}

	createLocation() {
		this.dataService.createLocation()
			.then((location: any) => {
				this.router.navigate(["/admin/edit/" + location.id]);
			});
	}
}
