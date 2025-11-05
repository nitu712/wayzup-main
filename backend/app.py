from flask import Flask, request, jsonify
from flask_cors import CORS
from io import BytesIO
from PIL import Image, ExifTags
import base64
import math
import uuid


app = Flask(__name__)
CORS(app)


# In-memory storage: list of hazard dicts
hazards = []


def _get_exif(img: Image.Image):
    try:
        exif = img._getexif() or {}
        # Normalize tag names
        return {ExifTags.TAGS.get(k, k): v for k, v in exif.items()}
    except Exception:
        return {}


def _convert_to_degrees(value):
    # value is a tuple of (deg, min, sec) where each may be a ratio
    def _ratio_to_float(r):
        try:
            # PIL returns as (num, den)
            return r[0] / r[1]
        except Exception:
            return float(r)

    d = _ratio_to_float(value[0])
    m = _ratio_to_float(value[1])
    s = _ratio_to_float(value[2])
    return d + (m / 60.0) + (s / 3600.0)


def extract_gps_from_image(file_bytes: bytes):
    img = Image.open(BytesIO(file_bytes))
    exif = _get_exif(img)
    gps_info = exif.get("GPSInfo")
    if not gps_info:
        return None

    # Convert numeric keys to names using GPSTAGS if present
    try:
        gps_decoded = {}
        for key, val in gps_info.items():
            name = ExifTags.GPSTAGS.get(key, key)
            gps_decoded[name] = val
    except Exception:
        gps_decoded = gps_info

    lat = gps_decoded.get("GPSLatitude")
    lat_ref = gps_decoded.get("GPSLatitudeRef")
    lon = gps_decoded.get("GPSLongitude")
    lon_ref = gps_decoded.get("GPSLongitudeRef")

    if not (lat and lat_ref and lon and lon_ref):
        return None

    lat_deg = _convert_to_degrees(lat)
    if lat_ref in ["S", b"S"]:
        lat_deg = -lat_deg

    lon_deg = _convert_to_degrees(lon)
    if lon_ref in ["W", b"W"]:
        lon_deg = -lon_deg

    return {"lat": lat_deg, "lng": lon_deg}


def haversine_distance_m(lat1, lon1, lat2, lon2):
    R = 6371000.0  # meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def create_image_preview_base64(file_bytes: bytes, max_size: int = 480) -> str:
    try:
        img = Image.open(BytesIO(file_bytes))
        img.thumbnail((max_size, max_size))
        buf = BytesIO()
        img.save(buf, format="JPEG", quality=75)
        b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
        return f"data:image/jpeg;base64,{b64}"
    except Exception:
        # Fallback to original bytes as JPEG base64
        b64 = base64.b64encode(file_bytes).decode("utf-8")
        return f"data:image/jpeg;base64,{b64}"


@app.route("/report", methods=["POST"])
def report_hazard():
    if "image" not in request.files:
        return jsonify({"error": "Missing image file in form-data with key 'image'"}), 400

    image_file = request.files["image"]
    description = request.form.get("description", "").strip()
    # Optional browser-provided coordinates as a fallback when no EXIF GPS is present
    lat_form = request.form.get("lat")
    lng_form = request.form.get("lng")

    file_bytes = image_file.read()

    gps = extract_gps_from_image(file_bytes)
    if gps:
        lat = gps["lat"]
        lng = gps["lng"]
    else:
        # Fallback to provided lat/lng if available
        if lat_form is not None and lng_form is not None:
            try:
                lat = float(lat_form)
                lng = float(lng_form)
            except ValueError:
                return jsonify({"error": "Invalid lat/lng provided."}), 400
        else:
            return jsonify({"error": "No GPS EXIF data found. Enable location or upload a geo-tagged photo."}), 400

    # Check proximity to existing hazards (within ~100 meters)
    NEARBY_M = 100.0
    matched_indices = []
    for idx, hz in enumerate(hazards):
        d = haversine_distance_m(lat, lng, hz["lat"], hz["lng"])
        if d <= NEARBY_M:
            matched_indices.append(idx)

    verified = False
    if matched_indices:
        # Increment report counts and verify if >= 2 reports
        for idx in matched_indices:
            hazards[idx]["reports"] += 1
            if hazards[idx]["reports"] >= 2:
                hazards[idx]["verified"] = True
        verified = any(hazards[idx]["verified"] for idx in matched_indices)

    preview = create_image_preview_base64(file_bytes)
    hazard_id = str(uuid.uuid4())
    new_hazard = {
        "id": hazard_id,
        "lat": lat,
        "lng": lng,
        "description": description or "",
        "verified": verified,  # newly added report is unverified until multiple exist
        "reports": 1,
        "imagePreview": preview,
    }
    hazards.append(new_hazard)

    return jsonify({"message": "Hazard reported successfully", "hazard": new_hazard}), 201


@app.route("/hazards", methods=["GET"])
def get_hazards():
    # Return only verified hazards as per spec for map display
    verified_only = [h for h in hazards if h.get("verified")]
    return jsonify({"hazards": verified_only})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)


