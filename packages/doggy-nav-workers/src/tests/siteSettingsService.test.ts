import {
  SiteSettingsService,
  type SiteSettings,
  type SiteSettingsRepository,
  type SiteSettingsUpsertInput,
} from 'doggy-nav-core';

describe('SiteSettingsService hero slides', () => {
  let saved: SiteSettings | null = null;
  const repo: SiteSettingsRepository = {
    get: async () => saved,
    upsert: async (input: SiteSettingsUpsertInput) => {
      saved = input;
      return input;
    },
  };
  const service = new SiteSettingsService(repo);

  beforeEach(() => {
    saved = null;
  });

  it('persists normalized media slides', async () => {
    const result = await service.update({
      heroSlides: [
        {
          title: ' Launch ',
          description: ' Watch ',
          mediaType: 'video',
          mediaUrl: 'https://media.example/launch.webm',
          mediaFit: 'contain',
          ctaLabel: ' Open ',
          ctaHref: '/launch',
          active: true,
          order: 2,
        },
      ],
    });

    expect(result.heroSlides).toEqual([
      {
        title: 'Launch',
        description: 'Watch',
        mediaType: 'video',
        mediaUrl: 'https://media.example/launch.webm',
        mediaFit: 'contain',
        ctaLabel: 'Open',
        ctaHref: '/launch',
        active: true,
        order: 2,
      },
    ]);
    expect(await service.get()).toEqual(result);
  });

  it.each([
    [{ mediaType: 'image', mediaUrl: undefined }],
    [{ mediaType: undefined, mediaUrl: '/hero.png' }],
    [{ mediaType: 'image', mediaUrl: 'ftp://example.com/hero.png' }],
    [{ mediaFit: 'stretch' }],
    [{ ctaLabel: 'Open', ctaHref: undefined }],
    [{ ctaLabel: undefined, ctaHref: 'javascript:alert(1)' }],
  ])('rejects malformed media and CTA pairs', async (partial) => {
    await expect(
      service.update({
        heroSlides: [
          {
            title: '',
            description: '',
            active: true,
            order: 0,
            ...(partial as any),
          },
        ],
      })
    ).rejects.toMatchObject({ name: 'ValidationError' });
  });
});
