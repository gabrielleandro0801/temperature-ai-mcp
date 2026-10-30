import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import {
  Clock3, Cloud, CloudRain, CloudSun, Droplets, LoaderCircle, MapPin, Moon,
  Search, Sun, Thermometer, Umbrella, Wind,
} from 'lucide-react';
import { getWeather, searchPlaces } from './api.js';
import { getConditionLabel, getSkyCondition, isRainCode, type SkyCondition } from './weather-view.js';
import type { Place, WeatherResult } from '../shared/types.js';

const HISTORY_KEY = 'tempo-agora.recent-places';

function readRecentPlaces(): Place[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
    return Array.isArray(saved) ? saved.slice(0, 5) as Place[] : [];
  } catch {
    return [];
  }
}

function getPlaceCaption(place: Place): string {
  return [place.region, place.country].filter(Boolean).join(', ');
}

function getSkyIcon(condition: SkyCondition, isDay: boolean) {
  if (condition === 'rainy') return CloudRain;
  if (condition === 'cloudy') return Cloud;
  if (condition === 'partly') return CloudSun;
  return isDay ? Sun : Moon;
}

function formatLocalTime(timezone: string, date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatLocalDate(timezone: string, date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}

function WeatherScene({ condition, isDay }: { condition: SkyCondition; isDay: boolean }) {
  const isNight = !isDay;
  const SkyIcon = getSkyIcon(condition, isDay);
  return (
    <div className={`sky-scene ${isNight ? 'night' : 'day'} ${condition}`} aria-hidden="true">
      <div className="sky-halo" />
      {isNight ? (
        <>
          <div className="moon-disc" />
          <div className="stars">
            {Array.from({ length: 14 }, (_, index) => <i key={index} />)}
          </div>
        </>
      ) : <div className="sun-disc" />}
      <div className="cloud cloud-back" />
      <div className="cloud cloud-front" />
      {condition === 'rainy' && (
        <div className="rain-lines">
          {Array.from({ length: 22 }, (_, index) => <i key={index} />)}
        </div>
      )}
      <div className="scene-caption"><SkyIcon size={16} /> {getConditionLabel(condition)}</div>
    </div>
  );
}

function CitySearch({
  query,
  setQuery,
  onSubmit,
  busy,
}: {
  query: string;
  setQuery: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  busy: boolean;
}) {
  return (
    <form className="search-form" onSubmit={onSubmit} role="search">
      <Search size={19} aria-hidden="true" />
      <label className="sr-only" htmlFor="city-search">Pesquisar cidade</label>
      <input
        id="city-search"
        autoComplete="off"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Pesquise qualquer cidade"
      />
      <button className="search-button" type="submit" disabled={busy || query.trim().length < 2} aria-label="Pesquisar">
        {busy ? <LoaderCircle className="spin" size={18} /> : <Search size={18} />}
      </button>
    </form>
  );
}

function Metric({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="metric">
      <span className="metric-icon">{icon}</span>
      <span className="metric-label">{label}</span>
      <strong>{value}</strong>
      <span className="metric-detail">{detail}</span>
    </div>
  );
}

export default function App() {
  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [weatherResult, setWeatherResult] = useState<WeatherResult | null>(null);
  const [recentPlaces, setRecentPlaces] = useState<Place[]>(readRecentPlaces);
  const [searching, setSearching] = useState(false);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(intervalId);
  }, []);

  async function loadWeather(place: Place) {
    setSelectedPlace(place);
    setWeatherResult(null);
    setPlaces([]);
    setError(null);
    setLoadingWeather(true);
    try {
      const result = await getWeather(place);
      setWeatherResult(result);
      setRecentPlaces((current) => {
        const updated = [place, ...current.filter((item) => item.id !== place.id)].slice(0, 5);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível consultar o clima.');
    } finally {
      setLoadingWeather(false);
    }
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const searchTerm = query.trim();
    if (searchTerm.length < 2) return;
    setSearching(true);
    setPlaces([]);
    setError(null);
    try {
      const results = await searchPlaces(searchTerm);
      setPlaces(results);
      if (results.length === 0) setError(`Nenhuma cidade encontrada para “${searchTerm}”.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível pesquisar cidades.');
    } finally {
      setSearching(false);
    }
  }

  const condition = weatherResult ? getSkyCondition(weatherResult.weather) : null;
  const isDay = weatherResult?.weather.isDay ?? true;
  const SkyIcon = condition ? getSkyIcon(condition, isDay) : Sun;

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="wordmark" href="/" aria-label="Tempo agora, início">
          <span className="wordmark-symbol"><Sun size={18} strokeWidth={2.2} /></span>
          <span>TEMPO<span className="wordmark-divider">/</span>AGORA</span>
        </a>
        <div className="topbar-note"><span className="live-dot" /> DADOS ATUAIS <span className="note-separator">·</span> OPEN-METEO</div>
      </header>

      <section className="search-row" aria-label="Pesquisar uma localização">
        <div className="search-wrap">
          <CitySearch query={query} setQuery={setQuery} onSubmit={handleSearch} busy={searching} />
          {places.length > 0 && (
            <div className="place-results" role="listbox" aria-label="Cidades encontradas">
              {places.map((place) => (
                <button className="place-option" key={place.id} type="button" onClick={() => void loadWeather(place)}>
                  <span className="place-pin"><MapPin size={17} /></span>
                  <span className="place-copy"><strong>{place.name}</strong><small>{getPlaceCaption(place)}</small></span>
                  <span className="place-timezone">{place.timezone.replaceAll('_', ' ')}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <span className="search-hint">CIDADES DO MUNDO TODO</span>
      </section>

      {recentPlaces.length > 0 && (
        <nav className="recent-row" aria-label="Cidades consultadas recentemente">
          <span className="recent-label">RECENTES</span>
          {recentPlaces.map((place) => (
            <button
              className={`recent-place ${selectedPlace?.id === place.id ? 'active' : ''}`}
              key={place.id}
              type="button"
              onClick={() => void loadWeather(place)}
            >
              <span>{place.name}</span><small>{place.countryCode}</small>
            </button>
          ))}
        </nav>
      )}

      {error && <div className="error-message" role="alert">{error}</div>}

      {weatherResult && selectedPlace ? (
        <section className="weather-content" aria-live="polite">
          <div className={`weather-hero ${isDay ? 'day' : 'night'} ${condition ?? ''}`}>
            <div className="hero-copy">
              <div className="local-clock"><span className="clock-live" /><span>AGORA NA SUA CIDADE</span></div>
              <div className="place-heading">
                <MapPin size={18} strokeWidth={1.8} />
                <span>{selectedPlace.name}</span>
                {selectedPlace.countryCode && <small>{selectedPlace.countryCode}</small>}
              </div>
              <p className="place-detail">{getPlaceCaption(selectedPlace)}</p>
              <div className="current-reading">
                <span className="temperature-number">{Math.round(weatherResult.weather.temperature.value)}<sup>°</sup></span>
                <div className="current-summary">
                  <span>{getConditionLabel(condition!)}</span>
                  <small>Sensação de {Math.round(weatherResult.weather.apparentTemperature.value)}°</small>
                </div>
              </div>
              <div className="local-datetime">
                <span><Clock3 size={15} /> {formatLocalTime(selectedPlace.timezone, now)}</span>
                <span>{formatLocalDate(selectedPlace.timezone, now)}</span>
              </div>
            </div>
            <WeatherScene condition={condition!} isDay={isDay} />
            <div className="hero-condition-mark"><SkyIcon size={18} /> {isDay ? 'DIA' : 'NOITE'}</div>
          </div>

          <div className="section-heading">
            <div><span className="eyebrow">CONDIÇÕES DE AGORA</span><h2>O céu neste momento</h2></div>
            <span className="report-time">Fuso {selectedPlace.timezone.replaceAll('_', ' ')}</span>
          </div>

          <div className="metrics-grid">
            <Metric icon={<Thermometer size={19} />} label="Temperatura" value={`${weatherResult.weather.temperature.value.toFixed(1)}°`} detail="atual" />
            <Metric icon={<Wind size={19} />} label="Sensação térmica" value={`${weatherResult.weather.apparentTemperature.value.toFixed(1)}°`} detail="percebida" />
            <Metric
              icon={<Umbrella size={19} />}
              label="Chuva"
              value={weatherResult.weather.isRaining || isRainCode(weatherResult.weather.weatherCode) ? 'Sim' : 'Não'}
              detail={weatherResult.weather.isRaining ? 'no intervalo atual' : 'sem chuva registrada'}
            />
            <Metric icon={<Droplets size={19} />} label="Precipitação" value={`${weatherResult.weather.rain.value.toFixed(1)} mm`} detail="intervalo atual" />
            <Metric icon={<Droplets size={19} />} label="Umidade do ar" value={`${Math.round(weatherResult.weather.relativeHumidity.value)}%`} detail="relativa" />
          </div>

          <section className="advice-strip" aria-label="Recomendação para sair">
            <div className="advice-emblem">{weatherResult.advice.bringUmbrella ? <Umbrella size={23} /> : <SkyIcon size={23} />}</div>
            <div className="advice-copy"><span className="eyebrow">PARA SAIR</span><h2>{weatherResult.advice.title}</h2><p>{weatherResult.advice.detail}</p></div>
            <span className="advice-place">{selectedPlace.name}<MapPin size={14} /></span>
          </section>
          <p className="data-source">Condições estimadas pela Open-Meteo · Atualizadas em tempo real</p>
        </section>
      ) : (
        <section className={`empty-state ${loadingWeather ? 'loading' : ''}`} aria-live="polite">
          <div className="empty-scene" aria-hidden="true">
            <div className="empty-sun" /><div className="empty-cloud empty-cloud-one" /><div className="empty-cloud empty-cloud-two" />
            {loadingWeather && <LoaderCircle className="empty-loader spin" size={26} />}
          </div>
          <div className="empty-copy">
            <span className="eyebrow">UM MUNDO DE CLIMAS</span>
            <h1>{loadingWeather ? 'Lendo o céu agora' : 'O tempo, onde você estiver.'}</h1>
            <p>{loadingWeather && selectedPlace
              ? `Buscando as condições atuais em ${selectedPlace.name}.`
              : 'Escolha uma cidade e descubra como está o céu neste instante.'}</p>
          </div>
          <div className="empty-footer"><span><span className="live-dot" /> SEM DADOS INVENTADOS</span><span>BUSCA GLOBAL · OPEN-METEO</span></div>
        </section>
      )}

      <footer className="page-footer"><span>FEITO PARA OLHAR LÁ FORA</span><span>°C <span className="footer-divider">/</span> MUNDO</span></footer>
    </main>
  );
}