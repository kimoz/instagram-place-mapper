import { useState, useEffect } from 'react'
import './index.css'

interface PlaceData {
  id: string;
  restaurant_name: string;
  region: string;
  country: string;
  insta_summary: string;
  map_data: {
    address: string;
    category: string;
    rating_info: string;
    source: string;
    lat: number;
    lng: number;
  };
}

function App() {
  const [region, setRegion] = useState('성수동')
  const [loading, setLoading] = useState(false)
  const [places, setPlaces] = useState<PlaceData[]>([])
  const [selectedPlace, setSelectedPlace] = useState<PlaceData | null>(null)
  
  // 지도의 중심점 계산 (가상)
  const mapCenter = places.length > 0 
    ? { lat: places[0].map_data.lat, lng: places[0].map_data.lng } 
    : { lat: 37.542, lng: 127.056 }; // 기본 성수동

  const fetchPlaces = async (searchRegion: string) => {
    const trimmed = searchRegion.trim();
    if (!trimmed) return;
    setLoading(true);
    setSelectedPlace(null);
    setPlaces([]);

    const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
    try {
      const res = await fetch(`${apiBase}/api/places/search?region=${encodeURIComponent(trimmed)}`);
      if (!res.ok) {
        throw new Error(`서버 오류: ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        setPlaces(data.data);
        if (data.data.length === 0) {
          alert('해당 지역의 데이터가 없습니다. (테스트 가능: 성수동, 도톤보리)');
        }
      }
    } catch (e) {
      console.error(e);
      alert('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  // 초기 로드 시 성수동 검색
  useEffect(() => {
    fetchPlaces('성수동');
  }, [])

  return (
    <div className="app-container">
      
      {/* Search Bar Overlay */}
      <div className="search-container">
        <div className="search-box">
          <input 
            className="search-input"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchPlaces(region)}
            placeholder="지역명을 검색하세요 (예: 연남동)"
          />
          <button className="search-btn" onClick={() => fetchPlaces(region)}>
            🔍
          </button>
        </div>
        <div className="tags">
          <div className="tag" onClick={() => {setRegion('성수동'); fetchPlaces('성수동');}}>#성수동</div>
          <div className="tag" onClick={() => {setRegion('도톤보리'); fetchPlaces('도톤보리');}}>#오사카_도톤보리</div>
          <div className="tag" onClick={() => alert('해당 지역은 아직 수집되지 않았습니다.')}>#압구정로데오</div>
        </div>
      </div>

      {loading && <div className="loading-overlay">가장 핫한 장소들을 찾는 중... ✨</div>}

      {/* Mock Map Area */}
      <div className="map-container" onClick={() => setSelectedPlace(null)}>
        {/* 가상의 지도 이미지 */}
        <div style={{
          width: '100%', height: '100%',
          background: import.meta.env.VITE_MAPS_API_KEY
            ? `url('https://maps.googleapis.com/maps/api/staticmap?center=${mapCenter.lat},${mapCenter.lng}&zoom=16&size=800x1200&key=${import.meta.env.VITE_MAPS_API_KEY}')`
            : 'none',
          backgroundColor: '#e5e7eb',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transition: 'background 0.5s ease'
        }} />

        {/* 핀 렌더링 (단순 화면 중심부 상대 위치 계산) */}
        {places.map((place, index) => {
          // 중심 좌표 대비 가상의 오프셋 계산 (실제 지도 라이브러리가 아니므로 임의로 흩뿌림)
          const isSelected = selectedPlace?.id === place.id;
          
          // 가상의 위치 (데모용 고정값 배치)
          const topPos = 40 + (index * 15) + (index % 2 === 0 ? -10 : 10);
          const leftPos = 30 + (index * 20) + (index % 2 === 0 ? 10 : -10);

          return (
            <div 
              key={place.id}
              className={`pin-wrapper ${isSelected ? 'active' : ''}`}
              style={{ top: `${topPos}%`, left: `${leftPos}%`, animationDelay: `${index * 0.1}s` }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPlace(place);
              }}
            >
              <div className="pin-label">{place.restaurant_name}</div>
              <div className="mock-pin"></div>
            </div>
          )
        })}
      </div>

      {/* Bottom Sheet Details */}
      <div className={`bottom-sheet ${selectedPlace ? 'open' : ''}`}>
        <div className="handle"></div>
        
        {selectedPlace && (
          <>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
              <div>
                <h2 style={{fontSize: '1.5rem', fontWeight: 800, color: '#111827', marginBottom: '8px'}}>
                  {selectedPlace.restaurant_name}
                </h2>
                <p style={{color: '#6b7280', fontSize: '0.9rem', marginBottom: '16px'}}>
                  🗺️ {selectedPlace.map_data.address}
                </p>
              </div>
              <span className="chip" style={{background: '#ffe4e6', color: '#e11d48'}}>
                {selectedPlace.country === 'KR' ? '🇰🇷 국내' : '✈️ 해외'}
              </span>
            </div>

            <div style={{display: 'flex', gap: '8px', marginBottom: '8px'}}>
              <span className="chip">{selectedPlace.map_data.category}</span>
              <span className="chip" style={{background: '#fef3c7', color: '#d97706'}}>
                ⭐️ {selectedPlace.map_data.rating_info}
              </span>
              <span className="chip" style={{background: '#e0e7ff', color: '#4338ca'}}>
                {selectedPlace.map_data.source}
              </span>
            </div>

            <div className="insta-quote">
              " {selectedPlace.insta_summary} "
              <div style={{marginTop: '8px', fontSize: '0.8rem', fontWeight: 'bold', color: '#FF3366'}}>
                - 인스타그램 분석 요약 -
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default App
