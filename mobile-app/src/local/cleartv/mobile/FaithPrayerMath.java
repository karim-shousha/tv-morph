package local.cleartv.mobile;

import com.batoulapps.adhan.*;
import com.batoulapps.adhan.data.DateComponents;
import java.util.*;

/** Offline astronomy. Dates are civil dates in the chosen city's actual timezone. */
final class FaithPrayerMath {
    static final String[] KEYS = {"fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"};
    static final String[] AR = {"الفجر", "الشروق", "الظهر", "العصر", "المغرب", "العشاء"};
    static final String[] EN = {"Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"};
    static Date[] times(double latitude, double longitude, TimeZone zone, long now, int days,
                        String method, boolean hanafi, Map<String,Integer> offsets) {
        Calendar date = Calendar.getInstance(zone);
        date.setTimeInMillis(now);
        date.add(Calendar.DAY_OF_MONTH, days);
        CalculationMethod kind;
        switch (method) {
            case "egyptian": kind = CalculationMethod.EGYPTIAN; break;
            case "umm_al_qura": kind = CalculationMethod.UMM_AL_QURA; break;
            case "isna": kind = CalculationMethod.NORTH_AMERICA; break;
            case "karachi": kind = CalculationMethod.KARACHI; break;
            case "dubai": kind = CalculationMethod.DUBAI; break;
            case "kuwait": kind = CalculationMethod.KUWAIT; break;
            case "qatar": kind = CalculationMethod.QATAR; break;
            case "singapore": kind = CalculationMethod.SINGAPORE; break;
            case "moonsighting": kind = CalculationMethod.MOON_SIGHTING_COMMITTEE; break;
            default: kind = CalculationMethod.MUSLIM_WORLD_LEAGUE;
        }
        CalculationParameters params = kind.getParameters();
        params.madhab = hanafi ? Madhab.HANAFI : Madhab.SHAFI;
        params.adjustments.fajr = offsets.getOrDefault("fajr", 0);
        params.adjustments.dhuhr = offsets.getOrDefault("dhuhr", 0);
        params.adjustments.asr = offsets.getOrDefault("asr", 0);
        params.adjustments.maghrib = offsets.getOrDefault("maghrib", 0);
        params.adjustments.isha = offsets.getOrDefault("isha", 0);
        PrayerTimes times = new PrayerTimes(new Coordinates(latitude, longitude),
            new DateComponents(date.get(Calendar.YEAR), date.get(Calendar.MONTH) + 1, date.get(Calendar.DAY_OF_MONTH)), params);
        return new Date[]{times.fajr, times.sunrise, times.dhuhr, times.asr, times.maghrib, times.isha};
    }
}
