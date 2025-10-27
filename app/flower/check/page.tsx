'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, Package, Clock, CheckCircle } from 'lucide-react'

export default function FlowerCheckPage() {
  const [phone, setPhone] = useState('')
  const [orders, setOrders] = useState<any[]>([])
  const [searched, setSearched] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    // localStorage에서 주문 조회
    const allOrders = JSON.parse(localStorage.getItem('flower_orders') || '[]')
    const myOrders = allOrders.filter((order: any) => 
      order.sender_phone.replace(/-/g, '') === phone.replace(/-/g, '')
    )
    
    setOrders(myOrders)
    setSearched(true)
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1 text-amber-600">
            <Clock size={14} />
            <span className="text-xs">접수완료</span>
          </span>
        )
      case 'completed':
        return (
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle size={14} />
            <span className="text-xs">배송완료</span>
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-slate-700 text-white">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/flower" className="text-white">
            <ArrowLeft size={24} />
          </Link>
          <div className="text-center flex-1">
            <h1 className="text-lg font-semibold">주문 조회</h1>
          </div>
          <div className="w-6"></div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto bg-white min-h-screen">
        <div className="p-6">
          {/* 검색 폼 */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">화환 주문 조회</h2>
            <p className="text-gray-600">주문 시 입력하신 연락처로 조회해주세요</p>
          </div>

          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex gap-2">
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 p-3 border border-gray-300 rounded-lg" 
                placeholder="연락처 입력 (예: 010-0000-0000)"
                required
              />
              <button
                type="submit"
                className="bg-slate-800 text-white px-6 py-3 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2"
              >
                <Search size={20} />
                조회
              </button>
            </div>
          </form>

          {/* 검색 결과 */}
          {searched && (
            <div>
              {orders.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 mb-4">
                    주문 내역 ({orders.length}건)
                  </h3>
                  {orders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-gray-900">{order.product_name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            故 {order.deceased_name}님께
                          </p>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex">
                          <span className="text-gray-500 w-24">주문번호</span>
                          <span className="text-gray-900">{order.id}</span>
                        </div>
                        <div className="flex">
                          <span className="text-gray-500 w-24">주문일시</span>
                          <span className="text-gray-900">
                            {new Date(order.created_at).toLocaleString('ko-KR')}
                          </span>
                        </div>
                        <div className="flex">
                          <span className="text-gray-500 w-24">리본문구</span>
                          <span className="text-gray-900">{order.ribbon_message}</span>
                        </div>
                        <div className="flex">
                          <span className="text-gray-500 w-24">보내는분</span>
                          <span className="text-gray-900">{order.ribbon_sender}</span>
                        </div>
                        <div className="flex">
                          <span className="text-gray-500 w-24">결제금액</span>
                          <span className="font-bold text-blue-600">{order.product_price}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">주문 내역이 없습니다</p>
                  <p className="text-sm text-gray-400 mt-2">
                    입력하신 번호를 다시 확인해주세요
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 안내사항 */}
          {!searched && (
            <div className="bg-amber-50 rounded-lg p-4">
              <h4 className="font-bold text-gray-900 mb-2">📌 안내사항</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• 주문 시 입력한 연락처로 조회 가능합니다</li>
                <li>• 화환은 주문 후 2시간 이내 배송됩니다</li>
                <li>• 배송 완료 시 문자로 안내드립니다</li>
                <li>• 문의사항: 043-740-1004</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
