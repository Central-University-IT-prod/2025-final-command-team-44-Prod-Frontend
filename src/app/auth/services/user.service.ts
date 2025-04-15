import { HttpClient } from "@angular/common/http";
import { computed, Injectable, signal } from "@angular/core";
import { Router } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { AdminMe, AdminSignIn, AdminSignUp, UserMe } from "../../../generated";
import { ApiService } from "../../core/services/api.service";
import { JwtService } from "./jwt";

@Injectable({
	providedIn: "root",
})
export class UserService {
	public currentAdmin = signal<AdminMe | null>(null);

	public currentUser = signal<UserMe | null>(null);

	public isAuthenticated = computed(() => {
		return this.currentUser() !== null || this.currentAdmin() !== null;
	});

	public isAdmin = signal<boolean>(false);

	public readonly validationTemplates: Record<string, any> = {
		email: {
			type: "string",
			min: undefined,
			max: undefined,
			schema: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/,
		},
		name: {
			type: "string",
			min: undefined,
			max: undefined,
			schema: undefined,
		},
		age: {
			type: "number",
			min: 1,
			max: 100,
			schema: undefined,
		},
		weight: {
			type: "number",
			min: 50,
			max: 200,
			schema: undefined,
		},
		height: {
			type: "number",
			min: 80,
			max: 200,
			schema: undefined,
		},
	};

	constructor(
		private readonly http: HttpClient,
		private readonly jwtService: JwtService,
		private router: Router,
		private api: ApiService,
	) {}

	makeAdmin() {
		this.isAdmin.set(true);
	}

	async register(dto: AdminSignUp): Promise<void> { // only admin registration
		try {
			const token = await firstValueFrom(this.api.apiService.adminSignUp(dto));
			return await this.setAuth(token.token);
		} catch (e: any) {
			throw e;
		}
	}

	async login(dto: AdminSignIn): Promise<void> { // only admin registration
		try {
			const token = await firstValueFrom(this.api.apiService.adminSignIn(dto));
			await this.setAuth(token.token);
		} catch (e: any) {
			throw e;
		}
	}

	async telegramAuth(initData: string): Promise<void> {
		try {
			const token = await firstValueFrom(this.api.apiService.telegramAuth({ init_data: initData }));
			await this.setAuth(token.token);
		} catch (e: any) {
			throw e;
		}
	}

	async getAdminProfile(): Promise<AdminMe> {
		try {
			if (!this.jwtService.checkTokenSetUp()) this.jwtService.setTokenToApi();
			const resp = await firstValueFrom(this.api.apiService.adminMe());
			await this.setAuthAdminUser(resp);
			return resp;
		} catch (e: any) {
			this.purgeAuth();
			return e.error.detail;
		}
	}

	async getProfile(): Promise<UserMe> {
		try {
			if (!this.jwtService.checkTokenSetUp()) this.jwtService.setTokenToApi();
			const resp = await firstValueFrom(this.api.apiService.userMe());
			await this.setAuthUser(resp);
			return resp;
		} catch (e: any) {
			this.purgeAuth();
			return e;
		}
	}

	async logout() {
		this.purgeAuth();
	}

	async setAuthAdminUser(user: AdminMe | string) {
		if (typeof user === "string") {
			this.purgeAuth();
			return;
		}
		this.currentAdmin.set(user);
	}

	async setAuthUser(user: UserMe | string) {
		if (typeof user === "string") {
			this.purgeAuth();
			return;
		}
		this.currentUser.set(user);
	}

	async setAuth(token: string) {
		this.jwtService.saveToken(token);
		if (this.isAdmin()) await this.getAdminProfile();
		else await this.getProfile();
	}

	purgeAuth() {
		this.router.navigate(['/intro'])
		this.jwtService.destroyToken();
		this.currentUser.set(null);
	}
}
