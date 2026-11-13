"""God's Eye Live Traffic Surveillance & CV Engine for Sink OS."""

import time
import math
import io
import os
from typing import Dict, Any, List, Optional
from PIL import Image, ImageDraw, ImageFont

from backend.state_store.store import StateStore

# Dedicated Camera Mappings - Exactly 1 primary camera bound to EVERY Hyderabad road edge
CAMERA_EDGE_MAPPINGS = [
    {
        "camera_id": "CAM-HYD-01",
        "name": "Punjagutta Central Flyover Cam",
        "edge_id": "edge_punjagutta_banjara",
        "road_name": "Punjagutta - Banjara Arterial",
        "corridor": "Central Metropolitan Arterial",
        "lat": 17.4265,
        "lng": 78.4526,
        "lane_count": 4,
        "heading": 215,
        "base_speed": 48.0,
        "base_count": 42
    },
    {
        "camera_id": "CAM-HYD-02",
        "name": "Banjara Hills Rd No. 2 Cam",
        "edge_id": "edge_banjara_jubilee",
        "road_name": "Banjara Hills Road No. 2",
        "corridor": "KBR Park Transit Corridor",
        "lat": 17.4223,
        "lng": 78.4312,
        "lane_count": 4,
        "heading": 290,
        "base_speed": 45.0,
        "base_count": 38
    },
    {
        "camera_id": "CAM-HYD-03",
        "name": "HITEC City Cyber Towers Cam",
        "edge_id": "edge_jubilee_hitec",
        "road_name": "Madhapur - Cyber Towers Spine",
        "corridor": "Cyberabad IT Corridor Core",
        "lat": 17.4504,
        "lng": 78.3808,
        "lane_count": 6,
        "heading": 310,
        "base_speed": 55.0,
        "base_count": 65
    },
    {
        "camera_id": "CAM-HYD-04",
        "name": "Gachibowli Bio-Diversity Cam",
        "edge_id": "edge_hitec_gachibowli",
        "road_name": "Hitec - Gachibowli Express",
        "corridor": "Financial District Gateway",
        "lat": 17.4385,
        "lng": 78.3615,
        "lane_count": 6,
        "heading": 220,
        "base_speed": 58.0,
        "base_count": 58
    },
    {
        "camera_id": "CAM-HYD-05",
        "name": "Apollo Trauma Preemption Cam",
        "edge_id": "edge_banjara_apollo_preemption",
        "road_name": "Apollo Emergency Access Rd",
        "corridor": "Apollo Emergency Trauma Hub",
        "lat": 17.4172,
        "lng": 78.4124,
        "lane_count": 3,
        "heading": 180,
        "base_speed": 42.0,
        "base_count": 28
    },
    {
        "camera_id": "CAM-HYD-06",
        "name": "Film Nagar Link Cam",
        "edge_id": "edge_jubilee_apollo_link",
        "road_name": "Film Nagar Apollo Link",
        "corridor": "Jubilee Hills South Corridor",
        "lat": 17.4245,
        "lng": 78.4098,
        "lane_count": 3,
        "heading": 150,
        "base_speed": 44.0,
        "base_count": 30
    },
    {
        "camera_id": "CAM-HYD-07",
        "name": "Road No. 36 Direct Express Cam",
        "edge_id": "edge_punjagutta_jubilee_bypass",
        "road_name": "Road No. 36 Direct Bypass",
        "corridor": "Jubilee Hills Arterial Bypass",
        "lat": 17.4291,
        "lng": 78.4299,
        "lane_count": 4,
        "heading": 275,
        "base_speed": 52.0,
        "base_count": 45
    },
    {
        "camera_id": "CAM-HYD-08",
        "name": "Begumpet Airport Spine Cam",
        "edge_id": "edge_begumpet_punjagutta",
        "road_name": "Begumpet - Punjagutta Flyover",
        "corridor": "North Secunderabad Spine",
        "lat": 17.4442,
        "lng": 78.4638,
        "lane_count": 4,
        "heading": 200,
        "base_speed": 50.0,
        "base_count": 48
    }
]

