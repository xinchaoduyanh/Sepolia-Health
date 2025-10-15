// Relationship Translator Utils
// Maps English relationship values to Vietnamese display text

export type Relationship =
  | 'SELF'
  | 'SPOUSE'
  | 'CHILD'
  | 'PARENT'
  | 'SIBLING'
  | 'RELATIVE'
  | 'FRIEND'
  | 'OTHER';

/**
 * Translate relationship from English to Vietnamese
 * @param relationship - English relationship value
 * @returns Vietnamese display text
 */
export const translateRelationship = (relationship: Relationship | string | undefined): string => {
  if (!relationship) return '';

  const relationshipMap: { [key: string]: string } = {
    SELF: 'Bản thân',
    SPOUSE: 'Vợ/Chồng',
    CHILD: 'Con',
    PARENT: 'Bố/Mẹ',
    SIBLING: 'Anh/Chị/Em',
    RELATIVE: 'Họ hàng',
    FRIEND: 'Bạn bè',
    OTHER: 'Khác',
  };

  return relationshipMap[relationship] || relationship;
};

/**
 * Get relationship label for display in UI
 * @param relationship - English relationship value
 * @returns Formatted Vietnamese text for UI display
 */
export const getRelationshipLabel = (relationship: Relationship | string | undefined): string => {
  const translated = translateRelationship(relationship);
  return translated || 'Bản thân'; // Default fallback
};
