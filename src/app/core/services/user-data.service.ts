import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { first, firstValueFrom } from "rxjs";
import {
	CreateBooking,
	JoinQueue,
	LocationInfo,
	MyGroupResponse,
	QueueReponse,
	UpdateBooking,
	UserMe,
} from "../../../generated";
import { JwtService } from "../../auth/services/jwt";
import { ApiService } from "./api.service";

@Injectable({
	providedIn: "root",
})
export class UserDataService {

	userBookings: MyGroupResponse[] = [];

	constructor(
		private http: HttpClient,
		private api: ApiService,
		private jwt: JwtService,
	) { }

	async getAllQueues(): Promise<QueueReponse[]> {
		try {
			return await firstValueFrom(this.api.apiService.getUserQueues())
		} catch (error) {
			throw error;
		}
	}

	async cancelQueues(locationId: number, queueId: number) {
		try {
			return await firstValueFrom(this.api.apiService.cancelQueue(queueId, locationId))
		} catch (error) {
			throw error;
		}
	}

	async getUserLocations(): Promise<LocationInfo[]> {
		try {
			return await firstValueFrom(this.api.apiService.getAllLocations());
		} catch (e) {
			console.log(e);
			throw e;
		}
	}

	getBookingById(id: string): MyGroupResponse | null {
		for (const booking of this.userBookings)
			if (booking.booking_id === id)
				return booking;
		return null;
	}

	async editBooking(bookingId: string, dto: UpdateBooking) {
		try {
			return await firstValueFrom(this.api.apiService.updateBooking(bookingId, dto));
		} catch (e) {
			console.log(e);
			throw e;
		}
	}

	async getBookingMembers(id: string): Promise<UserMe[]> {
		try {
			return await firstValueFrom(this.api.apiService.getBookingMembers(id));
		} catch (e) {
			console.log(e);
			return [];
		}
	}

	async getUserBookings(): Promise<MyGroupResponse[]> {
		try {
			this.userBookings =  await firstValueFrom(this.api.apiService.getMyBookings());
			return this.userBookings;
		} catch (e) {
			return [];
		}
	}

	async createBooking(locationId: string, tableId: string, dto: CreateBooking): Promise<any> {
		try {
			return await firstValueFrom(this.api.apiService.createBooking(tableId, locationId, dto));
		} catch (e) {
			throw e;
		}
	}

	async deleteBooking(id: string) {
		try {
			return await firstValueFrom(this.api.apiService.cancelBooking(id));
		} catch (e: any) {
			throw e;
		}
	}

	async joinBooking(id: string) {
		try {
			return await firstValueFrom(this.api.apiService.joinBooking({ booking_id: id }));
		} catch (e: any) {
			throw 'Не существует такого бронирования';
		}
	}

	async joinQueue(locationId: string, dto: JoinQueue) {
		try {
			return await firstValueFrom(this.api.apiService.joinQueue(locationId, dto));
		} catch (e) {
			throw e;
		}
	}
}
