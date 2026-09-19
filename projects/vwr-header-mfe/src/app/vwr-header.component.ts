import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  Input,
  ViewEncapsulation,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NAV_SECTIONS, SITE_ORIGIN, NavSection } from './nav-data';
import { DEFAULT_LABELS, HeaderLabels, normalizeLabels } from './labels';

// Matches the real header's own behaviour (see vwr blocks/header/header.js):
// mega menu opens/closes on click above this width, becomes an accordion below it.
const DESKTOP_BREAKPOINT = '(min-width: 900px)';

@Component({
  selector: 'app-vwr-header',
  standalone: true,
  templateUrl: './vwr-header.component.html',
  styleUrl: './vwr-header.component.css',
  encapsulation: ViewEncapsulation.ShadowDom,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VwrHeaderComponent {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isDesktop = window.matchMedia(DESKTOP_BREAKPOINT);

  readonly siteOrigin = SITE_ORIGIN;
  readonly mobileOpen = signal(false);
  readonly openSectionHref = signal<string | null>(null);

  private readonly labelsState = signal<HeaderLabels>(DEFAULT_LABELS);

  /**
   * Locale-specific labels, as the `labels` attribute (a JSON string, which is
   * what a custom element receives from markup) or the `labels` property (an
   * already-parsed object). Fed by the AEM DA sheet row `data[0]`; anything
   * missing or malformed falls back to the English defaults.
   */
  @Input()
  set labels(value: string | Record<string, unknown> | null | undefined) {
    this.labelsState.set(normalizeLabels(value));
  }
  get labels(): HeaderLabels {
    return this.labelsState();
  }

  readonly t = this.labelsState.asReadonly();

  /** Nav data with any per-href label overrides applied. */
  readonly navSections = computed<NavSection[]>(() => {
    const overrides = this.labelsState().nav;
    if (!Object.keys(overrides).length) return NAV_SECTIONS;
    return NAV_SECTIONS.map((section) => ({
      ...section,
      label: overrides[section.href] ?? section.label,
      items: section.items.map((item) => ({
        ...item,
        label: overrides[item.href] ?? item.label,
      })),
    }));
  });

  countryAriaLabel(): string {
    const labels = this.labelsState();
    return `${labels.countryPrefix}: ${labels.country}`;
  }

  constructor() {
    const onViewportChange = () => {
      this.mobileOpen.set(false);
      this.openSectionHref.set(null);
    };
    this.isDesktop.addEventListener('change', onViewportChange);
    this.destroyRef.onDestroy(() => this.isDesktop.removeEventListener('change', onViewportChange));
  }

  absoluteHref(path: string): string {
    return `${this.siteOrigin}${path}`;
  }

  searchAction(): string {
    return `${this.siteOrigin}/us/en/search`;
  }

  toggleMobileMenu(): void {
    this.mobileOpen.update((open) => !open);
    if (!this.mobileOpen()) this.openSectionHref.set(null);
  }

  toggleSection(section: NavSection, event: Event): void {
    if (this.isDesktop.matches) {
      // Desktop: the top-level link opens/closes the mega menu instead of navigating.
      event.preventDefault();
      this.openSectionHref.update((current) => (current === section.href ? null : section.href));
    } else {
      // Mobile: tapping the top-level item expands its accordion in place.
      event.preventDefault();
      this.openSectionHref.update((current) => (current === section.href ? null : section.href));
    }
  }

  closeMegaMenu(): void {
    this.openSectionHref.set(null);
  }

  // Mirrors the real header's outside-click / focus-lost handling, simplified.
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.openSectionHref() === null) return;
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.closeMegaMenu();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.openSectionHref() !== null) {
      this.closeMegaMenu();
    } else if (this.mobileOpen()) {
      this.toggleMobileMenu();
    }
  }
}
