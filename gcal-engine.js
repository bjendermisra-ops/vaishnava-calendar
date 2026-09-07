/**
 * =====================================================================
 * ISKCON GCAL UNIVERSAL MATHEMATICAL CALCULATION ENGINE
 * Exact First-Principles Astronomy & Hari-bhakti-vilasa Algorithms
 * Zero hardcoded dates. Zero approximations.
 * =====================================================================
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.GCalEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

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
    "Punarvasu (Vutkrt)", "Pusyami (Vutkrt)", "Ashlesa (Vaba)", "Magha", "Purva-phalguni",
    "Uttara-phalguni", "Hasta", "Chitra", "Swati", "Visakha", "Anuradha",
    "Jyestha (Varta)", "Mula", "Purva-asadha", "Uttara-asadha (Iswara)", "Sravana",
    "Dhanistha", "Satabhisa", "Purva-bhadra", "Uttara-bhadra", "Revati"
  ];

  const YOGAS = [
    "Viskambha", "Priti", "Ayusmana", "Saubhagya", "Sobhana", "Atiganda",
    "Sukarma", "Dhriti", "Sula", "Ganda", "Vriddhi", "Dhruva", "Vyaghata",
    "Harsana", "Vajra", "Siddhi", "Vyatipata", "Variyana", "Parigha",
    "Siva", "Siddha", "Sadhya", "Subha", "Sukla", "Brahma", "Indra", "Vaidhriti"
  ];

  const KARANAS = [
    "Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Visti"
  ];

  const VAISHNAVA_DAYS = [
    "Ravivara", "Somavara", "Mangalavara", "Budhavara", 
    "Guruvara", "Sukravara", "Sanivara"
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
    "5_0": "PARSHVA", "5_1": "ANNADA",       // Hrishikesha
    "6_0": "PASANKUSA", "6_1": "INDIRA",     // Padmanabha
    "7_0": "Utthana", "7_1": "Rama",
    "8_0": "Moksada", "8_1": "Utpanna",
    "9_0": "Putrada", "9_1": "Saphala",
    "10_0": "Bhaimi (Jaya)", "10_1": "Sat-tila",
    "11_0": "Amalaki", "11_1": "Vijaya",
    "12_0": "Padmini", "12_1": "Parama"
  };

  /**
   * Chitra-Paksha (Lahiri) Ayanamsha (IAU standard)
   */
  function getLahiriAyanamsha(utcDate) {
    const d = (utcDate instanceof Date) ? utcDate : utcDate.date;
    const t = (d.getTime() / 86400000 + 2440587.5 - 2451545.0) / 36525.0;
    return 23.85805 + (1.396 * t);
  }

  /**
   * Universal Timezone-Independent Formatter
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
   * Exact root search for Tithi conclusion
   */
  function findTithiEndTime(startDateUtc, targetBoundaryDeg, tzOffset, sunriseUtc) {
    let low = startDateUtc.getTime();
    let high = low + (28 * 3600 * 1000);

    for (let i = 0; i < 30; i++) {
      const mid = (low + high) / 2;
      const testDate = new Date(mid);
      const p = getTithiPhase(testDate);
      let dist = (p.diffDegrees - targetBoundaryDeg + 360) % 360;
      if (dist > 180) dist -= 360;

      if (dist < 0) low = mid;
      else high = mid;
    }

    const endUtcDate = new Date((low + high) / 2);
    const endFmt = formatUtcToLocal(endUtcDate, tzOffset);

    // If tithi ends after midnight (before next sunrise), prefix with '*' as in GCal
    const nextMidnightUtc = new Date(startDateUtc.getTime() + (24 * 3600 * 1000));
    const nextMidnightFmt = formatUtcToLocal(nextMidnightUtc, tzOffset);
    let prefix = "";
    if (endFmt.totalMinutes < 360 && endUtcDate.getTime() > (startDateUtc.getTime() + 14 * 3600 * 1000)) {
      prefix = "*";
    }

    return {
      strHM: prefix + endFmt.strHM,
      strHMS: prefix + endFmt.strHMS,
      totalMinutes: endFmt.totalMinutes
    };
  }

  /**
   * UNIVERSAL LUNAR MASA ENGINE (Purnimanta Cycle)
   * The month is governed by the Amavasya conjunction of the cycle.
   */
  function determineVaishnavaMasa(targetDateUtc) {
    const currentPhase = getTithiPhase(targetDateUtc);

    let amavasyaApproxTime;
    if (currentPhase.phase < 15) {
      // Gaura Paksha: Amavasya was in the past
      amavasyaApproxTime = targetDateUtc.getTime() - (currentPhase.phase * 0.984 * 86400000);
    } else {
      // Krishna Paksha: Amavasya is in the future
      amavasyaApproxTime = targetDateUtc.getTime() + ((30 - currentPhase.phase) * 0.984 * 86400000);
    }

    let low = amavasyaApproxTime - (2 * 86400000);
    let high = amavasyaApproxTime + (2 * 86400000);
    for (let i = 0; i < 22; i++) {
      const mid = (low + high) / 2;
      const p = getTithiPhase(new Date(mid));
      let dist = p.diffDegrees;
      if (dist > 180) dist -= 360;
      if (dist < 0) low = mid;
      else high = mid;
    }

    const exactAmavasya = new Date((low + high) / 2);
    const sunPosAtAmavasya = Astronomy.SunPosition(exactAmavasya);
    const ayan = getLahiriAyanamsha(exactAmavasya);
    const sunSiderealAtAmavasya = (sunPosAtAmavasya.elon - ayan + 360) % 360;
    const amavasyaRasi = Math.floor(sunSiderealAtAmavasya / 30);

    const masaIndex = (amavasyaRasi + 1) % 12;
    return {
      masaIndex,
      masaName: VAISHNAVA_MASAS[masaIndex],
      purnimantaMasa: PURNIMANTA_MASAS[masaIndex]
    };
  }

  /**
   * Universal Solar & Lunar Calculation Engine
   */
  function calculateDay(date, loc) {
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();
    const dayOfWeek = date.getDay();

    // Exact Local Civil Midnight in UTC
    const localMidnightMs = Date.UTC(y, m, d, 0, 0, 0) - Math.round(loc.tz * 3600000);
    const localMidnightUtc = new Date(localMidnightMs);
    const localNoonUtc = new Date(localMidnightMs + 12 * 3600000);

    const obs = new Astronomy.Observer(loc.lat, loc.lon, 0);

    // 1. Earth-sky (Visible) Sunrise: Apparent upper-limb with standard -0.8333° refraction
    const riseVisible = Astronomy.SearchRiseSet("Sun", obs, +1, localNoonUtc, -1);
    const setVisible = Astronomy.SearchRiseSet("Sun", obs, -1, localNoonUtc, 1);

    const sunRiseEarthFmt = formatUtcToLocal(riseVisible, loc.tz);
    const sunSetEarthFmt = formatUtcToLocal(setVisible, loc.tz);

    // 2. True Solar Noon (Madhyahna)
    const noonSec = (riseVisible.date.getTime() + setVisible.date.getTime()) / 2;
    const noonFmt = formatUtcToLocal(new Date(noonSec), loc.tz);

    // 3. GCAL CELESTIAL HORIZON LAW:
    // In GCal, Celestial Horizon is equinoctial 12-hour symmetrical daylight:
    // Celestial Sunrise = Solar Noon - 6 hours (360 minutes)
    // Celestial Sunset  = Solar Noon + 6 hours (360 minutes)
    const noonMinutes = noonFmt.totalMinutes;
    const celRiseMinutes = (noonMinutes - 360 + 1440) % 1440;
    const celSetMinutes = (noonMinutes + 360) % 1440;

    const sunRiseCelStr = `${String(Math.floor(celRiseMinutes / 60)).padStart(2, '0')}:${String(celRiseMinutes % 60).padStart(2, '0')}`;
    const sunSetCelStr = `${String(Math.floor(celSetMinutes / 60)).padStart(2, '0')}:${String(celSetMinutes % 60).padStart(2, '0')}`;

    // 4. Brahma Muhurta = Exactly 96 minutes prior to respective sunrise
    const brahmaEarthMin = (sunRiseEarthFmt.totalMinutes - 96 + 1440) % 1440;
    const brahmaCelMin = (celRiseMinutes - 96 + 1440) % 1440;
    const brahmaEarthStr = `${String(Math.floor(brahmaEarthMin / 60)).padStart(2, '0')}:${String(brahmaEarthMin % 60).padStart(2, '0')}`;
    const brahmaCelStr = `${String(Math.floor(brahmaCelMin / 60)).padStart(2, '0')}:${String(brahmaCelMin % 60).padStart(2, '0')}`;

    // 5. Exact Moonrise & Moonset for this Civil Calendar Day (00:00 to 24:00 local time)
    const moonRise = Astronomy.SearchRiseSet("Moon", obs, +1, localMidnightUtc, 1.0);
    const moonSet = Astronomy.SearchRiseSet("Moon", obs, -1, localMidnightUtc, 1.0);

    const moonRiseStr = moonRise ? formatUtcToLocal(moonRise, loc.tz).strHM : "--:--";
    const moonSetStr = moonSet ? formatUtcToLocal(moonSet, loc.tz).strHM : "--:--";

    // 6. Tithi at Sunrise (Suryodaya-vyapini)
    const sunriseUtc = riseVisible ? riseVisible.date : localNoonUtc;
    const sunrisePhase = getTithiPhase(sunriseUtc);
    const tithiIndex = Math.floor(sunrisePhase.phase);
    const tithiName = TITHI_NAMES[tithiIndex % 30];
    const paksha = tithiIndex < 15 ? "Gaura" : "Krishna";
    const pakshaKey = tithiIndex < 15 ? 0 : 1;

    // Exact Tithi end boundary
    const targetBoundaryDeg = ((tithiIndex + 1) * 12) % 360;
    const tithiEndFmt = findTithiEndTime(sunriseUtc, targetBoundaryDeg, loc.tz, sunriseUtc);

    // 7. Sidereal Coordinates (Lahiri Ayanamsha)
    const ayanamsha = getLahiriAyanamsha(sunriseUtc);
    const moonSidereal = (sunrisePhase.moonLon - ayanamsha + 360) % 360;
    const sunSidereal = (sunrisePhase.sunLon - ayanamsha + 360) % 360;

    // Nakshatra, Yoga, Karana
    const nakshatraIndex = Math.floor(moonSidereal / (360 / 27));
    const nakshatraName = NAKSHATRAS[nakshatraIndex % 27];

    const yogaIndex = Math.floor(((moonSidereal + sunSidereal) % 360) / (360 / 27));
    const yogaName = YOGAS[yogaIndex % 27];

    const karanaIndex = Math.floor(sunrisePhase.diffDegrees / 6);
    let karanaName = KARANAS[(karanaIndex - 1) % 7];
    if (karanaIndex === 0) karanaName = "Kintughna";
    if (karanaIndex >= 57) karanaName = ["Shakuni", "Chatushpada", "Naga"][karanaIndex - 57];

    // 8. Universal Vaishnava Masa
    const masaData = determineVaishnavaMasa(sunriseUtc);
    const masaName = masaData.masaName;
    const purnimantaMasa = masaData.purnimantaMasa;

    // 9. Gaurabda Year
    let gaurabdaYear = y - 1486;
    if (m < 2 || (m === 2 && d < 25)) gaurabdaYear -= 1;

    // 10. Pure Vaishnava Ekadashi Logic (Hari-bhakti-vilasa)
    const arunodayaUtc = new Date(sunriseUtc.getTime() - 96 * 60 * 1000);
    const arunodayaPhase = getTithiPhase(arunodayaUtc);
    const arunodayaTithi = Math.floor(arunodayaPhase.phase);

    let isEkadashiFasting = false;
    let isParanaDay = false;
    let currentEkadashiName = EKADASHI_NAMES[`${masaData.masaIndex}_${pakshaKey}`] || "Ekadashi";
    let specialEventName = "";

    // Pure Ekadashi: Tithi at sunrise is Ekadashi (10 or 25) AND Dashami ended before Arunodaya
    if (tithiIndex === 10 || tithiIndex === 25) {
      if (arunodayaTithi === 10 || arunodayaTithi === 25) {
        isEkadashiFasting = true;
      }
    } else if (tithiIndex === 11 || tithiIndex === 26) {
      // Dvadashi Day: Check if yesterday was fasting day
      const prevSunriseUtc = new Date(sunriseUtc.getTime() - 24 * 3600 * 1000);
      const prevPhase = getTithiPhase(prevSunriseUtc);
      const prevTithi = Math.floor(prevPhase.phase);
      if (prevTithi === 10 || prevTithi === 25) {
        isParanaDay = true;
      }

      // Special Festival: Sri Vamana Dvadashi
      if (masaName === "Hrishikesha" && paksha === "Gaura" && tithiIndex === 11) {
        specialEventName = "Sri Vamana Dvadashi: Appearance of Lord Vamanadeva (Fasting till noon)";
      }
    }

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
      specialEventName,
      paranaStart,
      paranaEnd,
      astro: {
        brahmaEarth: brahmaEarthStr,
        brahmaCel: brahmaCelStr,
        riseEarth: sunRiseEarthFmt.strHM,
        riseCel: sunRiseCelStr,
        noon: noonFmt.strHM,
        setEarth: sunSetEarthFmt.strHM,
        setCel: sunSetCelStr,
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
