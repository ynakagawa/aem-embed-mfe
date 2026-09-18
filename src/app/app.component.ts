import { Component, signal } from '@angular/core';
import { HeroFragmentComponent } from './hero-fragment/hero-fragment.component';
import { CardFragmentComponent } from './card-fragment/card-fragment.component';
import { HeaderMfeComponent } from './header-mfe/header-mfe.component';
import { EmbedPanelComponent } from './embed-panel/embed-panel.component';

type TabId = 'hero' | 'card' | 'header-mfe';

@Component({
  selector: 'app-root',
  imports: [
    HeroFragmentComponent,
    CardFragmentComponent,
    HeaderMfeComponent,
    EmbedPanelComponent,
  ],
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
    'header-mfe': false,
  });

  readonly heroEmbedCode = `<script src="https://aem-embed-mfe.vercel.app/scripts/fragment-embed.js" type="module"></script>
<fragment-embed url="https://main--vwr--ynaka-adobe.aem.page/us/en/fragments/hero-fragment"></fragment-embed>`;

  readonly cardEmbedCode = `<script src="https://aem-embed-mfe.vercel.app/scripts/fragment-embed.js" type="module"></script>
<fragment-embed url="https://main--vwr--ynaka-adobe.aem.live/us/en/fragments/card-fragment"></fragment-embed>`;

  readonly headerMfeEmbedCode = `<!-- Built with: npm run build -- vwr-header-mfe  ->  dist/vwr-header-mfe/browser/main.js
     Host main.js (plus any sibling chunks) somewhere the AEM DA page can reach,
     then point the mfe block's _mfe.json at it:
       "Script URL": https://YOUR_HOST/vwr-header-mfe/main.js
       "Tag Name":   vwr-header-mfe -->

<!-- What the mfe block effectively does at runtime: -->
<script type="module">
  await import('https://YOUR_HOST/vwr-header-mfe/main.js');
  document.body.prepend(document.createElement('vwr-header-mfe'));
</script>

<!-- Equivalent plain-HTML form: -->
<script type="module" src="https://YOUR_HOST/vwr-header-mfe/main.js"></script>
<vwr-header-mfe></vwr-header-mfe>`;

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
