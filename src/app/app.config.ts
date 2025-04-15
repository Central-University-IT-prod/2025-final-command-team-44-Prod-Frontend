import { provideHttpClient } from "@angular/common/http";
import { APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection } from "@angular/core";
import { provideRouter } from "@angular/router";
import { environment } from "../environments/environment";

import { routes } from "./app.routes";
import { UserService } from "./auth/services/user.service";

export function initAuth(userService: UserService) {
	//@ts-ignore
	let initData: any = window.Telegram.WebApp.initData;

	//@ts-ignore
	window.Telegram.WebApp.ready();
	//@ts-ignore
	window.Telegram.WebApp.expand();
	//@ts-ignore
	window.Telegram.WebApp.disableVerticalSwipes();
	//@ts-ignore
	window.Telegram.WebApp.enableClosingConfirmation();

	try {
		//@ts-ignore
		console.log(window.Telegram.WebApp.platform);
		//@ts-ignore
		if (window.Telegram.WebApp.isVersionAtLeast(8.0) && window.Telegram.WebApp.platform !== "tdesktop" && window.Telegram.WebApp.platform !== "weba" && window.Telegram.WebApp.platform !== "macos") {
			//@ts-ignore
			window.Telegram.WebApp.requestFullscreen();
			document.documentElement.style.setProperty("--tg-top-padding", "60px");
		}
		else {
			console.warn("Fullscreen API недоступен");
		}
	} catch (e: any) {}

	console.log(initData);

	if (initData === "") {
		initData = "query_id=AAGUa11SAAAAAJRrXVKrT5UR&user=%7B%22id%22%3A1381854100%2C%22first_name%22%3A%22bokisarik%22%2C%22last_name%22%3A%22%22%2C%22username%22%3A%22bokisarik%22%2C%22language_code%22%3A%22en%22%2C%22is_premium%22%3Atrue%2C%22allows_write_to_pm%22%3Atrue%2C%22photo_url%22%3A%22https%3A%5C%2F%5C%2Ft.me%5C%2Fi%5C%2Fuserpic%5C%2F320%5C%2FckLw0wWA8MlPUt_A0sbYltfzkA5JD6h1cLTpnL0Ranw.svg%22%7D&auth_date=1741021174&signature=jtvLNiZ_TARKmNiujy5Cd6t5HJnc6MMEUa-F9yi9eZjXY5Pk4DgkQkdhU03n8Nr4b5CLfC-Zm9hZIK_V5YtjCA&hash=99394c04057407524c458fe215851df19b469c38aa23c320fa6e1f9009395f75";
		if (!environment.production)
			return () => ( userService.telegramAuth(initData) );
		userService.makeAdmin();
		return () => ( userService.getAdminProfile() );
	}
	return () => ( userService.telegramAuth(initData) );
}

export const appConfig: ApplicationConfig = {
	providers: [
		provideZoneChangeDetection({ eventCoalescing: true }),
		provideRouter(routes),
		provideHttpClient(),
		{
			provide: APP_INITIALIZER,
			useFactory: initAuth,
			deps: [UserService],
			multi: true,
		},
	],
};
