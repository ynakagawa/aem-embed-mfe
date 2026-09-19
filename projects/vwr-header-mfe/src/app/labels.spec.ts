import { DEFAULT_LABELS, normalizeLabels } from './labels';

describe('normalizeLabels', () => {
  it('returns English defaults for missing/empty input', () => {
    for (const input of [undefined, null, '', '   ']) {
      expect(normalizeLabels(input)).toEqual(DEFAULT_LABELS);
    }
  });

  it('returns defaults for malformed JSON without throwing', () => {
    expect(() => normalizeLabels('{not json')).not.toThrow();
    expect(normalizeLabels('{not json')).toEqual(DEFAULT_LABELS);
    expect(normalizeLabels('"just a string"')).toEqual(DEFAULT_LABELS);
    expect(normalizeLabels(42)).toEqual(DEFAULT_LABELS);
  });

  it('merges a DA sheet row over the defaults', () => {
    const labels = normalizeLabels({ login: 'Connexion', askAi: 'Demander à l’IA' });
    expect(labels.login).toBe('Connexion');
    expect(labels.askAi).toBe('Demander à l’IA');
    expect(labels.register).toBe(DEFAULT_LABELS.register);
  });

  it('accepts a JSON string (the custom element attribute form)', () => {
    expect(normalizeLabels('{"orderEntry":"Commande rapide"}').orderEntry).toBe('Commande rapide');
  });

  it('ignores unknown keys, non-strings and blank values', () => {
    const labels = normalizeLabels({ login: '  ', search: 5, bogus: 'x', cart: ' Panier ' });
    expect(labels.login).toBe(DEFAULT_LABELS.login);
    expect(labels.search).toBe(DEFAULT_LABELS.search);
    expect(labels.cart).toBe('Panier');
    expect((labels as unknown as Record<string, unknown>)['bogus']).toBeUndefined();
  });

  it('reads nav overrides from flat `nav.<href>` sheet columns', () => {
    expect(normalizeLabels({ 'nav./us/en/products': 'Produits' }).nav['/us/en/products']).toBe(
      'Produits',
    );
  });

  it('reads nav overrides from a nested nav object', () => {
    expect(normalizeLabels({ nav: { '/us/en/services': 'Services FR' } }).nav['/us/en/services'])
      .toBe('Services FR');
  });

  it('unwraps a whole sheet or data array', () => {
    expect(normalizeLabels({ data: [{ login: 'Connexion' }] }).login).toBe('Connexion');
    expect(normalizeLabels([{ login: 'Connexion' }]).login).toBe('Connexion');
  });

  it('does not mutate the shared defaults', () => {
    normalizeLabels({ 'nav./us/en/products': 'Produits' });
    expect(DEFAULT_LABELS.nav).toEqual({});
  });
});
