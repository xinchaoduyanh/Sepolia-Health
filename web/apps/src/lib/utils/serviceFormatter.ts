/**
 * Format service name with conditions (targetGender, minAge, maxAge)
 * Example outputs:
 * - "Khám Nam khoa cơ bản (Chỉ dành cho nam giới)"
 * - "Khám Nhi nội tổng hợp (Trẻ em dưới 15 tuổi)"
 * - "Khám sức khỏe tiền mãn kinh (Nữ giới trên 40 tuổi)"
 */

interface ServiceWithConditions {
  name: string
  targetGender?: string | null
  minAge?: number | null
  maxAge?: number | null
}

export function formatServiceNameWithConditions(service: ServiceWithConditions): string {
  const conditions: string[] = []

  // Gender condition
  if (service.targetGender) {
    if (service.targetGender === 'MALE') {
      conditions.push('Nam giới')
    } else if (service.targetGender === 'FEMALE') {
      conditions.push('Nữ giới')
    }
  }

  // Age condition
  const hasMinAge = service.minAge !== null && service.minAge !== undefined
  const hasMaxAge = service.maxAge !== null && service.maxAge !== undefined

  if (hasMinAge && hasMaxAge) {
    conditions.push(`${service.minAge}-${service.maxAge} tuổi`)
  } else if (hasMinAge) {
    conditions.push(`Trên ${service.minAge} tuổi`)
  } else if (hasMaxAge) {
    conditions.push(`Dưới ${service.maxAge} tuổi`)
  }

  // Build final name
  if (conditions.length === 0) {
    return service.name
  }

  return `${service.name} (${conditions.join(', ')})`
}

/**
 * Get short condition text for service (for compact display)
 * Returns only the condition part without service name
 */
export function getServiceConditionText(service: ServiceWithConditions): string | null {
  const conditions: string[] = []

  if (service.targetGender) {
    if (service.targetGender === 'MALE') {
      conditions.push('Nam giới')
    } else if (service.targetGender === 'FEMALE') {
      conditions.push('Nữ giới')
    }
  }

  const hasMinAge = service.minAge !== null && service.minAge !== undefined
  const hasMaxAge = service.maxAge !== null && service.maxAge !== undefined

  if (hasMinAge && hasMaxAge) {
    conditions.push(`${service.minAge}-${service.maxAge} tuổi`)
  } else if (hasMinAge) {
    conditions.push(`Trên ${service.minAge} tuổi`)
  } else if (hasMaxAge) {
    conditions.push(`Dưới ${service.maxAge} tuổi`)
  }

  return conditions.length > 0 ? conditions.join(', ') : null
}
