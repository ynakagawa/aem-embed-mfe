import { CUSTOM_ELEMENTS_SCHEMA, Component, OnInit, signal } from '@angular/core';
import { SITE_ORIGIN } from '../../../projects/vwr-header-mfe/src/app/nav-data';

// Same two values an AEM DA `mfe` block is configured with (its _mfe.json
// "Tag Name" field, plus the script URL it loads).
const TAG_NAME = 'vwr-header-mfe';
const SCRIPT_URL = '/vwr-header-mfe/main.js';

@Component({
  selector: 'app-header-mfe',
  imports: [],
  templateUrl: './header-mfe.component.html',
  styleUrl: './header-mfe.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HeaderMfeComponent implements OnInit {
  readonly status = signal<'loading' | 'ready' | 'error'>('loading');
  readonly scriptUrl = SCRIPT_URL;

  // This shell is served from a different origin than the content site, so
  // relative links would 404 here. Real embeds on the content domain leave
  // `origin` unset and stay same-origin.
  readonly contentOrigin = SITE_ORIGIN;

  async ngOnInit(): Promise<void> {
    if (customElements.get(TAG_NAME)) {
      this.status.set('ready');
      return;
    }

    try {
      // Deliberately mirrors the `mfe` block: await the dynamic import, then
      // rely on the element already being defined. main.ts uses a top-level
      // await so that contract holds.
      await import(/* @vite-ignore */ SCRIPT_URL);
      await customElements.whenDefined(TAG_NAME);
      this.status.set('ready');
    } catch {
      this.status.set('error');
    }
  }
}
