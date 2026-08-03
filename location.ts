// Calculate Haversine distance in kilometers between two GPS coordinates
export function calcularDistanciaKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return Math.round(d * 10) / 10;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Interface for GPS Location Result
export interface LocalizacaoGPS {
  latitude: number;
  longitude: number;
  cidade: string;
  bairro: string;
  enderecoCompleto?: string;
  preciso: boolean;
}

/**
 * Reverse geocodes coordinates to city & neighborhood using Nominatim
 */
export async function reverseGeocode(lat: number, lon: number): Promise<{ cidade: string; bairro: string; endereco?: string }> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
      { headers: { 'User-Agent': 'PrecoJustoApp/1.0' } }
    );
    if (res.ok) {
      const data = await res.json();
      const address = data.address || {};
      const cidade =
        address.city ||
        address.town ||
        address.municipality ||
        address.village ||
        'Araraquara';
      const bairro =
        address.suburb ||
        address.neighbourhood ||
        address.quarter ||
        address.residential ||
        address.city_district ||
        'Centro';
      return {
        cidade,
        bairro,
        endereco: data.display_name,
      };
    }
  } catch (err) {
    console.warn('Reverse geocode warning:', err);
  }
  return { cidade: 'Araraquara', bairro: 'Centro' };
}

/**
 * Get high accuracy browser GPS location and reverse geocode it
 */
export function obterLocalizacaoGPS(): Promise<LocalizacaoGPS> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        latitude: -21.7946,
        longitude: -48.1766,
        cidade: 'Araraquara',
        bairro: 'Centro',
        preciso: false,
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const geoInfo = await reverseGeocode(lat, lon);

        resolve({
          latitude: lat,
          longitude: lon,
          cidade: geoInfo.cidade,
          bairro: geoInfo.bairro,
          enderecoCompleto: geoInfo.endereco,
          preciso: true,
        });
      },
      (err) => {
        console.warn('GPS error/permission denied:', err);
        resolve({
          latitude: -21.7946,
          longitude: -48.1766,
          cidade: 'Araraquara',
          bairro: 'Centro',
          preciso: false,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  });
}

// Format Brazilian Currency
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

// Calculate Price Level Status (Abaixo, Na Média, Acima)
export function getStatusPreco(
  precoPago: number,
  precoMedio: number
): {
  status: 'abaixo' | 'na_media' | 'acima';
  porcentagem: number;
  rotulo: string;
  corTexto: string;
  corBg: string;
  corBorda: string;
  iconeNome: string;
} {
  if (precoMedio <= 0) {
    return {
      status: 'na_media',
      porcentagem: 0,
      rotulo: 'Preço na Média',
      corTexto: 'text-white',
      corBg: 'bg-black',
      corBorda: 'border-slate-800',
      iconeNome: 'Minus',
    };
  }

  const dif = ((precoPago - precoMedio) / precoMedio) * 100;
  const difAbs = Math.abs(Math.round(dif * 10) / 10);

  if (dif <= -3) {
    // 3% or more lower
    return {
      status: 'abaixo',
      porcentagem: difAbs,
      rotulo: `Preço Justo! ${difAbs}% abaixo da média`,
      corTexto: 'text-black font-extrabold',
      corBg: 'bg-white',
      corBorda: 'border-white',
      iconeNome: 'TrendingDown',
    };
  } else if (dif >= 3) {
    // 3% or more higher
    return {
      status: 'acima',
      porcentagem: difAbs,
      rotulo: `Acima da Média (+${difAbs}%)`,
      corTexto: 'text-white font-bold',
      corBg: 'bg-slate-900',
      corBorda: 'border-slate-700',
      iconeNome: 'TrendingUp',
    };
  } else {
    // Within 3% of average
    return {
      status: 'na_media',
      porcentagem: difAbs,
      rotulo: 'Preço na Média Regional',
      corTexto: 'text-white font-bold',
      corBg: 'bg-slate-900',
      corBorda: 'border-slate-800',
      iconeNome: 'CheckCircle2',
    };
  }
}

