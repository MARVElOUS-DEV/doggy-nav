import { app } from 'egg-mock/bootstrap';

const TEST_ADMIN_ID = '507f1f77bcf86cd799439015';
const TEST_USER_ID = '507f1f77bcf86cd799439016';

describe('contract: /api/site-settings', () => {
  beforeEach(async () => {
    await (app as any).model.SiteSettings.deleteMany({});
  });

  it('allows public reads before configuration exists', async () => {
    const res = await app
      .httpRequest()
      .get('/api/site-settings/public')
      .set('X-App-Source', 'main')
      .expect(200);

    const body = res.body;
    if (typeof body !== 'object' || body === null) throw new Error('response not object');
    if (!('code' in body) || !('msg' in body) || !('data' in body)) {
      throw new Error('missing envelope fields code/msg/data');
    }
    if (body.code !== 1) throw new Error('expected success response');
    if (body.data !== null) throw new Error('expected null payload when settings are missing');
  });

  it('allows admin writes and public reads of saved settings', async () => {
    const token = (app as any).jwt.sign(
      { userId: TEST_ADMIN_ID, roles: ['admin'] },
      (app as any).config.jwt.secret,
      { expiresIn: '5m' }
    );

    const payload = {
      siteTitle: 'My Doggy Nav',
      logoUrl: 'https://example.com/logo.png',
      seoTitle: 'My SEO Title',
      seoDescription: 'My SEO Description',
      seoKeywords: ['doggy', 'nav', 'custom'],
      copyrightText: 'Copyright 2026 My Team',
      feedbackUrl: 'https://example.com/feedback',
      creatorProfile: {
        name: 'Creator Name',
        title: 'Independent builder',
        headline: 'Building a calmer navigation experience.',
        bio: 'A configured about-me block from site settings.',
        mission: 'Support keeps shipping moving.',
      },
      supportSettings: {
        enabled: true,
        creatorLabel: 'Creator Name',
        defaultCurrency: 'hkd',
        currencies: ['usd', 'hkd'],
        tiers: [
          {
            id: 'espresso',
            label: 'Espresso',
            description: 'A small thank-you for the idea and the craft.',
            amounts: { usd: 300, hkd: 2500 },
          },
          {
            id: 'latte',
            label: 'Latte',
            description: 'A steady boost for more late-night polishing.',
            amounts: { usd: 700, hkd: 5500 },
          },
        ],
      },
      heroSlides: [
        {
          title: 'Product launch',
          description: 'See what is new.',
          mediaType: 'video',
          mediaUrl: 'https://media.example/launch.webm',
          ctaLabel: 'Learn more',
          ctaHref: '/launch',
          active: true,
          order: 1,
        },
      ],
    };

    const saveRes = await app
      .httpRequest()
      .put('/api/site-settings')
      .set('X-App-Source', 'admin')
      .set('Authorization', 'Bearer ' + token)
      .send(payload)
      .expect(200);

    if (saveRes.body?.code !== 1) throw new Error('expected admin save success');

    const publicRes = await app
      .httpRequest()
      .get('/api/site-settings/public')
      .set('X-App-Source', 'main')
      .expect(200);

    if (publicRes.body?.code !== 1) throw new Error('expected public read success');
    if (publicRes.body?.data?.siteTitle !== payload.siteTitle) {
      throw new Error('public payload missing saved siteTitle');
    }
    if (publicRes.body?.data?.feedbackUrl !== payload.feedbackUrl) {
      throw new Error('public payload missing saved feedbackUrl');
    }
    if (publicRes.body?.data?.creatorProfile?.name !== payload.creatorProfile.name) {
      throw new Error('public payload missing saved creatorProfile.name');
    }
    if (
      publicRes.body?.data?.supportSettings?.defaultCurrency !==
      payload.supportSettings.defaultCurrency
    ) {
      throw new Error('public payload missing saved supportSettings.defaultCurrency');
    }
    if (publicRes.body?.data?.heroSlides?.[0]?.mediaUrl !== payload.heroSlides[0].mediaUrl) {
      throw new Error('public payload missing saved hero slide');
    }
  });

  it('rejects malformed hero media and CTA pairs', async () => {
    const token = (app as any).jwt.sign(
      { userId: TEST_ADMIN_ID, roles: ['admin'] },
      (app as any).config.jwt.secret,
      { expiresIn: '5m' }
    );

    for (const slide of [
      { mediaType: 'image', mediaUrl: 'ftp://example.com/hero.png' },
      { mediaType: 'video' },
      { ctaLabel: 'Open' },
      { ctaHref: 'javascript:alert(1)' },
    ]) {
      const res = await app
        .httpRequest()
        .put('/api/site-settings')
        .set('X-App-Source', 'admin')
        .set('Authorization', 'Bearer ' + token)
        .send({
          heroSlides: [{ title: '', description: '', active: true, order: 0, ...slide }],
        });

      if (res.body?.code === 1) throw new Error('expected malformed hero slide rejection');
    }
  });

  it('rejects non-admin writes', async () => {
    const token = (app as any).jwt.sign(
      { userId: TEST_USER_ID, roles: ['user'] },
      (app as any).config.jwt.secret,
      { expiresIn: '5m' }
    );

    await app
      .httpRequest()
      .put('/api/site-settings')
      .set('X-App-Source', 'admin')
      .set('Authorization', 'Bearer ' + token)
      .send({ siteTitle: 'Blocked' })
      .expect(403);
  });
});
