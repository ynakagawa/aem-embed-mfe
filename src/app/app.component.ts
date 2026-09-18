import { Component, signal } from '@angular/core';
import { HeroFragmentComponent } from './hero-fragment/hero-fragment.component';
import { CardFragmentComponent } from './card-fragment/card-fragment.component';
import { EmbedPanelComponent } from './embed-panel/embed-panel.component';

type TabId = 'hero' | 'card';

@Component({
  selector: 'app-root',
  imports: [HeroFragmentComponent, CardFragmentComponent, EmbedPanelComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'aem-embed-demo';

  readonly logoUrl =
    'https://main--vwr--ynaka-adobe.aem.live/media_1edca0f44c1b0baad1c16408809c939d521427a4f.svg';

  readonly activeTab = signal<TabId>('hero');

  private readonly codeOpen = signal<Record<TabId, boolean>>({
    hero: false,
    card: false,
  });

  readonly heroEmbedCode = `<script src="https://aem-embed-mfe.vercel.app/scripts/fragment-embed.js" type="module"></script>
<fragment-embed url="https://main--vwr--ynaka-adobe.aem.page/us/en/fragments/hero-fragment"></fragment-embed>`;

  readonly cardEmbedCode = `<script src="https://aem-embed-mfe.vercel.app/scripts/fragment-embed.js" type="module"></script>
<fragment-embed url="https://main--vwr--ynaka-adobe.aem.live/us/en/fragments/card-fragment"></fragment-embed>`;

  selectTab(tab: TabId): void {
    this.activeTab.set(tab);
  }

  isCodeOpen(tab: TabId): boolean {
    return this.codeOpen()[tab];
  }

  toggleCode(tab: TabId): void {
    this.codeOpen.update((state) => ({ ...state, [tab]: !state[tab] }));
  }
}
