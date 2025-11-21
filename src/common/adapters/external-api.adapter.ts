/**
 * Adaptador base para APIs externas
 * Este adaptador estandariza formatos heterogéneos de proveedores externos
 * antes de ser procesados por el sistema
 */
export interface ExternalActivity {
  id: string;
  name: string;
  description: string;
  type: string;
  price: number;
  location: string;
  duration: number;
  available: boolean;
}

export interface ExternalFlight {
  id: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  price: number;
  airline: string;
  available: boolean;
}

export interface ExternalHotel {
  id: string;
  name: string;
  location: string;
  checkIn: string;
  checkOut: string;
  price: number;
  rating: number;
  available: boolean;
}

/**
 * Adaptador genérico para transformar datos de APIs externas
 */
export class ExternalApiAdapter {
  /**
   * Transforma actividad de proveedor externo a formato interno
   */
  static transformActivity(
    externalData: any,
    provider: string,
  ): ExternalActivity {
    // Cada proveedor puede tener un formato diferente
    // Este método estandariza el formato
    switch (provider) {
      case 'provider-a':
        return {
          id: externalData.external_id,
          name: externalData.title,
          description: externalData.desc,
          type: this.mapActivityType(externalData.category),
          price: externalData.cost,
          location: externalData.address,
          duration: externalData.duration_minutes,
          available: externalData.is_available,
        };
      case 'provider-b':
        return {
          id: externalData.id,
          name: externalData.name,
          description: externalData.description,
          type: this.mapActivityType(externalData.type),
          price: externalData.pricing.amount,
          location: externalData.location.address,
          duration: externalData.duration,
          available: externalData.availability.status === 'available',
        };
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Mapea tipos de actividad de diferentes proveedores a tipos internos
   */
  private static mapActivityType(externalType: string): string {
    const typeMap: Record<string, string> = {
      'food': 'GASTRONOMY',
      'restaurant': 'GASTRONOMY',
      'adventure': 'ADVENTURE',
      'sports': 'ADVENTURE',
      'culture': 'CULTURE',
      'museum': 'CULTURE',
      'nightlife': 'NIGHTLIFE',
      'bar': 'NIGHTLIFE',
      'spa': 'RELAX',
      'wellness': 'RELAX',
    };

    return typeMap[externalType.toLowerCase()] || 'CULTURE';
  }

  /**
   * Valida que los datos del proveedor cumplan el contrato esperado
   * Acepta diferentes formatos de proveedores
   */
  static validateActivityContract(data: any): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Para Provider A
    if ('external_id' in data) {
      const requiredFields = ['external_id', 'title', 'cost', 'is_available'];
      return requiredFields.every((field) => field in data && data[field] != null);
    }

    // Para Provider B
    if ('pricing' in data && 'availability' in data) {
      const requiredFields = ['id', 'name', 'pricing', 'availability'];
      return requiredFields.every((field) => field in data && data[field] != null);
    }

    // Formato estándar
    const requiredFields = ['id', 'name', 'price', 'available'];
    return requiredFields.every((field) => field in data && data[field] != null);
  }
}

