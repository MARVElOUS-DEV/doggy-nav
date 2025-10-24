import { NextPage } from 'next';
import Head from 'next/head';
import TranslationCard from '@/components/TranslationCard';

/**
 * Translation Tool Demo Page
 */
const TranslationPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>翻译工具 - Doggy Nav</title>
        <meta name="description" content="精美的卡片式翻译工具" />
      </Head>

      <div
        className="min-h-screen py-12 px-4 sm:px-6 lg:px-8"
        style={{
          backgroundColor: 'var(--color-background)',
        }}
      >
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1
              className="text-4xl font-bold mb-4"
              style={{
                color: 'var(--color-foreground)',
              }}
            >
              🌐 翻译工具
            </h1>
            <p
              className="text-lg"
              style={{
                color: 'var(--color-muted-foreground)',
              }}
            >
              支持多语言实时翻译，左侧输入，右侧输出
            </p>
          </div>

          {/* Translation Card */}
          <TranslationCard />

          {/* Features Section */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              className="p-6 rounded-xl border"
              style={{
                backgroundColor: 'var(--color-card)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="text-3xl mb-3">⚡</div>
              <h3
                className="text-lg font-semibold mb-2"
                style={{ color: 'var(--color-foreground)' }}
              >
                自动翻译
              </h3>
              <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                停止输入 800ms 后自动触发翻译，无需手动点击
              </p>
            </div>

            <div
              className="p-6 rounded-xl border"
              style={{
                backgroundColor: 'var(--color-card)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="text-3xl mb-3">🌍</div>
              <h3
                className="text-lg font-semibold mb-2"
                style={{ color: 'var(--color-foreground)' }}
              >
                多语言支持
              </h3>
              <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                支持中文、英语、日语、韩语、法语、德语、西班牙语
              </p>
            </div>

            <div
              className="p-6 rounded-xl border"
              style={{
                backgroundColor: 'var(--color-card)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="text-3xl mb-3">💾</div>
              <h3
                className="text-lg font-semibold mb-2"
                style={{ color: 'var(--color-foreground)' }}
              >
                记忆偏好
              </h3>
              <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                自动保存语言选择，下次使用无需重新设置
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TranslationPage;
