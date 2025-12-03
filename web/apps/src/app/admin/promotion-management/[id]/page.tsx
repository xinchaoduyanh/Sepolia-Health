'use client'

import { PromotionCreateForm } from '@/components/PromotionCreateForm'
import { use } from 'react'

export default function EditPromotionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const promotionId = parseInt(id, 10)

    return <PromotionCreateForm promotionId={promotionId} />
}