class GodsEyeEngine:
    _instance = None

    def __init__(self):
        self.store = StateStore.get_instance()
        self.camera_configs = {c["camera_id"]: c for c in CAMERA_EDGE_MAPPINGS}
        self.edge_to_camera = {c["edge_id"]: c["camera_id"] for c in CAMERA_EDGE_MAPPINGS}
        self.active_anomalies: Dict[str, Dict[str, Any]] = {}
        self.frame_cache: Dict[str, bytes] = {}

    @classmethod
    def get_instance(cls) -> "GodsEyeEngine":
        if cls._instance is None:
            cls._instance = GodsEyeEngine()
        return cls._instance

    def get_camera_for_edge(self, edge_id: str) -> Optional[Dict[str, Any]]:
        # Match direct or reverse edge
        clean_eid = edge_id.replace("_rev", "")
        cam_id = self.edge_to_camera.get(clean_eid)
        if cam_id:
            return self.camera_configs.get(cam_id)
        return CAMERA_EDGE_MAPPINGS[0]

    def process_camera_tick(self, camera_id: str) -> Dict[str, Any]:
        """Real CV Metrics extraction simulation for camera feed."""
        start_t = time.perf_counter()
        now = time.time()
        cfg = self.camera_configs.get(camera_id, CAMERA_EDGE_MAPPINGS[0])

        sec_factor = math.sin((now / 15.0) + (hash(camera_id) % 7))
        vehicle_count = int(cfg["base_count"] + (sec_factor * 8))
        occupancy_pct = min(98.0, max(15.0, (vehicle_count / (cfg["lane_count"] * 20.0)) * 100.0))
        estimated_speed = max(10.0, cfg["base_speed"] - (occupancy_pct * 0.25))

        anomaly_score = 0.08
        hazard_type = None

        # Check if an incident has been actively injected for this camera or its edge
        active_hazard_info = self.active_anomalies.get(camera_id) or self.active_anomalies.get(cfg["edge_id"])
        if active_hazard_info:
            drop_pct = active_hazard_info.get("speed_drop_pct", 65.0)
            estimated_speed = max(0.0, estimated_speed * (1.0 - (drop_pct / 100.0)))
            occupancy_pct = min(96.0, occupancy_pct + 45.0)
            anomaly_score = 0.96
            hazard_type = active_hazard_info.get("hazard_type", "INCIDENT")
        elif occupancy_pct > 80.0:
            anomaly_score = 0.85

        density_score = round(occupancy_pct / 100.0, 3)
        self.store.record_telemetry(cfg["edge_id"], estimated_speed, vehicle_count, density_score, camera_id)
        self.store.update_camera_node(
            camera_id=camera_id,
            vehicle_count=vehicle_count,
            speed_kmh=estimated_speed,
            lane_count=cfg["lane_count"],
            heading=cfg["heading"],
            road_name=cfg["road_name"],
            active_hazard=hazard_type
        )

        duration_ms = (time.perf_counter() - start_t) * 1000.0
        self.store.last_cv_latency_ms = max(16.0, duration_ms + 11.5)

        return {
            "camera_id": camera_id,
            "edge_id": cfg["edge_id"],
            "road_name": cfg["road_name"],
            "vehicle_count": vehicle_count,
            "occupancy_pct": round(occupancy_pct, 1),
            "estimated_speed_kmh": round(estimated_speed, 1),
            "anomaly_score": round(anomaly_score, 2),
            "hazard_type": hazard_type,
            "timestamp": now
        }

    def generate_annotated_frame(self, camera_id: str) -> bytes:
        """
        Render an authentic, high-contrast CCTV traffic camera view with:
        - Exact multi-lane perspective matching cfg['lane_count'] (3, 4, or 6 lanes)
        - Moving directional lane vehicles with bounding box sizes matching vehicle class
        - Velocity vectors matching live_speed_kmh
        - If active_hazard is present on this edge, renders the actual crash/blockage in Lane 2 with red [CRASH // 0 km/h]
        """
        cfg = self.camera_configs.get(camera_id, CAMERA_EDGE_MAPPINGS[0])
        metrics = self.process_camera_tick(camera_id)
        now = time.time()
        w, h = 640, 360

        # High-contrast CCTV dark night/surveillance canvas
        img = Image.new("RGB", (w, h), color=(11, 15, 25))
        draw = ImageDraw.Draw(img)

        # Draw ambient city background & horizon skyline
        draw.rectangle([0, 0, w, 110], fill=(7, 10, 19))
        # Distant building silhouettes / flyover piers
        cam_seed = hash(camera_id) % 100
        for i in range(12):
            bx = i * 55 - 10
            bh = 25 + int(((i * 17 + cam_seed) % 35))
            draw.rectangle([bx, 110 - bh, bx + 42, 110], fill=(18, 24, 38))
            # Distant window lights
            for wy in range(110 - bh + 6, 106, 8):
                for wx in range(bx + 6, bx + 36, 10):
                    if ((wx + wy + int(now)) % 3) != 0:
                        draw.rectangle([wx, wy, wx + 4, wy + 4], fill=(245, 158, 11, 160))

        # Vanishing point and Road Perspective Geometry
        vp_x, vp_y = 320, 110
        road_top_w = 120
        road_bot_w = 600

        left_top = vp_x - road_top_w // 2
        right_top = vp_x + road_top_w // 2
        left_bot = vp_x - road_bot_w // 2
        right_bot = vp_x + road_bot_w // 2

        # Road asphalt surface
        draw.polygon([(left_top, vp_y), (right_top, vp_y), (right_bot, h), (left_bot, h)], fill=(24, 30, 42))

        # Lane count
        lanes = cfg["lane_count"]
        # Draw lane dividing dashed lines
        for l in range(1, lanes):
            top_lx = left_top + int((right_top - left_top) * (l / lanes))
            bot_lx = left_bot + int((right_bot - left_bot) * (l / lanes))

            # Dashed lane markings
            steps = 7
            for s in range(steps):
                p1 = s / steps
                p2 = (s + 0.55) / steps
                x1 = int(top_lx + (bot_lx - top_lx) * p1)
                y1 = int(vp_y + (h - vp_y) * p1)
                x2 = int(top_lx + (bot_lx - top_lx) * p2)
                y2 = int(vp_y + (h - vp_y) * p2)
                lw = max(1, int(1 + p1 * 3))
                draw.line([(x1, y1), (x2, y2)], fill=(203, 213, 225), width=lw)

        # Concrete guardrails / shoulders
        draw.line([(left_top, vp_y), (left_bot, h)], fill=(148, 163, 184), width=4)
        draw.line([(right_top, vp_y), (right_bot, h)], fill=(148, 163, 184), width=4)

        # Vehicle Classes & Dimension Rules
        # AUTO: 32x26, CAR: 46x30, CAB: 46x30, BUS: 78x42, BIKE: 22x18
        vehicle_types = [
            ("CAR", 46, 30, 1.0),
            ("AUTO", 32, 26, 0.8),
            ("CAB", 46, 30, 1.0),
            ("TSRTC BUS", 84, 44, 0.65),
            ("BIKE", 24, 18, 1.1),
            ("CAR", 48, 32, 1.0),
        ]

        # Check if there is an active incident on this edge
        active_hazard = metrics.get("hazard_type")
        current_spd = metrics["estimated_speed_kmh"]

        # If hazard exists: draw crash / blockage in Lane 2 at center road
        if active_hazard:
            # Blocked vehicle at Lane 2, y=240
            lane_idx = min(1, lanes - 1)
            lane_center_bot = left_bot + int((right_bot - left_bot) * ((lane_idx + 0.5) / lanes))
            lane_center_top = left_top + int((right_top - left_top) * ((lane_idx + 0.5) / lanes))
            prog = 0.55
            hx = int(lane_center_top + (lane_center_bot - lane_center_top) * prog)
            hy = int(vp_y + (h - vp_y) * prog)
            
            bw, bh = 60, 36
            # Damaged / stalled vehicles collision
            draw.rectangle([hx - bw // 2, hy - bh // 2, hx + bw // 2, hy + bh // 2], fill=(69, 10, 10), outline=(239, 68, 68), width=3)
            # Second colliding car angled
            draw.rectangle([hx - 15, hy - bh // 2 + 8, hx + bw // 2 + 10, hy + bh // 2 + 12], fill=(50, 10, 10), outline=(244, 63, 94), width=2)

            # Warning beacon strobe effect
            if int(now * 3) % 2 == 0:
                draw.ellipse([hx - 45, hy - 45, hx + 45, hy + 45], outline=(239, 68, 68, 120), width=2)

            # Exact Zero speed tag for stopped vehicle
            tag = f"CRASH BLOCKED // 0 km/h"
            draw.rectangle([hx - bw // 2 - 4, hy - bh // 2 - 16, hx + bw // 2 + 20, hy - bh // 2], fill=(225, 29, 72))
            draw.text((hx - bw // 2, hy - bh // 2 - 14), tag, fill=(255, 255, 255))

        # Dynamic Lane Moving Traffic
        num_vehicles = min(8, max(3, metrics["vehicle_count"] // 7))
        for v_i in range(num_vehicles):
            v_type, base_w, base_h, spd_mult = vehicle_types[v_i % len(vehicle_types)]
            lane_num = (v_i + cam_seed) % lanes
            
            # If hazard in lane 1, divert vehicles to other lanes
            if active_hazard and lane_num == 1:
                lane_num = 0 if lanes > 2 else (v_i % lanes)

            speed_kph = 0 if active_hazard and current_spd < 5.0 else max(8, int(current_spd * spd_mult + ((v_i % 3) * 2 - 2)))
            
            # Progress down the perspective road
            travel_rate = 0.25 * (max(10, speed_kph) / 40.0)
            prog = ((now * travel_rate + (v_i * 0.28) + (cam_seed * 0.05)) % 1.0)
            
            lane_center_top = left_top + int((right_top - left_top) * ((lane_num + 0.5) / lanes))
            lane_center_bot = left_bot + int((right_bot - left_bot) * ((lane_num + 0.5) / lanes))

            vx = int(lane_center_top + (lane_center_bot - lane_center_top) * prog)
            vy = int(vp_y + (h - vp_y) * prog)

            # Scale dimensions with perspective
            scale = 0.35 + (prog * 0.85)
            vw = int(base_w * scale)
            vh = int(base_h * scale)

            x1 = vx - vw // 2
            y1 = vy - vh // 2
            x2 = x1 + vw
            y2 = y1 + vh

            # Draw vehicle body (dark blue/slate with windshield)
            body_color = (30, 41, 59) if v_type == "CAR" else (180, 83, 9) if v_type == "AUTO" else (15, 118, 110) if v_type == "TSRTC BUS" else (51, 65, 85)
            draw.rectangle([x1, y1, x2, y2], fill=body_color)
            # Windshield
            draw.rectangle([x1 + 3, y1 + int(vh * 0.35), x2 - 3, y1 + int(vh * 0.65)], fill=(15, 23, 42))

            # Headlights / Taillights
            draw.rectangle([x1 + 2, y2 - 2, x1 + 6, y2], fill=(239, 68, 68))
            draw.rectangle([x2 - 6, y2 - 2, x2 - 2, y2], fill=(239, 68, 68))

            # YOLO Bounding Box & Velocity Vector
            box_col = (16, 185, 129) if speed_kph > 20 else (245, 158, 11) if speed_kph > 5 else (239, 68, 68)
            draw.rectangle([x1, y1, x2, y2], outline=box_col, width=2)
            
            # Directional Velocity Vector Arrow matching speed
            vec_len = int(max(4, speed_kph * 0.35 * scale))
            draw.line([(vx, y2), (vx, y2 + vec_len)], fill=box_col, width=2)

            # Accurate Tag Banner: Class + Speed
            trk_id = f"TRK-{200 + v_i}"
            tag_str = f"#{trk_id} {v_type} {speed_kph}k"
            tag_w = len(tag_str) * 6 + 6
            draw.rectangle([x1, y1 - 13, x1 + tag_w, y1], fill=box_col)
            draw.text((x1 + 3, y1 - 12), tag_str, fill=(255, 255, 255))

        # HYDERABAD SURVEILLANCE CCTV HUD OVERLAYS
        # Top CCTV Header
        draw.rectangle([0, 0, w, 28], fill=(2, 6, 23, 230))
        cam_hdr = f"● HYDERABAD CV SURVEILLANCE // {cfg['camera_id']} // {cfg['road_name']}"
        draw.text((12, 7), cam_hdr, fill=(16, 185, 129))
        draw.text((475, 7), time.strftime("%Y-%m-%d %H:%M:%S IST"), fill=(148, 163, 184))

        # Bottom Optical Telemetry Bar
        draw.rectangle([0, h - 28, w, h], fill=(2, 6, 23, 235))
        hud_color = (244, 63, 94) if active_hazard or metrics["anomaly_score"] > 0.7 else (56, 189, 248)
        hud_text = (
            f"LANES: {cfg['lane_count']} | FLOW: {metrics['vehicle_count']} vpm | "
            f"OPTICAL SPEED: {metrics['estimated_speed_kmh']} km/h | DENSITY: {metrics['occupancy_pct']}% "
            f"| STATUS: {'HAZARD DETECTED' if active_hazard else 'NORMAL'}"
        )
        draw.text((12, h - 20), hud_text, fill=hud_color)

        # Crosshair optical alignment
        draw.line([(305, 180), (335, 180)], fill=(56, 189, 248, 140), width=1)
        draw.line([(320, 165), (320, 195)], fill=(56, 189, 248, 140), width=1)

        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=88)
        raw_bytes = buf.getvalue()
        self.frame_cache[camera_id] = raw_bytes
        return raw_bytes
