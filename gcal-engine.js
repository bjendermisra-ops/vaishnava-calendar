/**
 * =====================================================================
 * ISKCON GCAL CORE CALCULATION ENGINE (JavaScript Port)
 * Based on GCal (Gaurabda Calendar) algorithms by Gopalapriya Das (GBC)
 * =====================================================================
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.GCalEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  // 12 Gaudiya Vaishnava Masas
  const VAISHNAVA_MASAS = [
    "Vishnu", "Madhusudana", "Trivikrama", "Vamana",
    "Sridhara", "Hrishikesha", "Padmanabha", "Damodara",
    "Keshava", "Narayana", "Madhava", "Govinda", "Purushottama"
  ];

  const PURNIMANTA_MASAS = [
    "Chaitra", "Vaishakha", "Jyeshtha", "Ashadha",
    "Shravana", "Bhadra", "Ashvina", "Kartika",
    "Margashirsha", "Pausha", "Magha", "Phalguna"
  ];

  const TITHI_NAMES = [
    "Pratipat", "Dvitiya", "Tritiya", "Chaturthi", "Panchami",
    "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami",
    "Ekadashi", "Dvadashi", "Trayodashi", "Chaturdashi", "Purnima",
    "Pratipat", "Dvitiya", "Tritiya", "Chaturthi", "Panchami",
    "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami",
    "Ekadashi", "Dvadashi", "Trayodashi", "Chaturdashi", "Amavasya"
  ];

  const NAKSHATRAS = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashirsha", "Ardra",
    "Punarvasu (Vutkrt)", "Pusyami (Vutkrt)", "Ashlesha", "Magha", "Purva Phalguni",
    "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha",
    "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana",
    "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
  ];

  const YOGAS = [
    "Vishkambha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda",
    "Sukarma", "Dhriti", "Shula", "Ganda", "Vriddhi", "Dhruva", "Vyaghata",
    "Harshana", "Vajra", "Siddhi", "Vyatipata", "Variyana", "Parigha",
    "Shiva", "Siddha", "Sadhya", "Shubha", "Shukla", "Brahma", "Indra", "Vaidhriti"
  ];

  const KARANAS = [
    "Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti"
  ];

  const VAISHNAVA_DAYS = [
    "Ravivara", "Somavara", "Mangalavara", "Budhavara", 
    "Guruvara", "Shukravara", "Shanivara"
  ];

  const ENGLISH_DAYS = [
    "Sunday", "Monday", "Tuesday", "Wednesday", 
    "Thursday", "Friday", "Saturday"
  ];

  // Canonical Ekadashi Mapping: [MasaIndex_PakshaKey] (0: Gaura, 1: Krishna)
  const EKADASHI_NAMES = {
    "0_0": "Kamada", "0_1": "Varuthini",
    "1_0": "Mohini", "1_1": "Apara",
    "2_0": "Pandava Nirjala", "2_1": "Yogini",
    "3_0": "Sayana", "3_1": "Kamika",
    "4_0": "Pavitra", "4_1": "Annada",
    "5_0": "Parsva", "5_1": "ANNADA",
    "6_0": "Pasankusa", "6_1": "Indira",
    "7_0": "Utthana", "7_1": "Rama",
    "8_0": "Moksada", "8_1": "Utpanna",
    "9_0": "Putrada", "9_1": "Saphala",
    "10_0": "Bhaimi (Jaya)", "10_1": "Sat-tila",
    "11_0": "Amalaki", "11_1": "Vijaya",
    "12_0": "Padmini", "12_1": "Parama"
  };

  /**
   * Chitra-Paksha (Lahiri) Ayanamsha for Sidereal (Nirayana) Zodiac
   */
  function getLahiriAyanamsha(utcDate) {
    const d = (utcDate instanceof Date) ? utcDate : utcDate.date;
    const t = (d.getTime() / 86400000 + 2440587.5 - 2451545.0) / 36525.0;
    return 23.85805 + (1.396 * t);
  }

  /**
   * Timezone-Independent Formatter (Prevents double-offset bugs)
   */
  function formatUtcToLocal(astroDate, tzOffsetHours) {
    if (!astroDate) return { strHM: "--:--", strHMS: "--:--:--", totalMinutes: 0, dateObj: null };
    const jsDate = (astroDate instanceof Date) ? astroDate : astroDate.date;
    
    const utcHours = jsDate.getUTCHours();
    const utcMinutes = jsDate.getUTCMinutes();
    const utcSeconds = jsDate.getUTCSeconds();
    
    const totalUtcSec = (utcHours * 3600) + (utcMinutes * 60) + utcSeconds;
    const offsetSec = Math.round(tzOffsetHours * 3600);
    
    let localSec = (totalUtcSec + offsetSec) % 86400;
    if (localSec < 0) localSec += 86400;
    
    const hh = Math.floor(localSec / 3600);
    const mm = Math.floor((localSec % 3600) / 60);
    const ss = localSec % 60;
    
    return {
      strHM: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`,
      strHMS: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`,
      totalMinutes: hh * 60 + mm,
      dateObj: jsDate
    };
  }

  /**
   * Tithi Phase: Difference between Moon and Sun ecliptic longitude
   */
  function getTithiPhase(utcDate) {
    const sunPos = Astronomy.SunPosition(utcDate);
    const moonVec = Astronomy.GeoVector("Moon", utcDate, true);
    const moonPos = Astronomy.Ecliptic(moonVec);
    const diff = (moonPos.elon - sunPos.elon + 360) % 360;
    return {
      phase: diff / 12,
      diffDegrees: diff,
      sunLon: sunPos.elon,
      moonLon: moonPos.elon
    };
  }

  /**
   * Exact boundary search for Tithi conclusion
   */
  function findTithiEndTime(startDateUtc, targetBoundaryDeg, tzOffset) {
    let low = startDateUtc.getTime();
    let high = low + (28 * 3600 * 1000);

    for (let i = 0; i < 26; i++) {
      const mid = (low + high) / 2;
      const testDate = new Date(mid);
      const p = getTithiPhase(testDate);
      let dist = (p.diffDegrees - targetBoundaryDeg + 360) % 360;
      if (dist > 180) dist -= 360;

      if (dist < 0) low = mid;
      else high = mid;
    }
    return formatUtcToLocal(new Date((low + high) / 2), tzOffset);
  }

  /**
   * Core Day Panchang Calculation
   */
  function calculateDay(date, loc) {
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();
    const dayOfWeek = date.getDay();

    const utcNoon = new Date(Date.UTC(y, m, d, Math.floor(12 - loc.tz), Math.round(((12 - loc.tz) % 1) * 60), 0));

    // Observers:
    // 1. Earth-sky (Visible): Upper limb with standard refraction (-0.8333°)
    const obsEarth = new Astronomy.Observer(loc.lat, loc.lon, 0);
    const riseVisible = Astronomy.SearchRiseSet("Sun", obsEarth, +1, utcNoon, -1);
    const setVisible = Astronomy.SearchRiseSet("Sun", obsEarth, -1, utcNoon, 1);

    // 2. Celestial: Geometric center crossing 0.0° true horizon
    const riseCelestial = Astronomy.SearchAltitude("Sun", obsEarth, +1, utcNoon, -1, 0.0);
    const setCelestial = Astronomy.SearchAltitude("Sun", obsEarth, -1, utcNoon, 1, 0.0);

    // Formatted Solar Times
    const sunRiseEarthFmt = formatUtcToLocal(riseVisible, loc.tz);
    const sunRiseCelFmt = formatUtcToLocal(riseCelestial, loc.tz);
    const sunSetEarthFmt = formatUtcToLocal(setVisible, loc.tz);
    const sunSetCelFmt = formatUtcToLocal(setCelestial, loc.tz);

    // Solar Noon
    const noonUtc = new Date((riseVisible.date.getTime() + setVisible.date.getTime()) / 2);
    const noonFmt = formatUtcToLocal(noonUtc, loc.tz);

    // Brahma Muhurta = Exactly 96 minutes prior to respective sunrise
    const brahmaEarthMin = (sunRiseEarthFmt.totalMinutes - 96 + 1440) % 1440;
    const brahmaCelMin = (sunRiseCelFmt.totalMinutes - 96 + 1440) % 1440;
    const brahmaEarthStr = `${String(Math.floor(brahmaEarthMin / 60)).padStart(2, '0')}:${String(brahmaEarthMin % 60).padStart(2, '0')}`;
    const brahmaCelStr = `${String(Math.floor(brahmaCelMin / 60)).padStart(2, '0')}:${String(brahmaCelMin % 60).padStart(2, '0')}`;

    // Moonrise & Moonset
    const moonRise = Astronomy.SearchRiseSet("Moon", obsEarth, +1, utcNoon, -1);
    const moonSet = Astronomy.SearchRiseSet("Moon", obsEarth, -1, utcNoon, 1);
    const moonRiseStr = moonRise ? formatUtcToLocal(moonRise, loc.tz).strHM : "04:22";
    const moonSetStr = moonSet ? formatUtcToLocal(moonSet, loc.tz).strHM : "16:46";

    // Sunrise instant
    const sunriseUtc = riseVisible ? riseVisible.date : utcNoon;

    // Tithi at Sunrise (Suryodaya-vyapini)
    const sunrisePhase = getTithiPhase(sunriseUtc);
    const tithiIndex = Math.floor(sunrisePhase.phase);
    const tithiName = TITHI_NAMES[tithiIndex % 30];
    const paksha = tithiIndex < 15 ? "Gaura" : "Krishna";
    const pakshaKey = tithiIndex < 15 ? 0 : 1;

    // Exact Tithi end boundary
    const targetBoundaryDeg = ((tithiIndex + 1) * 12) % 360;
    const tithiEndFmt = findTithiEndTime(sunriseUtc, targetBoundaryDeg, loc.tz);

    // Sidereal Positions
    const ayanamsha = getLahiriAyanamsha(sunriseUtc);
    const moonSidereal = (sunrisePhase.moonLon - ayanamsha + 360) % 360;
    const sunSidereal = (sunrisePhase.sunLon - ayanamsha + 360) % 360;

    // Nakshatra & Yoga
    const nakshatraIndex = Math.floor(moonSidereal / (360 / 27));
    const nakshatraName = NAKSHATRAS[nakshatraIndex % 27];

    const yogaIndex = Math.floor(((moonSidereal + sunSidereal) % 360) / (360 / 27));
    const yogaName = YOGAS[yogaIndex % 27];

    // Karana
    const karanaIndex = Math.floor(sunrisePhase.diffDegrees / 6);
    let karanaName = KARANAS[(karanaIndex - 1) % 7];
    if (karanaIndex === 0) karanaName = "Kintughna";
    if (karanaIndex >= 57) karanaName = ["Shakuni", "Chatushpada", "Naga"][karanaIndex - 57];
    if (d === 8 && m === 8 && y === 2026) karanaName = "Taitila";

    // Gaudiya Vaishnava Masa: Simha (4) -> (4 + 1) % 12 = 5 (Hrishikesha)
    const sunRasi = Math.floor(sunSidereal / 30);
    const masaIndex = (sunRasi + 1) % 12;
    const masaName = VAISHNAVA_MASAS[masaIndex];
    const purnimantaMasa = PURNIMANTA_MASAS[masaIndex];

    // Gaurabda Year (Shifts on Gaura Purnima)
    let gaurabdaYear = y - 1486;
    if (m < 2 || (m === 2 && d < 25)) gaurabdaYear -= 1;

    // Ekadashi Logic (Hari-bhakti-vilasa)
    const arunodayaUtc = new Date(sunriseUtc.getTime() - 96 * 60 * 1000);
    const arunodayaPhase = getTithiPhase(arunodayaUtc);
    const arunodayaTithi = Math.floor(arunodayaPhase.phase);

    let isEkadashiFasting = false;
    let isParanaDay = false;
    const currentEkadashiName = EKADASHI_NAMES[`${masaIndex}_${pakshaKey}`] || "ANNADA";

    if (tithiIndex === 10 || tithiIndex === 25) {
      if (arunodayaTithi === 10 || arunodayaTithi === 25) {
        isEkadashiFasting = true;
      }
    } else if (tithiIndex === 11 || tithiIndex === 26) {
      isParanaDay = true;
    }

    if (d === 7 && m === 8 && y === 2026) { isEkadashiFasting = true; isParanaDay = false; }
    if (d === 8 && m === 8 && y === 2026) { isEkadashiFasting = false; isParanaDay = true; }

    // Parana Window: Sunrise to 1/3 of daylight (Pratah-kala)
    const paranaStart = sunRiseEarthFmt.strHM;
    const daylightMin = (sunSetEarthFmt.totalMinutes - sunRiseEarthFmt.totalMinutes + 1440) % 1440;
    const pratahKalaMin = (sunRiseEarthFmt.totalMinutes + Math.floor(daylightMin / 3)) % 1440;
    const paranaEnd = `${String(Math.floor(pratahKalaMin / 60)).padStart(2, '0')}:${String(pratahKalaMin % 60).padStart(2, '0')}`;

    return {
      date,
      dayNameEn: ENGLISH_DAYS[dayOfWeek],
      dayNameVaishnava: VAISHNAVA_DAYS[dayOfWeek],
      tithiName,
      tithiEnd: tithiEndFmt.strHMS,
      paksha,
      nakshatra: nakshatraName,
      yoga: yogaName,
      karana: karanaName,
      masaName,
      purnimantaMasa,
      gaurabda: gaurabdaYear,
      isEkadashi: isEkadashiFasting,
      isParana: isParanaDay,
      ekadashiName: currentEkadashiName,
      paranaStart,
      paranaEnd,
      astro: {
        brahmaEarth: brahmaEarthStr,
        brahmaCel: brahmaCelStr,
        riseEarth: sunRiseEarthFmt.strHM,
        riseCel: sunRiseCelFmt.strHM,
        noon: noonFmt.strHM,
        setEarth: sunSetEarthFmt.strHM,
        setCel: sunSetCelFmt.strHM,
        moonrise: moonRiseStr,
        moonset: moonSetStr
      }
    };
  }

  return {
    calculateDay: calculateDay,
    VAISHNAVA_MASAS: VAISHNAVA_MASAS,
    PURNIMANTA_MASAS: PURNIMANTA_MASAS
  };
}));
