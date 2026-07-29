import D1SiteSettingsRepositoryAdapter from '../adapters/d1SiteSettingsRepositoryAdapter';

describe('D1SiteSettingsRepositoryAdapter hero slides', () => {
  it('serializes hero slides and normalizes missing JSON', async () => {
    const row: any = {
      id: 'default',
      seo_keywords: '[]',
      creator_profile: 'null',
      support_settings: 'null',
    };
    const db = {
      prepare(sql: string) {
        let params: any[] = [];
        const statement = {
          bind(...values: any[]) {
            params = values;
            return statement;
          },
          async first() {
            return sql.includes('SELECT id') ? { id: 'default' } : row;
          },
          async run() {
            if (sql.includes('UPDATE site_settings')) row.hero_slides = params[9];
            return {};
          },
        };
        return statement;
      },
    };
    const adapter = new D1SiteSettingsRepositoryAdapter(db as any);

    expect((await adapter.get())?.heroSlides).toEqual([]);

    const saved = await adapter.upsert({
      seoKeywords: [],
      heroSlides: [
        {
          title: 'Hero',
          description: '',
          mediaType: 'image',
          mediaUrl: '/hero.webp',
          mediaFit: 'contain',
          active: true,
          order: 0,
        },
      ],
    });

    expect(JSON.parse(row.hero_slides)[0].mediaUrl).toBe('/hero.webp');
    expect(saved.heroSlides?.[0].mediaFit).toBe('contain');
    expect(saved.heroSlides?.[0].title).toBe('Hero');
  });
});
