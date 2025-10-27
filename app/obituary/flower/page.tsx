'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { ArrowLeft, Flower, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Product {
  id: string
  name: string
  price: number
  image: string
  description: string
  subcategory: string
}

export default function FuneralFlowerPage() {
  const [products, setProducts] = useState<Record<string, Product[]>>({})
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('category_1', ['장례식', '장례'])
        .eq('is_active', true)
        .order('category_2')
        .order('sort_order')

      if (error) throw error

      const grouped: Record<string, Product[]> = {}
      
      data?.forEach(product => {
        const subcategory = product.category_2 || '기타'
        if (!grouped[subcategory]) {
          grouped[subcategory] = []
        }
        grouped[subcategory].push({
          id: product.id,
          name: product.display_name,
          price: product.customer_price || product.price,
          image: product.image_url || '/placeholder.jpg',
          description: product.description || '',
          subcategory: product.category_2
        })
      })
      
      setProducts(grouped)
    } catch (error) {
      console.error('Failed to load products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOrderClick = (productId: string) => {
    // Get obituary data from sessionStorage
    const obituaryData = sessionStorage.getItem('obituaryPreview')
    const parsed = obituaryData ? JSON.parse(obituaryData) : {}
    const room = parsed?.room || '빈소'
    const deceasedName = parsed?.deceasedName || ''
    
    // Use environment variable for homepage URL (defaults to localhost for development)
    const homepageUrl = process.env.NEXT_PUBLIC_HOMEPAGE_URL || 'http://localhost:3000'
    
    // Redirect to homepage with funeral context and auto-open order modal
    window.location.href = `${homepageUrl}/order?id=${productId}&autoOrder=true&funeral=true&room=${encodeURIComponent(room)}&deceased=${encodeURIComponent(deceasedName)}`
  }

  const categoryOrder = Object.keys(products).sort((a, b) => {
    if (a.includes('화환') && !b.includes('화환')) return -1
    if (!a.includes('화환') && b.includes('화환')) return 1
    return (products[b]?.length || 0) - (products[a]?.length || 0)
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8 pb-16">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-lg h-64"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#2c3e50] border-b-2 border-slate-300 shadow-md sticky top-0 z-50 overflow-hidden py-2">
        <div className="max-w-7xl mx-auto cursor-pointer" onClick={() => router.push('/obituary/modern')}>
          <img 
            src="/header.png" 
            alt="영동병원장례식장" 
            className="w-full h-auto transform scale-150"
            style={{ transformOrigin: 'center' }}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 pb-16">
        {categoryOrder.length === 0 ? (
          <div className="text-center py-16">
            <Flower className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">상품을 준비 중입니다</p>
          </div>
        ) : (
          categoryOrder.map((subCategory) => (
            <div key={subCategory} className="mb-12">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{subCategory}</h3>
                <p className="text-gray-600 text-sm">
                  {products[subCategory]?.length || 0}개 상품
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products[subCategory]?.map((product) => (
                  <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="aspect-square bg-gray-100 relative">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h4>
                      <p className="text-purple-700 font-bold text-lg mb-3">
                        {product.price.toLocaleString()}원
                      </p>
                      <button
                        onClick={() => handleOrderClick(product.id)}
                        className="w-full bg-slate-700 hover:bg-slate-800 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        주문하기
                        <ExternalLink size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-slate-800 text-white py-2 border-t-2 border-slate-300 shadow-md">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm">
            영동병원장례식장 | 충청북도 영동군 영동읍 대학로 106 | ☎ 043-743-4493
          </p>
        </div>
      </div>
    </div>
  )
}
