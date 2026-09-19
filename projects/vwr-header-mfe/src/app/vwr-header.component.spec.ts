import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VwrHeaderComponent } from './vwr-header.component';
import { DEFAULT_LABELS } from './labels';
import { COUNTRIES } from './nav-data';

function shadowText(fixture: ComponentFixture<VwrHeaderComponent>, selector: string): string {
  const root = (fixture.nativeElement as HTMLElement).shadowRoot ?? (fixture.nativeElement as HTMLElement);
  return root.querySelector(selector)?.textContent?.trim() ?? '';
}

describe('VwrHeaderComponent labels', () => {
  let fixture: ComponentFixture<VwrHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [VwrHeaderComponent] }).compileComponents();
    fixture = TestBed.createComponent(VwrHeaderComponent);
  });

  it('renders English defaults when no labels are supplied', () => {
    fixture.detectChanges();
    expect(shadowText(fixture, '.nav-order-entry')).toBe(DEFAULT_LABELS.orderEntry);
    expect(shadowText(fixture, '.nav-country__label')).toBe(DEFAULT_LABELS.country);
    expect(shadowText(fixture, '.nav-sections li p a')).toBe('Products');
  });

  it('renders localized values from a labels object', () => {
    fixture.componentInstance.labels = {
      orderEntry: 'Commande rapide',
      country: 'France',
      'nav./us/en/products': 'Produits',
    };
    fixture.detectChanges();
    expect(shadowText(fixture, '.nav-order-entry')).toBe('Commande rapide');
    expect(shadowText(fixture, '.nav-country__label')).toBe('France');
    expect(shadowText(fixture, '.nav-sections li p a')).toBe('Produits');
  });

  it('accepts the attribute (JSON string) form', () => {
    fixture.componentInstance.labels = '{"login":"Connexion"}';
    fixture.detectChanges();
    expect(shadowText(fixture, '.nav-auth-links a')).toBe('Connexion');
  });

  it('falls back to defaults on malformed JSON without throwing', () => {
    expect(() => {
      fixture.componentInstance.labels = '{broken';
      fixture.detectChanges();
    }).not.toThrow();
    expect(shadowText(fixture, '.nav-auth-links a')).toBe(DEFAULT_LABELS.login);
  });

  it('localizes the country aria-label via countryPrefix', () => {
    fixture.componentInstance.labels = { countryPrefix: 'Pays', country: 'France' };
    fixture.detectChanges();
    const root = (fixture.nativeElement as HTMLElement).shadowRoot!;
    expect(root.querySelector('.nav-country')?.getAttribute('aria-label')).toBe('Pays: France');
  });
});

describe('VwrHeaderComponent country switcher', () => {
  let fixture: ComponentFixture<VwrHeaderComponent>;

  function root(): ShadowRoot {
    return (fixture.nativeElement as HTMLElement).shadowRoot!;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [VwrHeaderComponent] }).compileComponents();
    fixture = TestBed.createComponent(VwrHeaderComponent);
  });

  it('lists every configured country as a link to its locale root', () => {
    fixture.detectChanges();
    const links = Array.from(root().querySelectorAll<HTMLAnchorElement>('.nav-country__menu a'));
    expect(links.length).toBe(COUNTRIES.length);
    expect(links.map((a) => a.textContent!.trim())).toEqual(['United States', 'Japan', 'Germany']);
    expect(links.map((a) => new URL(a.href).pathname)).toEqual(['/us/en', '/jp', '/de']);
  });

  it('is collapsed until toggled and reports state via aria-expanded', () => {
    fixture.detectChanges();
    const button = root().querySelector<HTMLButtonElement>('.nav-country')!;
    const menu = root().querySelector<HTMLElement>('.nav-country__menu')!;
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(menu.hidden).toBeTrue();

    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(menu.hidden).toBeFalse();
  });

  it('selects the active country from the path, including nested pages', () => {
    fixture.componentInstance.path = '/jp/home';
    fixture.detectChanges();
    expect(shadowText(fixture, '.nav-country__label')).toBe('Japan');
    expect(root().querySelector('.nav-country__menu a.is-current')?.textContent?.trim()).toBe('Japan');
  });

  it('defaults to the first country when the path matches no locale', () => {
    fixture.componentInstance.path = '/somewhere/else';
    fixture.detectChanges();
    expect(shadowText(fixture, '.nav-country__label')).toBe('United States');
  });

  it('applies per-locale country name overrides from labels', () => {
    fixture.componentInstance.path = '/jp';
    fixture.componentInstance.labels = { 'country./jp': '日本', 'country./de': 'Deutschland' };
    fixture.detectChanges();
    expect(shadowText(fixture, '.nav-country__label')).toBe('日本');
    const links = Array.from(root().querySelectorAll('.nav-country__menu a'));
    expect(links.map((a) => a.textContent!.trim())).toEqual(['United States', '日本', 'Deutschland']);
  });

  it('closes on Escape and on a click outside the header', () => {
    fixture.detectChanges();
    const button = root().querySelector<HTMLButtonElement>('.nav-country')!;

    button.click();
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('false');

    button.click();
    fixture.detectChanges();
    document.body.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('keeps the reader on the same page when switching country', () => {
    fixture.componentInstance.path = '/jp/suppliers';
    fixture.detectChanges();
    const hrefs = Array.from(root().querySelectorAll<HTMLAnchorElement>('.nav-country__menu a')).map(
      (a) => new URL(a.href).pathname,
    );
    expect(hrefs).toEqual(['/us/en/suppliers', '/jp/suppliers', '/de/suppliers']);
  });

  it('carries nested paths across locales in both directions', () => {
    fixture.componentInstance.path = '/us/en/fragments/header';
    fixture.detectChanges();
    const hrefs = Array.from(root().querySelectorAll<HTMLAnchorElement>('.nav-country__menu a')).map(
      (a) => new URL(a.href).pathname,
    );
    expect(hrefs).toEqual(['/us/en/fragments/header', '/jp/fragments/header', '/de/fragments/header']);
  });

  it('falls back to locale roots when the page is outside any locale', () => {
    fixture.componentInstance.path = '/somewhere/else';
    fixture.detectChanges();
    const hrefs = Array.from(root().querySelectorAll<HTMLAnchorElement>('.nav-country__menu a')).map(
      (a) => new URL(a.href).pathname,
    );
    expect(hrefs).toEqual(['/us/en', '/jp', '/de']);
  });
});

