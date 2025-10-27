'use client'

export const dynamic = 'force-dynamic'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Phone } from 'lucide-react'

interface FlowerProduct {
  id: string
  name: string
  price: string
  originalPrice?: string
  discount?: string
  image: string
  description: string
}

const flowerProducts: FlowerProduct[] = [
  {
    id: '80',
    name: '3단화환 기본형',
    price: '81,000원',
    image: '/80송이 근조화환.jpg',
    description: ''
  },
  {
    id: '100', 
    name: '4단 참고급화환',
    price: '95,000원',
    image: '/100송이 근조화환.jpg', 
    description: ''
  }
]

function FlowerContent() {
  const [selectedProduct, setSelectedProduct] = useState<FlowerProduct | null>(null)
  const [orderData, setOrderData] = useState({
    sender_name: '',
    sender_phone: '',
    recipient_relation: '상주',
    recipient_name: '',
    ribbon_message: '삼가 故人의 冥福을 빕니다',
    ribbon_sender_type: '주문자와 동일',
    ribbon_sender_custom: '',
    customer_name_type: '주문자와 동일',
    customer_name: '',
    customer_phone_type: '주문자와 동일',
    customer_phone: '',
    payment_method: 'card'
  })
  const [announcementData, setAnnouncementData] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const searchParams = useSearchParams()
  const roomId = searchParams.get('room')

  useEffect(() => {
    const storedData = sessionStorage.getItem('obituaryData')
    if (storedData) {
      const data = JSON.parse(storedData)
      setAnnouncementData(data)
      
      if (data.family && data.family.length > 0) {
        const chiefMourner = data.family.find((m: any) => m.relation === '상주')
        if (chiefMourner) {
          setOrderData(prev => ({
            ...prev,
            recipient_name: chiefMourner.name,
            recipient_relation: chiefMourner.relation
          }))
        }
      }
    }
  }, [roomId])

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return
    
    setIsSubmitting(true)
    
    try {
      const orders = JSON.parse(localStorage.getItem('flower_orders') || '[]')
      const newOrder = {
        id: Date.now().toString(),
        room_id: roomId,
        product_name: selectedProduct.name,
        product_price: selectedProduct.price,
        sender_name: orderData.sender_name,
        sender_phone: orderData.sender_phone,
        recipient_relation: orderData.recipient_relation,
        recipient_name: orderData.recipient_name,
        ribbon_message: orderData.ribbon_message,
        ribbon_sender: orderData.ribbon_sender_type === '직접입력' 
          ? orderData.ribbon_sender_custom 
          : orderData.sender_name,
        customer_name: orderData.customer_name_type === '직접입력'
          ? orderData.customer_name
          : orderData.sender_name,
        customer_phone: orderData.customer_phone_type === '직접입력'
          ? orderData.customer_phone
          : orderData.sender_phone,
        payment_method: orderData.payment_method,
        delivery_address: `영동병원장례식장 ${announcementData?.schedule?.room || '특실 5빈소 (5층)'}`,
        created_at: new Date().toISOString(),
        status: 'pending'
      }
      
      orders.push(newOrder)
      localStorage.setItem('flower_orders', JSON.stringify(orders))
      
      alert('주문이 성공적으로 접수되었습니다!')
      setSelectedProduct(null)
      setOrderData({
        sender_name: '',
        sender_phone: '',
        recipient_relation: '상주',
        recipient_name: orderData.recipient_name,
        ribbon_message: '삼가 故人의 冥福을 빕니다',
        ribbon_sender_type: '주문자와 동일',
        ribbon_sender_custom: '',
        customer_name_type: '주문자와 동일',
        customer_name: '',
        customer_phone_type: '주문자와 동일',
        customer_phone: '',
        payment_method: 'card'
      })
    } catch (error) {
      alert('주문 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-slate-700 text-white text-center py-4">
        <div className="text-xs mb-1 text-slate-300">의료법인 조윤의료재단</div>
        <h1 className="text-lg font-semibold">영동병원장례식장</h1>
      </div>
      
      <div className="max-w-2xl mx-auto bg-white min-h-screen">
        <div className="p-6 h-screen flex flex-col">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">근조화환</h2>
            <p className="text-gray-600">고인께 마지막 인사를 전해드립니다</p>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto">
            {flowerProducts.map((product) => (
              <div key={product.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm flex">
                <div className="w-1/2 h-48 bg-gray-100 relative overflow-hidden">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '';
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = '<div class="flex items-center justify-center h-full text-6xl">🌸</div>';
                    }}
                  />
                </div>
                
                <div className="w-1/2 p-4 flex flex-col justify-center">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{product.name}</h3>
                  <span className="text-xl font-bold text-gray-900 block mb-3">{product.price}</span>
                  <button
                    onClick={() => setSelectedProduct(product)}
                    className="bg-slate-900 text-white px-4 py-2 rounded hover:bg-slate-800 transition-colors text-sm"
                  >
                    주문하기
                  </button>
                </div>
              </div>
            ))}

            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">더 많은 근조화환이 필요하신가요?</h3>
              <p className="text-gray-600 text-sm mb-4">다양한 가격대와 디자인의 근조화환을 확인하세요</p>
              <Link 
                href="https://sage-gecko-0b9542.netlify.app/category/funeral" 
                className="bg-slate-900 text-white px-6 py-3 rounded hover:bg-slate-800 transition-colors inline-block"
              >
                전체 상품 보기
              </Link>
            </div>
          </div>

          <div className="mt-4 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">영동병원장례식장</h4>
                <p className="text-sm text-gray-600">충청북도 영동군 영동읍 대학로 106</p>
                <div className="flex items-center justify-center mt-2">
                  <Phone className="w-4 h-4 mr-2 text-gray-500" />
                  <a href="tel:043-740-1004" className="text-blue-600 font-medium">
                    043-740-1004
                  </a>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                <p>&copy; 2024 영동병원장례식장. All rights reserved.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md h-[90vh] overflow-y-auto">
            <div className="p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">영동병원장례식장</h3>
              
              <form onSubmit={submitOrder} className="space-y-3">
                <div className="bg-gray-50 p-3 rounded-lg border">
                  <h4 className="font-medium text-gray-900 mb-2">주문자</h4>
                  <div className="space-y-2">
                    <input 
                      type="text" 
                      required
                      value={orderData.sender_name}
                      onChange={(e) => setOrderData({...orderData, sender_name: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded text-sm" 
                      placeholder="이름을 입력해주세요" 
                    />
                    <input 
                      type="tel" 
                      required
                      value={orderData.sender_phone}
                      onChange={(e) => setOrderData({...orderData, sender_phone: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded text-sm" 
                      placeholder="예)010-0000-0000" 
                    />
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg border">
                  <h4 className="font-medium text-gray-900 mb-2">배송지/상품정보</h4>
                  
                  <div className="bg-white p-2 rounded mb-3 text-sm border">
                    <div className="font-medium text-gray-900">
                      {announcementData?.schedule?.room || '특실 5빈소'} 
                      ({announcementData?.schedule?.floor || '5층'})
                    </div>
                    <div className="text-xs text-gray-600 mt-1">충청북도 영동군 영동읍 대학로 106 (설계리, 영동병원)</div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-xs text-gray-700 mb-1">받으시는 분</label>
                    <div className="grid grid-cols-2 gap-1">
                      <select
                        value={orderData.recipient_relation}
                        onChange={(e) => {
                          const relation = e.target.value;
                          const member = announcementData?.family?.find((m: any) => m.relation === relation);
                          setOrderData({
                            ...orderData, 
                            recipient_relation: relation,
                            recipient_name: member?.name || ''
                          });
                        }}
                        className="p-2 border border-gray-300 rounded text-sm"
                      >
                        {announcementData?.family?.map((member: any, idx: number) => (
                          <option key={idx} value={member.relation}>{member.relation}</option>
                        )) || (
                          <>
                            <option value="상주">상주</option>
                            <option value="장남">장남</option>
                            <option value="차남">차남</option>
                            <option value="장녀">장녀</option>
                          </>
                        )}
                      </select>
                      <input 
                        type="text" 
                        required
                        value={orderData.recipient_name}
                        onChange={(e) => setOrderData({...orderData, recipient_name: e.target.value})}
                        className="p-2 border border-gray-300 rounded text-sm" 
                        placeholder="이름" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">보내는 분</label>
                      <select 
                        value={orderData.ribbon_sender_type}
                        onChange={(e) => setOrderData({...orderData, ribbon_sender_type: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded text-sm"
                      >
                        <option>주문자와 동일</option>
                        <option>직접입력</option>
                      </select>
                      {orderData.ribbon_sender_type === '직접입력' && (
                        <input 
                          type="text" 
                          value={orderData.ribbon_sender_custom}
                          onChange={(e) => setOrderData({...orderData, ribbon_sender_custom: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded text-sm mt-1" 
                          placeholder="보내는 분 이름을 입력해주세요" 
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">리본 문구</label>
                      <select 
                        value={orderData.ribbon_message}
                        onChange={(e) => setOrderData({...orderData, ribbon_message: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded text-sm"
                      >
                        <option>삼가 故人의 冥福을 빕니다</option>
                        <option>깊은 애도를 표합니다</option>
                        <option>그리운 마음을 전합니다</option>
                        <option>편안히 잠드소서</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="border-t pt-2">
                      <div className="flex justify-between text-lg font-bold text-blue-600">
                        <span>총 결제금액</span>
                        <span>{selectedProduct.price}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg border">
                  <h4 className="font-medium text-gray-900 mb-2">결제</h4>
                  
                  <div className="mb-3">
                    <label className="block text-xs text-gray-700 mb-1">결제방법</label>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setOrderData({...orderData, payment_method: 'card'})}
                        className={`flex-1 py-2 border rounded text-sm ${
                          orderData.payment_method === 'card' 
                            ? 'border-blue-500 bg-blue-50 text-blue-700' 
                            : 'border-gray-300 text-gray-700'
                        }`}
                      >
                        신용카드
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrderData({...orderData, payment_method: 'virtual'})}
                        className={`flex-1 py-2 border rounded text-sm ${
                          orderData.payment_method === 'virtual' 
                            ? 'border-blue-500 bg-blue-50 text-blue-700' 
                            : 'border-gray-300 text-gray-700'
                        }`}
                      >
                        가상계좌
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">이름</label>
                      <select 
                        value={orderData.customer_phone_type}
                        onChange={(e) => setOrderData({...orderData, customer_phone_type: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded mb-1 text-sm"
                      >
                        <option>주문자와 동일</option>
                        <option>직접입력</option>
                      </select>
                      {orderData.customer_phone_type === '직접입력' && (
                        <input 
                          type="tel" 
                          required
                          value={orderData.customer_phone}
                          onChange={(e) => setOrderData({...orderData, customer_phone: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded text-sm" 
                          placeholder="예) 01012345678" 
                        />
                      )}
                      {orderData.customer_phone_type === '주문자와 동일' && (
                        <div className="w-full p-2 border border-gray-300 rounded bg-white text-gray-600 text-sm">
                          {orderData.sender_phone || '주문자 전화번호 입력 후 자동 입력됩니다'}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">* 위 핸드폰번호로 주문정보와 배송확료 사진을 보내드립니다.</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="flex items-center text-sm">
                    <input type="checkbox" className="mr-2" required />
                    <span>전체 동의</span>
                  </label>
                  <label className="flex items-center justify-between text-xs">
                    <div className="flex items-center">
                      <input type="checkbox" className="mr-1" required />
                      <span>개인정보 제3자 제공 동의(결제대행사)(필수)</span>
                    </div>
                    <button type="button" className="text-blue-500 text-xs">[보기]</button>
                  </label>
                  <label className="flex items-center justify-between text-xs">
                    <div className="flex items-center">
                      <input type="checkbox" className="mr-1" />
                      <span>혜택 알림 및 신규 상품 홍보 목적(선택)</span>
                    </div>
                    <button type="button" className="text-blue-500 text-xs">[보기]</button>
                  </label>
                </div>
                
                <div className="pt-3 border-t">
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setSelectedProduct(null)}
                      className="flex-1 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm"
                      disabled={isSubmitting}
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold disabled:opacity-50 text-sm"
                    >
                      🛒 {isSubmitting ? '주문 중...' : '주문결제'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function FlowerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <FlowerContent />
    </Suspense>
  )
}
