import { effect, Inject, Injectable, signal } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { Router } from "@angular/router";
import { first, firstValueFrom } from "rxjs";
import { LocationResponse } from "../../../generated";
import { UserService } from "../../auth/services/user.service";
import { ApiService } from "../../core/services/api.service";
import { ReservationService } from "./reservation.service";
import { InjectionToken } from '@angular/core';

export const ID_TOKEN = new InjectionToken<string>('ID_TOKEN');

@Injectable({
	providedIn: "root",
})
export class CoworkingMediaService {
	private readonly svgCache = new Map<string, string>();
	public readonly svgAvailableTableStyle = "availableTable";
	public readonly svgNotAvailableTableStyle = "notAvailableTable";
	public readonly svgSelectedAvailableTableStyle = "selectedAvailableTable";

	svg = signal<SafeHtml | null>(null);
	validSvg = signal<boolean | null>(null);

	coworking = signal<LocationResponse | null>(null);

	constructor(
		private sanitizer: DomSanitizer,
		private api: ApiService,
		private reservation: ReservationService,
		private router: Router,
		private userService: UserService,
		@Inject(ID_TOKEN) private id: string | null,
	) {
		/** coworking updates */
		effect(() => {
			const coworking = this.coworking();
			if (coworking === null) return;
			this.showSelectedSection();
		});
		/** adding listener to change svg and its styles */
		effect(() => {
			const reservedTables = this.reservation.reservedTables();
			this.showSelectedSection();
		});

		this.getLocationFromAPI();
	}

	getLocationFromAPI() {
		if (this.id === null) {
			this.router.navigate(['/user']);
			return;
		}

		this.getLocation(this.id)
			.then(resp => this.coworking.set(resp))
			.catch(err => this.router.navigate(['/user']));
	}

	/** shows svg with floor-map */
	private async showSelectedSection() {
		const coworking = this.coworking();
		if (coworking === null) return;
		const svg_url = coworking.svg;
		let svgText = ''; // Convert response to text
		if (this.svgCache.has(svg_url)) {
			svgText = this.svgCache.get(svg_url)!;
			this.validSvg.set(true);
			this.svg.set(this.sanitizer.bypassSecurityTrustHtml(svgText));
		}
		else {
			let svg_response: any;
			svg_response = await fetch(svg_url);
			if (svg_response !== undefined && svg_response.ok) {
				svgText = await svg_response.text();
				//@ts-ignore
				this.svgCache.set(svg_url, svgText);
				this.validSvg.set(true);
				this.svg.set(this.sanitizer.bypassSecurityTrustHtml(svgText));
			}
			else {
				this.validSvg.set(false);
				this.svg.set(null);
			}
		}
	}

	async getLocation(id: string): Promise<any> {
		try {
			let resp;
			if (this.userService.isAdmin())
				resp = await firstValueFrom(this.api.apiService.getLocation(id));
			else
				resp = await firstValueFrom(this.api.apiService.getLocation_2(id));
			return resp;
		} catch (e: any) {
			throw e;
		}
	}
}