describe('VwrHeaderComponent link origin and locale rebasing', () => {
  let fixture: ComponentFixture<VwrHeaderComponent>;

  function root(): ShadowRoot {
    return (fixture.nativeElement as HTMLElement).shadowRoot!;
  }

  function hrefOf(selector: string): string {
    return root().querySelector<HTMLAnchorElement>(selector)!.getAttribute('href')!;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [VwrHeaderComponent] }).compileComponents();
    fixture = TestBed.createComponent(VwrHeaderComponent);
  });

  it('emits same-origin relative links by default so the host domain is kept', () => {
    fixture.detectChanges();
    expect(hrefOf('.nav-auth-links a')).toBe('/us/en/login');
    expect(hrefOf('.nav-country__menu a')).toBe('/us/en');
    expect(root().querySelector('.nav-brand a')?.getAttribute('href')).toBe('/us/en');
  });

  it('prefixes an explicit origin when embedded cross-origin', () => {
    fixture.componentInstance.origin = 'https://main--vwr--ynaka-adobe.aem.live';
    fixture.detectChanges();
    expect(hrefOf('.nav-auth-links a')).toBe('https://main--vwr--ynaka-adobe.aem.live/us/en/login');
    expect(hrefOf('.nav-country__menu a')).toBe('https://main--vwr--ynaka-adobe.aem.live/us/en');
  });

  it('tolerates a trailing slash on the origin', () => {
    fixture.componentInstance.origin = 'https://example.com/';
    fixture.detectChanges();
    expect(hrefOf('.nav-auth-links a')).toBe('https://example.com/us/en/login');
  });

  it('rebases source-locale links onto the active locale', () => {
    fixture.componentInstance.path = '/jp/suppliers';
    fixture.detectChanges();
    expect(hrefOf('.nav-auth-links a')).toBe('/jp/login');
    expect(fixture.componentInstance.searchAction()).toBe('/jp/search');
  });

  it('rebases every authored nav link onto the active locale', () => {
    fixture.componentInstance.path = '/jp/suppliers';
    fixture.detectChanges();
    const navHrefs = Array.from(
      root().querySelectorAll<HTMLAnchorElement>('.nav-sections a'),
    ).map((a) => a.getAttribute('href')!);
    expect(navHrefs.length).toBeGreaterThan(0);
    expect(navHrefs.every((h) => h.startsWith('/jp/'))).toBeTrue();
    expect(navHrefs.some((h) => h.startsWith('/us/en'))).toBeFalse();
  });

  it('leaves links alone when already in the source locale', () => {
    fixture.componentInstance.path = '/us/en/suppliers';
    fixture.detectChanges();
    expect(hrefOf('.nav-auth-links a')).toBe('/us/en/login');
    expect(fixture.componentInstance.searchAction()).toBe('/us/en/search');
  });
});
