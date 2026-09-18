import { Component, computed, input, output } from '@angular/core';

/**
 * `in`  - AEM-authored content is pulled INTO this non-EDS app.
 * `out` - this app's UI ships OUT as a custom element an AEM DA block loads.
 */
export type EmbedDirection = 'in' | 'out';

@Component({
  selector: 'app-embed-panel',
  imports: [],
  templateUrl: './embed-panel.component.html',
  styleUrl: './embed-panel.component.css',
})
export class EmbedPanelComponent {
  heading = input.required<string>();
  code = input.required<string>();
  direction = input.required<EmbedDirection>();
  codeOpen = input(false);
  codeToggled = output<void>();

  readonly directionLabel = computed(() =>
    this.direction() === 'in' ? 'AEM \u2192 App' : 'App \u2192 AEM',
  );

  readonly directionHint = computed(() =>
    this.direction() === 'in'
      ? 'EDS-authored content pulled into this app'
      : "this app's UI shipped out to an AEM DA block",
  );
}
