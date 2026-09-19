import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VwrHeaderComponent } from './vwr-header.component';
import { DEFAULT_LABELS } from './labels';

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
