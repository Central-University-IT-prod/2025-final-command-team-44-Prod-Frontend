import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { Configuration, DefaultService } from "../../../generated";

@Injectable({
	providedIn: "root",
})
export class ApiService {

	public apiService!: DefaultService;

	constructor(
		private httpClient: HttpClient,
	) {
		this.apiService = new DefaultService(httpClient, environment.apiBaseUrl, new Configuration());
	}
}