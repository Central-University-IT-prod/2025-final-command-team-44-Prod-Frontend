import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { environment } from "../../../environments/environment";
import { BookingAdminResponse, BookingResponse, CreateBooking, JoinQueue, LocationInfo, LocationResponse, TablePatch, TableResponse } from "../../../generated";
import { JwtService } from "../../auth/services/jwt";
import { ApiService } from "./api.service";

@Injectable({
	providedIn: "root",
})
export class DataService {

	constructor(
		private http: HttpClient,
		private api: ApiService,
		private jwt: JwtService,
	) { }

	async getTableById(locationId: string, tableId: string): Promise<TableResponse> {
		try {
			return await firstValueFrom(this.api.apiService.getTable(tableId, locationId));
		} catch (e) {
			throw e;
		}
	}

	async getTablesByLocation(id: string): Promise<TableResponse[]> {
		try {
			return await firstValueFrom(this.api.apiService.getLocationTables(id));
		} catch (e) {
			console.log(e);
			throw e;
		}
	}

	async joinInQueue(locationId: string, dto: JoinQueue): Promise<void> {
		try {
			await firstValueFrom(this.api.apiService.joinQueue(locationId, dto));
		} catch (e: any) {
			throw e;
		}
	}

	async getLocations(): Promise<LocationInfo[]> {
		try {
			return await firstValueFrom(this.api.apiService.getAllAdminLocations());
		} catch (e) {
			console.log(e);
			throw e;
		}
	}

	async getLocationById(id: string): Promise<LocationResponse> {
		try {
			return await firstValueFrom(this.api.apiService.getLocation(id));
		} catch (e) {
			console.log(e);
			throw e;
		}
	}

	async editLocation(id: string, name: string, address: string, openHour: number, closeHour: number): Promise<LocationResponse> {
		try {
			return await firstValueFrom(this.api.apiService.updateLocation(id, { name: name, address: address, open_hour: openHour, close_hour: closeHour }));
		} catch (e: any) {
			console.log(e);
			throw e;
		}
	}

	async editLocationSVG(id: string, file: any): Promise<LocationResponse> {
		try {
			const formData: FormData = new FormData();
			formData.append('file', file, file.name);
			return await firstValueFrom(this.http.put(
				`${ environment.apiBaseUrl }/api/admins/location/${ id }/svg`,
				formData,
				{
					headers: {
						"Authorization": `Bearer ${this.jwt.getToken()}`
					},
				},
			)) as LocationResponse;
		} catch (e: any) {
			console.log(e);
			throw e;
		}
	}

	async createLocation(name: string = "Новая локация", address: string = "Новый адрес"): Promise<LocationResponse> {
		try {
			return await firstValueFrom(this.api.apiService.createLocation({ name: name, address: address }));
		} catch (e: any) {
			console.log(e);
			throw e;
		}
	}

	async updateTable(locationId : string, tableId : string, newTable : TablePatch): Promise<TableResponse> {
		try {
			return await firstValueFrom(this.api.apiService.updateTable(tableId, locationId, newTable));
		} catch (e: any) {
			console.log(e);
			throw e;
		}
	}

	async getBookingsByLocation(locationId : string): Promise<BookingAdminResponse[]> {
		try {
			return await firstValueFrom(this.api.apiService.bookingsLocationAdmin(locationId));
		} catch (e: any) {
			console.log(e);
			throw e;
		}
	}

	async getBookingsByTable(locationId : string, tableId : string): Promise<BookingAdminResponse[]> {
		try {
			return await firstValueFrom(this.api.apiService.tableBookingsAdmin(tableId, locationId));
		} catch (e: any) {
			console.log(e);
			throw e;
		}
	}

	async updateTableBooking(locationId : string, tableId : string, bookingId : string, booking : CreateBooking): Promise<BookingAdminResponse> {
		try {
			return await firstValueFrom(this.api.apiService.updateBookingAdmin(bookingId, tableId, locationId, booking));
		} catch (e: any) {
			console.log(e);
			throw e;
		}
	}

	async removeTableBooking(locationId : string, tableId : string, bookingId : string): Promise<any> {
		try {
			return await firstValueFrom(this.api.apiService.deleteBookingAdmin(bookingId, tableId, locationId));
		} catch (e: any) {
			console.log(e);
			throw e;
		}
	}

	async createTableBooking(locationId : string, tableId : string, booking : CreateBooking): Promise<BookingAdminResponse> {
		try {
			return await firstValueFrom(this.api.apiService.createBooking_1(tableId, locationId, booking));
		} catch (e: any) {
			console.log(e);
			throw e;
		}
	}


}
