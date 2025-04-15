import { Component, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { LocationInfo } from "../../../../generated";
import { UserDataService } from "../../../core/services/user-data.service";
import { LocationPipe } from "../../pipes/location.pipe";

@Component({
	selector: "app-main",
	imports: [
		RouterLink,
		LocationPipe,
	],
	templateUrl: "./home.component.html",
	styleUrl: "./home.component.css",
})
export default class HomeComponent {

	coworkings = signal<LocationInfo[]>([]);

	constructor(
		private dataService: UserDataService,
	) {
		this.getCoworkings();
	}

	getCoworkings() {
		this.dataService.getUserLocations().then(locations => {
			this.coworkings.set(locations);
		});
	}

}
