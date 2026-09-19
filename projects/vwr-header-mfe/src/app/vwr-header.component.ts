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
import { NAV_SECTIONS, SITE_ORIGIN, COUNTRIES, CountryOption, NavSection } from './nav-data';
import { DEFAULT_LABELS, HeaderLabels, normalizeLabels } from './labels';

// Matches the real header's own behaviour (see vwr blocks/header/header.js):
// mega menu opens/closes on click above this width, becomes an accordion below it.
const DESKTOP_BREAKPOINT = '(min-width: 900px)';

// Locale the nav data is authored against. Links carrying this prefix get
// rebased onto whichever locale the reader is currently in.
const SOURCE_LOCALE = '/us/en';

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

  readonly mobileOpen = signal(false);
  readonly openSectionHref = signal<string | null>(null);
  readonly countryOpen = signal(false);

  /**
   * Origin that links are resolved against. Empty by default so hrefs stay
   * same-origin and the header keeps the reader on whichever domain is serving
   * the page (aem.live, aem.page or a production hostname). A host that embeds
   * this widget cross-origin - the standalone demo shell - sets `origin` to
   * point links back at the content site.
   */
  private readonly originState = signal('');

  @Input()
  set origin(value: string | null | undefined) {
    this.originState.set(typeof value === 'string' ? value.trim().replace(/\/$/, '') : '');
  }

  private readonly labelsState = signal<HeaderLabels>(DEFAULT_LABELS);

  /**
   * Pathname used to decide which locale is active. Defaults to the embedding
   * page's path; the `path` input exists so the value can be supplied
   * explicitly (tests, or a host that routes without changing location).
   */
  private readonly pathnameState = signal(window.location.pathname);
  readonly pathname = this.pathnameState.asReadonly();

  @Input()
  set path(value: string | null | undefined) {
    if (typeof value === 'string' && value.trim()) {
      this.pathnameState.set(value.trim());
    }
  }

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
    return `${labels.countryPrefix}: ${this.currentCountryLabel()}`;
  }

  /**
   * The locale the page is currently in, matched against the pathname. The
   * longest matching path wins so `/us/en` is not shadowed by a future `/us`.
   */
  readonly currentCountry = computed<CountryOption>(() => {
    const path = this.pathname();
    const match = [...COUNTRIES]
      .sort((a, b) => b.path.length - a.path.length)
      .find((country) => path === country.path || path.startsWith(`${country.path}/`));
    return match ?? COUNTRIES[0];
  });

  /** Country options with any per-locale label overrides applied. */
  readonly countryOptions = computed<CountryOption[]>(() => {
    const overrides = this.labelsState().countries;
    if (!Object.keys(overrides).length) return COUNTRIES;
    return COUNTRIES.map((country) => ({
      ...country,
      label: overrides[country.path] ?? country.label,
    }));
  });

  /**
   * Label for the currently selected country. A `country.<path>` override wins;
   * otherwise the legacy flat `country` key applies, but only when a sheet
   * actually supplied one - its default would otherwise mask the detected locale.
   */
  readonly currentCountryLabel = computed<string>(() => {
    const current = this.currentCountry();
    const labels = this.labelsState();
    const override = labels.countries[current.path];
    if (override) return override;
    if (labels.country && labels.country !== DEFAULT_LABELS.country) return labels.country;
    return current.label;
  });

  toggleCountryMenu(): void {
    this.countryOpen.update((open) => !open);
    if (this.countryOpen()) this.openSectionHref.set(null);
  }

  closeCountryMenu(): void {
    this.countryOpen.set(false);
  }

  isCurrentCountry(country: CountryOption): boolean {
    return country.path === this.currentCountry().path;
  }

  /**
   * Href for a country option. The path below the locale root is carried over
   * so switching country keeps the reader on the page they were reading -
   * /jp/suppliers goes to /us/en/suppliers, not back to the locale home. Not
   * rebased: the target locale is already explicit in the option.
   */
  countryHref(country: CountryOption): string {
    const current = this.currentCountry();
    const path = this.pathname();
    const inCurrentLocale = path === current.path || path.startsWith(`${current.path}/`);
    const remainder = inCurrentLocale ? path.slice(current.path.length).replace(/\/$/, '') : '';
    return `${this.originState()}${country.path}${remainder}`;
  }

  constructor() {
    const onViewportChange = () => {
      this.mobileOpen.set(false);
      this.openSectionHref.set(null);
    };
    this.isDesktop.addEventListener('change', onViewportChange);
    this.destroyRef.onDestroy(() => this.isDesktop.removeEventListener('change', onViewportChange));
  }

  /**
   * Resolve a link authored against the source locale. The `/us/en` prefix is
   * swapped for whichever locale the reader is in, so the header does not send
   * a visitor on /jp back into English pages. Non locale-scoped paths (such as
   * the logo asset) pass through untouched.
   */
  href(path: string): string {
    return `${this.originState()}${this.rebase(path)}`;
  }

  private rebase(path: string): string {
    const base = this.currentCountry().path;
    if (base === SOURCE_LOCALE) return path;
    if (path === SOURCE_LOCALE) return base;
    if (path.startsWith(`${SOURCE_LOCALE}/`)) return `${base}${path.slice(SOURCE_LOCALE.length)}`;
    return path;
  }

  searchAction(): string {
    return this.href(`${SOURCE_LOCALE}/search`);
  }

  toggleMobileMenu(): void {
    this.mobileOpen.update((open) => !open);
    if (!this.mobileOpen()) this.openSectionHref.set(null);
  }

  toggleSection(section: NavSection, event: Event): void {
    this.closeCountryMenu();
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
    if (this.openSectionHref() === null && !this.countryOpen()) return;
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.closeMegaMenu();
      this.closeCountryMenu();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.countryOpen()) {
      this.closeCountryMenu();
    } else if (this.openSectionHref() !== null) {
      this.closeMegaMenu();
    } else if (this.mobileOpen()) {
      this.toggleMobileMenu();
    }
  }
}
