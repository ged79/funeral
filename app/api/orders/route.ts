import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

function generateOrderNumber(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `FNR-${dateStr}-${random}`
}

function parsePrice(priceString: string): number {
  if (!priceString) return 0
  const cleaned = priceString.replace(/[₩원,\s]/g, '').replace(/[^0-9]/g, '')
  return parseInt(cleaned) || 0
}

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json()
    
    const deceasedName = orderData.deceased_name || '고인'
    const mournerInfo = orderData.recipient_name 
      ? `${orderData.recipient_relation} ${orderData.recipient_name}` 
      : '상주'
    
    const price = parsePrice(orderData.product_price)
    
    const { data, error } = await supabase
      .from('customer_orders')
      .insert({
        order_number: generateOrderNumber(),
        order_source: 'funeral',
        
        customer_name: orderData.sender_name,
        customer_phone: orderData.customer_phone_type === '직접입력'
          ? orderData.customer_phone
          : orderData.sender_phone,
        
        recipient_name: `故 ${deceasedName}`,
        recipient_phone: orderData.sender_phone,
        recipient_address: {
          detail: orderData.delivery_address,
          sido: '충청북도',
          sigungu: '영동군', 
          dong: '영동읍'
        },
        
        product_name: orderData.product_name,
        original_price: price,
        total_amount: price,
        mapped_category: '근조화환',
        mapped_price: price,
        quantity: 1,
        
        delivery_date: new Date().toISOString().split('T')[0],
        delivery_time: '오전',
        ribbon_text: [orderData.ribbon_message],
        special_instructions: orderData.ribbon_message,
        
        funeral_data: {
          deceased_name: deceasedName,
          mourner_info: mournerInfo,
          sender_name: orderData.sender_name,
          sender_phone: orderData.sender_phone,
          ribbon_message: orderData.ribbon_message,
          delivery_address: orderData.delivery_address,
          funeral_hall: '영동병원장례식장',
          payment_method: orderData.payment_method
        },
        
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, order: data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
