// Geolocalização com fallback (coordenadas próximas a Suape se indisponível/negada).
export function geoThen(cb) {
  const fallback = () => cb(-8.3956 + (Math.random() - 0.5) * 0.01, -34.9712 + (Math.random() - 0.5) * 0.01);
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (p) => cb(p.coords.latitude, p.coords.longitude),
      fallback,
      { timeout: 4000 },
    );
  } else {
    fallback();
  }
}
