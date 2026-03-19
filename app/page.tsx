import type { Metadata } from 'next'
import { Navbar } from '@/components/landing/navbar'
import { HeroSection } from '@/components/landing/hero-section'
import { DemoSection } from '@/components/landing/demo-section'
import { FeaturesSection } from '@/components/landing/features-section'
import { PricingSection } from '@/components/landing/pricing-section'
import { Footer } from '@/components/landing/footer'

export const metadata: Metadata = {
  title: 'Nurai AI Studio — ИИ-фотографии украшений для ювелирных магазинов',
  description:
    'Загрузите фото украшения — получите профессиональный лайфстайл-снимок с помощью ИИ за секунды. Без фотографа, без студии. Для ювелирных магазинов Казахстана.',
  alternates: {
    canonical: '/',
  },
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <Navbar />
      <main>
        <HeroSection />
        <DemoSection />
        <FeaturesSection />
        <PricingSection />
      </main>
      <Footer />
    </div>
  )
}
