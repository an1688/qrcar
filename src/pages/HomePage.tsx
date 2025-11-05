import { Link } from 'react-router-dom'
import { QrCode, Phone, Shield, Zap, Moon, Users, ChevronRight, CheckCircle, Star, Clock, CreditCard, HelpCircle, ChevronDown, Play, Sparkles, ArrowRight } from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'
import { useState, useEffect } from 'react'

export default function HomePage() {
  usePageTitle('QR주차시스템 - 차주 연락 플랫폼')
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // SEO优化的结构化数据
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "QR주차시스템",
    "description": "QR코드로 차주에게 연락하는 혁신적인 주차 솔루션",
    "provider": {
      "@type": "Organization",
      "name": "QR주차시스템",
      "url": "https://qr-parking.com"
    },
    "serviceType": "주차 관리 서비스",
    "areaServed": "대한민국",
    "offers": [
      {
        "@type": "Offer",
        "name": "기본 요금제",
        "price": "0",
        "priceCurrency": "KRW"
      },
      {
        "@type": "Offer", 
        "name": "프리미엄 요금제",
        "price": "9900",
        "priceCurrency": "KRW"
      }
    ]
  }

  return (
    <>
      {/* SEO优化的结构化数据 */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      
      <div className="min-h-screen">
        {/* SEO优化的Hero Section - 静态背景 */}
        <section className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 min-h-screen flex items-center">
          {/* 静态背景层 */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70"></div>
          
          {/* 装饰性几何图形 - 不影响SEO */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-20 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          </div>

          {/* Hero Content */}
          <div className={`relative z-10 text-center px-6 max-w-4xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Logo */}
            <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-primary-500/20 to-primary-600/30 rounded-3xl mb-8 backdrop-blur-sm border border-white/10">
              <QrCode className="w-16 h-16 text-primary-400" />
            </div>
            
            {/* SEO优化的主标题 */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white via-blue-100 to-primary-200 bg-clip-text text-transparent">
                QR주차시스템
              </span>
            </h1>
            
            {/* 副标题 - SEO关键词优化 */}
            <h2 className="text-2xl md:text-3xl text-gray-200 mb-4 max-w-3xl mx-auto leading-relaxed">
              QR코드로 차주에게 연락하는 혁신적인 주차 솔루션
            </h2>
            
            {/* 描述文本 - 增加关键词密度 */}
            <div className="text-lg text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
              <p className="mb-4">
                차량번호판 QR코드를 통해 주차장阻塞, 상가 주차, 주차장 관리 등 다양한 상황에서 
                차주와 즉시 연락할 수 있는 스마트한 주차 관리 시스템입니다.
              </p>
              <p className="text-base text-gray-400">
                혁신적인 QR코드 기술로 아파트 주차장, 오피스텔 주차장, 상가 앞 주차구역에서 발생하는 
                주차 갈등을 예방하고, 24시간 언제든지 차주에게 연락할 수 있어 효율적인 주차 관리를 실현합니다. 
                개인정보 보호, 야광 QR코드, 이중번호 시스템으로 안전하고 편리한 주차 솔루션을 제공합니다.
              </p>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link 
                to="/call/demo123" 
                className="group relative px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl font-semibold text-white overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary-500/25"
              >
                <span className="relative z-10 flex items-center gap-2">
                  지금 시작하기
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              
              <Link 
                to="/bind/demo123" 
                className="group px-8 py-4 bg-white/10 backdrop-blur-md rounded-2xl font-semibold text-white border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105"
              >
                <span className="flex items-center gap-2">
                  차주 등록
                  <Sparkles className="w-5 h-5" />
                </span>
              </Link>
            </div>
          </div>
        </section>

      {/* Content Sections */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-800">
        {/* Features Section */}
        <section className="py-20 px-6" aria-labelledby="features-heading">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 id="features-heading" className="text-4xl md:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  제품 특징
                </span>
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                차량 주차 문제를 해결하는 혁신적인 솔루션
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-green-600/30 rounded-2xl flex items-center justify-center mb-6">
                    <Shield className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">안전</h3>
                  <p className="text-gray-300 leading-relaxed">개인정보 보호 및 안전한 연락처 관리</p>
                </div>
              </div>
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/20">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-500/20 to-yellow-600/30 rounded-2xl flex items-center justify-center mb-6">
                    <Zap className="w-8 h-8 text-yellow-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">간편</h3>
                  <p className="text-gray-300 leading-relaxed">간편한 QR코드 스캔으로 즉시 연락</p>
                </div>
              </div>
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-blue-600/30 rounded-2xl flex items-center justify-center mb-6">
                    <Moon className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">야광</h3>
                  <p className="text-gray-300 leading-relaxed">야간에도 선명한 QR코드 인식</p>
                </div>
              </div>
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-purple-600/30 rounded-2xl flex items-center justify-center mb-6">
                    <Users className="w-8 h-8 text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">이중번호</h3>
                  <p className="text-gray-300 leading-relaxed">주차장 전용 번호로骚扰 방지</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section className="py-20 px-6" aria-labelledby="how-it-works-heading">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 id="how-it-works-heading" className="text-4xl md:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  사용 방법
                </span>
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                간단한 4단계로 시작하세요
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { step: '1', title: 'QR코드 생성', desc: '차량번호판에 QR코드 부착', icon: '🔧', color: 'from-blue-500 to-cyan-500' },
                { step: '2', title: '연락처 등록', desc: '차주가 연락처 정보 등록', icon: '📱', color: 'from-purple-500 to-pink-500' },
                { step: '3', title: 'QR코드 스캔', desc: '방문객이 QR코드 스캔', icon: '📷', color: 'from-green-500 to-emerald-500' },
                { step: '4', title: '즉시 연락', desc: '전화 또는 메시지로 연락', icon: '📞', color: 'from-orange-500 to-red-500' }
              ].map((item, index) => (
                <div key={index} className="group relative text-center">
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500`}></div>
                  <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-300 hover:scale-105">
                    <div className={`w-20 h-20 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                      <span className="text-3xl">{item.icon}</span>
                    </div>
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-xl font-bold text-white">{item.step}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                    <p className="text-gray-300 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="py-20 px-6" aria-labelledby="use-cases-heading">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 id="use-cases-heading" className="text-4xl md:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  활용 사례
                </span>
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
                다양한 상황에서 활용되는 QR주차시스템
              </p>
              <div className="max-w-4xl mx-auto text-gray-300 leading-relaxed">
                <p className="mb-4">
                  QR주차시스템은 주차장阻塞, 상가 주차, 주차장 관리 등 다양한 주차 상황에서 발생하는 문제를 
                  혁신적으로 해결하는 스마트한 솔루션입니다. 차량번호판에 부착된 QR코드를 통해 차주와 즉시 연락할 수 있어, 
                  주차 갈등을 예방하고 원활한 주차 관리를 실현합니다.
                </p>
                <p>
                  특히 아파트, 오피스텔, 상가, 개인 주차공간 등 다양한 환경에서 효과적으로 활용되며, 
                  24시간 언제든지 차주에게 연락할 수 있어 긴급 상황 대응에도 탁월한 성능을 발휘합니다.
                </p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: '주차장阻塞', desc: '차량이 주차되어 다른 차량을 막은 경우', icon: '🚗', color: 'from-red-500 to-pink-500' },
                { title: '상가 주차', desc: '상가 앞 주차구역에서 긴급 연락이 필요한 경우', icon: '🏢', color: 'from-blue-500 to-indigo-500' },
                { title: '주차장 관리', desc: '아파트, 오피스텔 주차장에서 차량 이동이 필요한 경우', icon: '🏠', color: 'from-green-500 to-teal-500' }
              ].map((item, index) => (
                <div key={index} className="group relative">
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500`}></div>
                  <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-300 hover:scale-105">
                    <div className="text-center mb-6">
                      <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                        <span className="text-3xl">{item.icon}</span>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-4">{item.title}</h3>
                    </div>
                    <p className="text-gray-300 text-center leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 px-6" aria-labelledby="pricing-heading">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 id="pricing-heading" className="text-4xl md:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  요금제
                </span>
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                모든 사용자에게 적합한 요금제
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  name: '기본',
                  price: '무료',
                  desc: '개인 사용자를 위한 기본 기능',
                  features: ['QR코드 생성', '연락처 등록', '기본 통계'],
                  color: 'from-gray-500 to-gray-600',
                  border: 'border-gray-600'
                },
                {
                  name: '프리미엄',
                  price: '월 9,900원',
                  desc: '비즈니스 사용자를 위한 고급 기능',
                  features: ['기본 기능 모두 포함', '고급 통계', '우선 고객 지원', '커스텀 QR코드'],
                  color: 'from-primary-500 to-primary-600',
                  border: 'border-primary-500',
                  popular: true
                },
                {
                  name: '엔터프라이즈',
                  price: '문의',
                  desc: '대규모 조직을 위한 맞춤형 솔루션',
                  features: ['프리미엄 기능 모두 포함', 'API 연동', '전담 고객 관리', '맞춤형 개발'],
                  color: 'from-purple-500 to-purple-600',
                  border: 'border-purple-600'
                }
              ].map((plan, index) => (
                <div key={index} className={`group relative ${plan.popular ? 'scale-105' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                      <span className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                        추천
                      </span>
                    </div>
                  )}
                  <div className={`absolute inset-0 bg-gradient-to-br ${plan.color} opacity-20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500`}></div>
                  <div className={`relative bg-white/5 backdrop-blur-xl border-2 ${plan.border} rounded-3xl p-8 hover:bg-white/10 transition-all duration-300 hover:scale-105`}>
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-white mb-4">{plan.name}</h3>
                      <div className={`text-4xl font-bold bg-gradient-to-r ${plan.color} bg-clip-text text-transparent mb-4`}>
                        {plan.price}
                      </div>
                      <p className="text-gray-300">{plan.desc}</p>
                    </div>
                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center text-gray-300">
                          <CheckCircle className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <button className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-lg hover:shadow-primary-500/25' 
                        : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                    }`}>
                      {plan.name === '프리미엄' ? '구독하기' : plan.name === '엔터프라이즈' ? '문의하기' : '시작하기'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Detailed Service Introduction */}
        <section className="py-20 px-6" aria-labelledby="service-intro-heading">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 id="service-intro-heading" className="text-4xl md:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  QR주차시스템 상세 안내
                </span>
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-4">QR코드 주차 시스템의 혁신</h3>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    QR주차시스템은 전통적인 주차 관리 방식의 한계를 극복한 혁신적인 솔루션입니다. 
                    차량번호판에 부착된 QR코드를 통해 방문객이나 관리자가 손쉽게 차주와 연락할 수 있어, 
                    주차장阻塞 문제부터 상가 주차 관리까지 모든 주차 관련 문제를 효율적으로 해결합니다.
                  </p>
                  <p className="text-gray-300 leading-relaxed">
                    특히 24시간 언제든지 접근 가능한 스마트한 시스템으로, 야간이나 긴급 상황에서도 
                    신속하게 차주에게 연락할 수 있어 주차 갈등을 예방하고 원활한 주차 환경을 조성합니다.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold text-white mb-4">개인정보 보호 및 보안</h3>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    QR주차시스템은 개인정보보호법을 철저히 준수하며, 모든 개인정보는 SSL 암호화로 안전하게 보호됩니다. 
                    연락처 정보는 QR코드를 스캔한 사람에게만 제한적으로 공개되어 개인정보 유출의 위험을 최소화합니다.
                  </p>
                  <p className="text-gray-300 leading-relaxed">
                    또한 이중번호 시스템으로 인해 개인 연락처를 보호하면서도 효과적인 커뮤니케이션을 실현할 수 있어, 
                   骚扰 문제 없이 안전한 주차 관리 서비스를 제공합니다.
                  </p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-4">다양한 활용 분야</h3>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    QR주차시스템은 아파트 주차장, 오피스텔 주차장, 상가 앞 주차구역, 개인 주차공간 등 
                    다양한 환경에서 효과적으로 활용됩니다. 각 환경의 특성에 맞게 최적화된 솔루션을 제공하여, 
                    모든 주차 상황에서 원활한 관리와 소통을 가능하게 합니다.
                  </p>
                  <p className="text-gray-300 leading-relaxed">
                    특히 대규모 아파트 단지나 상업시설에서는 다수의 차량을 효율적으로 관리할 수 있어, 
                    관리자의 부담을 크게减轻하면서도 주민이나 고객들의 만족도를 높일 수 있습니다.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold text-white mb-4">기술적 우수성</h3>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    야광 코팅이施된 QR코드로 제작되어 야간이나 어두운 곳에서도 선명하게 인식됩니다. 
                    또한 반응형 웹 디자인으로 모바일 기기에서도 최적화된 사용자 경험을 제공합니다.
                  </p>
                  <p className="text-gray-300 leading-relaxed">
                    클라우드 기반 인프라로 안정적인 서비스 운영을 보장하며, 실시간 데이터 동기화로 
                    언제든지 최신 정보를 확인할 수 있어 신뢰할 수 있는 주차 관리 서비스를 제공합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 px-6" aria-labelledby="faq-heading">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 id="faq-heading" className="text-4xl md:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  자주 묻는 질문
                </span>
              </h2>
              <p className="text-xl text-gray-300">
                고객들이 자주 묻는 질문들
              </p>
            </div>
            <div className="space-y-6">
              {[
                {
                  question: 'QR코드는 어떻게 생성하나요?',
                  answer: '차량번호판에 부착할 QR코드는 웹사이트에서 무료로 생성하실 수 있습니다. 간단히 차량번호와 연락처를 입력하면 즉시 QR코드가 생성됩니다.'
                },
                {
                  question: '개인정보는 안전하게 보호되나요?',
                  answer: '네, 모든 개인정보는 SSL 암호화로 보호되며, 개인정보보호법에 따라 안전하게 관리됩니다. 연락처 정보는 QR코드를 스캔한 사람에게만 공개됩니다.'
                },
                {
                  question: '야간에도 QR코드가 잘 보이나요?',
                  answer: '네, 야광 코팅이施된 QR코드로 제작되어 야간이나 어두운 곳에서도 선명하게 인식됩니다. 또한 야간 모드에서는 더욱 밝게 표시됩니다.'
                },
                {
                  question: '요금제는 언제든 변경할 수 있나요?',
                  answer: '네, 언제든 요금제를 업그레이드하거나 다운그레이드하실 수 있습니다. 변경사항은 다음 결제 주기부터 적용됩니다.'
                }
              ].map((faq, index) => (
                <div key={index} className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-blue-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                  <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
                    <button className="w-full text-left flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white pr-4">{faq.question}</h3>
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    </button>
                    <p className="text-gray-300 mt-4 leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="py-16 px-6" aria-labelledby="stats-heading">
          <div className="max-w-4xl mx-auto">
            <h2 id="stats-heading" className="sr-only">서비스 통계</h2>
            <div className="grid grid-cols-3 gap-8 text-center">
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-primary-600/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
                  <div className="text-4xl font-bold font-mono text-primary-400 mb-2">
                    10,000+
                  </div>
                  <div className="text-sm text-gray-300">활성 QR코드</div>
                </div>
              </div>
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-success-500/20 to-success-600/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
                  <div className="text-4xl font-bold font-mono text-success-400 mb-2">
                    24/7
                  </div>
                  <div className="text-sm text-gray-300">24시간 서비스</div>
                </div>
              </div>
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-info/20 to-blue-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
                  <div className="text-4xl font-bold font-mono text-info mb-2">
                    빠른
                  </div>
                  <div className="text-sm text-gray-300">원클릭 연락</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEO优化的页脚内容 */}
        <footer className="py-16 px-6 bg-slate-900">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-bold text-white mb-6">QR주차시스템 소개</h3>
            <div className="grid md:grid-cols-2 gap-8 text-left">
              <div>
                <h4 className="text-lg font-semibold text-primary-400 mb-3">서비스 특징</h4>
                <ul className="space-y-2 text-gray-300">
                  <li>• QR코드를 통한 차주 즉시 연락</li>
                  <li>• 주차장阻塞 문제 해결</li>
                  <li>• 상가 주차 관리 솔루션</li>
                  <li>• 야광 QR코드로 24시간 서비스</li>
                  <li>• 개인정보 보호 및 안전 관리</li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-primary-400 mb-3">활용 분야</h4>
                <ul className="space-y-2 text-gray-300">
                  <li>• 아파트 주차장 관리</li>
                  <li>• 오피스텔 주차 시스템</li>
                  <li>• 상가 앞 주차구역</li>
                  <li>• 개인 주차 공간 관리</li>
                  <li>• 긴급 주차 상황 대응</li>
                </ul>
              </div>
            </div>
            
            {/* SEO关键词优化文本 */}
            <div className="mt-12 p-6 bg-slate-800 rounded-lg">
              <h4 className="text-lg font-semibold text-white mb-4">QR주차시스템 - 스마트 주차 솔루션</h4>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  QR주차시스템은 혁신적인 QR코드 기술을 활용한 주차 관리 솔루션입니다. 차량번호판에 부착된 QR코드를 통해 
                  주차장阻塞, 상가 주차, 주차장 관리 등 다양한 상황에서 차주와 즉시 연락할 수 있습니다. 
                  개인정보 보호, 24시간 서비스, 야광 QR코드 등 안전하고 편리한 주차 관리 시스템을 제공합니다.
                </p>
                <p>
                  특히 아파트 주차장, 오피스텔 주차장, 상가 앞 주차구역에서 발생하는 주차 갈등을 예방하고, 
                  신속한 차량 이동으로 주차 효율성을 크게 향상시킬 수 있습니다. QR코드를 스캔하는 것만으로도 
                  전화나 메시지로 차주에게 즉시 연락할 수 있어, 전통적인 주차 관리 방식의 한계를 극복한 
                  스마트한 주차 솔루션입니다.
                </p>
                <p>
                  기본 요금제는 무료로 제공되어 개인 사용자도 쉽게 이용하실 수 있으며, 프리미엄 요금제는 
                  비즈니스 사용자를 위한 고급 기능과 통계, 우선 고객 지원을 제공합니다. 엔터프라이즈 요금제는 
                  대규모 조직을 위한 맞춤형 솔루션으로 API 연동, 전담 고객 관리, 맞춤형 개발 서비스를 제공합니다.
                </p>
              </div>
            </div>
            
            {/* 추가 SEO 콘텐츠 */}
            <div className="mt-8 p-6 bg-slate-800 rounded-lg">
              <h4 className="text-lg font-semibold text-white mb-4">주차장 관리의 새로운 패러다임</h4>
              <div className="text-gray-300 leading-relaxed space-y-3">
                <p>
                  <strong>QR코드 주차:</strong> 차량번호판에 부착된 QR코드를 통해 차주에게 즉시 연락할 수 있는 혁신적인 주차 관리 시스템입니다.
                </p>
                <p>
                  <strong>차량번호판 인식:</strong> 차량번호판에 부착된 QR코드를 인식하여 차주의 연락처 정보를 안전하게 관리합니다.
                </p>
                <p>
                  <strong>주차 연락 서비스:</strong> 주차장阻塞, 상가 주차, 주차장 관리 등 다양한 상황에서 차주와 효과적으로 소통할 수 있습니다.
                </p>
                <p>
                  <strong>차주 연락:</strong> 전화, SMS, 메시지 등 다양한 방식으로 차주에게 신속하고 정확한 연락을 취할 수 있습니다.
                </p>
                <p>
                  <strong>QR주차 솔루션:</strong> 스마트한 주차 관리로 주차 갈등을 예방하고 효율적인 주차 환경을 조성하는 종합 솔루션입니다.
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
}
