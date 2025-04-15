import { Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from "@angular/router";
import { SideBarInteractionService } from "../services/side-bar-interaction.service";

@Component({
	selector: "HeaderComp",
	imports: [
		RouterLink,
	],
	styles: `
        .container {
            display:         flex;
            flex-direction:  row;
            justify-content: center;
            gap:             72px;
            align-items:     center;
            width:           100%;
            height:          var(--header-height);
            background:      var(--background-header);
            border-bottom:   1px solid var(--border-header);
            padding:         0 32px 0;
			z-index: 800;
			position: relative;

            a {
                display:             flex;
                flex-direction:      column;
                align-items:         center;
                gap:                 5px;
                transition-duration: .3s;
                color:               var(--text-secondary);

                svg {
                    width:               30px;
                    stroke:              var(--text-secondary);
                    transition-duration: .3s;
                    fill:                var(--background-secondary);
                }

                &:hover {
                    color: var(--text-primary);

                    svg {
                        stroke: var(--text-primary);
                    }
                }

                &:is(.active) {
                    color: rgb(245, 245, 245);

                    svg {
                        /* fill: rgb(245,245,245); */
                        stroke: rgb(245, 245, 245);
                    }
                }
            }
        }
	`,
	template: `
        <div class="container">
            <a [class.active]="isActive('/user')" routerLink="/user">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <path d="M5 12l-2 0l9 -9l9 9l-2 0"/>
                    <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7"/>
                    <path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6"/>
                </svg>
                <p>Локации</p>
            </a>
            <a [class.active]="isActive('/user/profile')" routerLink="/user/profile">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <path d="M9.615 20h-2.615a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v8"/>
                    <path d="M14 19l2 2l4 -4"/>
                    <path d="M9 8h4"/>
                    <path d="M9 12h2"/>
                </svg>
                <p>Мои брони</p>
            </a>
        </div>
	`,
	standalone: true,
})
export class HeaderComponent {

	constructor(
		private router: Router
	) {}

	public isActive(url: string): boolean {
		return this.router.url === url;
	}

}
