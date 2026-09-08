from http.server import BaseHTTPRequestHandler
import json
import urllib.parse
import io
import gaurabda as gcal

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # 1. Parse URL Query Parameters
        query = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        year = int(query.get('year', [2026])[0])
        month = int(query.get('month', [9])[0])
        day = int(query.get('day', [8])[0])
        city = query.get('city', ['Pune'])[0]
        lat = float(query.get('lat', [18.5204])[0])
        lon = float(query.get('lon', [73.8567])[0])
        tz = float(query.get('tz', [5.5])[0])
        count = int(query.get('count', [35])[0])

        try:
            # 2. Try finding city in GCal built-in 4,000 city database first
            loc = gcal.FindLocation(city=city)
            if not loc:
                # Custom location fallback
                tz_sign = "+" if tz >= 0 else "-"
                tz_h = int(abs(tz))
                tz_m = int(round((abs(tz) - tz_h) * 60))
                tz_str = f"{tz_sign}{tz_h:02d}:{tz_m:02d}"
                loc = gcal.GCLocation(data={
                    'latitude': lat,
                    'longitude': lon,
                    'tzname': f"{tz_str} {city}",
                    'name': city
                })

            # 3. Calculate Calendar using Official GCal Engine
            start_date = gcal.GCGregorianDate(year=year, month=month, day=day)
            tc = gcal.TCalendar()
            tc.CalculateCalendar(loc, start_date, count)

            # 4. Stream official GCal JSON output
            stream = io.StringIO()
            tc.write(stream, format='json')
            result_json = stream.getvalue()

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(result_json.encode('utf-8'))

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            err_payload = json.dumps({'error': str(e)})
            self.wfile.write(err_payload.encode('utf-8'))
