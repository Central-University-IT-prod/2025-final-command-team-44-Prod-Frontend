import { Pipe, PipeTransform } from "@angular/core";
import { BookingResponse, LocationInfo, MyGroupResponse } from "../../../generated";

@Pipe({
	name: "locationPipe",
})
export class LocationPipe implements PipeTransform {

	transform(value: LocationInfo[]): any {
		if (!value) return [];

		return value.filter(function (item) {
			return item.name.toLowerCase().includes('яхонты');
		});
	}

}