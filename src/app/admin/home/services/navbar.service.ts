import { effect, Injectable, signal } from "@angular/core";
import { Router } from "@angular/router";

@Injectable({
	providedIn: "root",
})
export class NavbarService {

	locationId = signal<string | null>(null);

}
