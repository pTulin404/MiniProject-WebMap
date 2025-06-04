import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { fetchHexPopulation, fetchChartData } from '../api/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { interpolateViridis } from "d3-scale-chromatic";

export default function DemographicsDashboard() {
  const [hexData, setHexData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [selectedAgeGroups, setSelectedAgeGroups] = useState({
    age_0_14: true,
    age_15_24: true,
    age_25_59: true,
    age_60_up: true
  });
  const [excludedDistricts, setExcludedDistricts] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedZone, setSelectedZone] = useState("");
  const [displayMode, setDisplayMode] = useState("gi");
  const mapRef = useRef();
  const zoneMapping = {
    inner: ["เขตพระนคร", "เขตป้อมปราบศัตรูพ่าย", "เขตสัมพันธวงศ์", "เขตดุสิต", "เขตปทุมวัน", "เขตพญาไท", "เขตบางรัก", "เขตสาทร", "เขตบางคอแหลม", "เขตคลองสาน", "เขตธนบุรี", "เขตบางกอกใหญ่"],
    middle: ["เขตจตุจักร", "เขตห้วยขวาง", "เขตวังทองหลาง", "เขตลาดพร้าว", "เขตบางเขน", "เขตดินแดง", "เขตบางซื่อ", "เขตวัฒนา", "เขตบางนา", "เขตคลองเตย", "เขตบางกะปิ", "เขตพระโขนง"],
    outer: ["เขตหนองจอก", "เขตมีนบุรี", "เขตลาดกระบัง", "เขตบางแค", "เขตสะพานสูง", "เขตสายไหม", "เขตประเวศ", "เขตบางบอน", "เขตบางขุนเทียน", "เขตทวีวัฒนา", "เขตตลิ่งชัน", "เขตหนองแขม", "เขตหลักสี่", "เขตบึงกุ่ม", "เขตคลองสามวา", "เขตคันนายาว", "เขตจอมทอง", "เขตราษฎร์บูรณะ", "เขตทุ่งครุ", "เขตบางพลัด", "เขตภาษีเจริญ"]
  };

  useEffect(() => {
    fetchHexPopulation().then(setHexData).catch(console.error);
    fetchChartData().then(setChartData).catch(console.error);
  }, []);

  useEffect(() => {
    if (hexData) {
      const uniqueDistricts = [...new Set(hexData.features.map(f => f.properties.district_name).filter(Boolean))].sort();
      setDistricts(uniqueDistricts);
    }
  }, [hexData]);

  const getSelectedAgeValue = (props) => {
    return Object.entries(selectedAgeGroups)
      .filter(([key, checked]) => checked)
      .reduce((sum, [key]) => sum + props[key], 0);
  };

  const filterFeatures = (feature) => {
    const d = feature.properties.district_name;
    if (excludedDistricts.includes(d)) return false;
    if (selectedZone && !zoneMapping[selectedZone]?.includes(d)) return false;
    return true;
  };

  const style = (feature) => {
    const props = feature.properties;
    const selectedAgeKeys = Object.entries(selectedAgeGroups).filter(([_, checked]) => checked).map(([key]) => key);
    let z = null;
    let p = null;
  
    if (displayMode === "gi") {
      if (selectedAgeKeys.length === 1) {
        const ageKey = selectedAgeKeys[0];
        z = props[`z_score_${ageKey}`];
        p = props[`p_value_${ageKey}`];
      } else {
        z = props["z_score_total_population"];
        p = props["p_value_total_population"];
      }
  
      if (z >= 2.58 && p <= 0.01) {
        return { fillColor: '#800026', weight: 1, color: 'white', fillOpacity: 0.7 };
      } else if (z >= 1.96 && z < 2.58 && p <= 0.05) {
        return { fillColor: '#fc4e2a', weight: 1, color: 'white', fillOpacity: 0.7 };
      } else if (z >= 1.65 && z < 1.96 && p <= 0.10) {
        return { fillColor: '#feb24c', weight: 1, color: 'white', fillOpacity: 0.7 };
      } else if (z <= -2.58 && p <= 0.01) {
        return { fillColor: '#08306b', weight: 1, color: 'white', fillOpacity: 0.7 };
      } else if (z <= -1.96 && z > -2.58 && p <= 0.05) {
        return { fillColor: '#2171b5', weight: 1, color: 'white', fillOpacity: 0.7 };
      } else if (z <= -1.65 && z > -1.96 && p <= 0.10) {
        return { fillColor: '#6baed6', weight: 1, color: 'white', fillOpacity: 0.7 };
      } else {
        return { fillColor: '#ffffff', weight: 1, color: '#ccc', fillOpacity: 0.7 }; 
      }
    } else {
      const selectedVal = getSelectedAgeValue(props);
      const values = hexData.features.map(f => getSelectedAgeValue(f.properties));
      const max = Math.max(...values);
      const normalized = selectedVal / max;
      return {
        fillColor: interpolateViridis(normalized),
        weight: 1,
        color: 'white',
        fillOpacity: 0.8
      };
    }
  };
  

  const onEachFeature = (feature, layer) => {
    const props = feature.properties;
    let popupContent = `<strong>เขต: ${props.district_name}</strong><br/>`;
    Object.entries(selectedAgeGroups).forEach(([key, selected]) => {
      if (selected) popupContent += `${key.replace('age_', '').replace('_', '-').replace('60', '60+')}: ${props[key]}<br/>`;
    });
    if (props.z_score !== undefined && props.p_value !== undefined) {
      popupContent += `<strong>Z-score:</strong> ${props.z_score.toFixed(2)}<br/><strong>p-value:</strong> ${props.p_value.toFixed(4)}`;
    }
    layer.bindPopup(popupContent);
  };
  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif",
    background: "linear-gradient(to right,rgb(204, 231, 231),rgb(196, 207, 255))",
    padding: "1rem" }}>
      <div style={{
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background: "linear-gradient(to right,rgb(246, 255, 194),rgb(255, 255, 255))",
  padding: "1rem 2rem",
  borderRadius: "8px",
  marginBottom: "1rem",
  boxShadow: "0 2px 6px rgba(0,0,0,0.08)"
}}>
  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
  <img
    src="https://cdn-icons-png.flaticon.com/512/854/854878.png"
    alt="map icon"
    style={{ width: "70px", height: "75px" }}
  />
  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start"}}>
    <h1 style={{
      fontSize: "1.5rem",
      fontWeight: "bold",
      margin: 0,
      color: "#2563eb",
      lineHeight: "1.2"
    }}>
      AGE FOUNDER
    </h1>
    <p style={{
      margin: 0,
      fontSize: "0.85rem",
      color: "#555"
    }}>
      Visualizing age-specific population clusters with Getis-Ord Gi*
    </p>
  </div>
</div>
</div>
      <div style={{ display: "flex", flexDirection: "row" }}>
  <div style={{ flex: 3, position: "relative" , minWidth:"0"}}>
    <MapContainer
      center={[13.7563, 100.5018]}
      zoom={10}
      style={{ height: "700px", width: "100%" }}
      scrollWheelZoom={true}
      minZoom={9}
      maxZoom={14}
      whenCreated={(map) => {
        mapRef.current = map;
      }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      {hexData && (
        <GeoJSON
          key={selectedZone + displayMode + Object.values(selectedAgeGroups).join()}
          data={{
            type: "FeatureCollection",
            features: hexData.features.filter(filterFeatures),
          }}
          style={style}
          onEachFeature={onEachFeature}
        />
      )}
    </MapContainer>

{displayMode === "gi" && (
  <div style={{
    position: "absolute",
    bottom: "10px",
    left: "15px",
    background: "white",
    padding: "1rem",
    borderRadius: "8px",
    fontSize: "0.8rem",
    lineHeight: "1.5",
    boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
    zIndex: 1000,
    maxWidth: "300px"
  }}>
    <div style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>คำอธิบายแผนที่ (Gi*)</div>
    {[
      { color: "#08306b", label: "Coldspot 99% Confidence" },
      { color: "#2171b5", label: "Coldspot 95% Confidence" },
      { color: "#6baed6", label: "Coldspot 90% Confidence" },
      { color: "#ffffff", label: "Not Significant" },
      { color: "#feb24c", label: "Hotspot 90% Confidence" },
      { color: "#fc4e2a", label: "Hotspot 95% Confidence" },
      { color: "#800026", label: "Hotspot 99% Confidence" },
    ].map((item, idx) => (
      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <div style={{ width: 20, height: 20, background: item.color, border: "1.5px solid #999" }}></div>
        <span>{item.label}</span>
      </div>
    ))}
  </div>
)}

{displayMode === "age" && (
  <div style={{
    position: "absolute",
    bottom: "10px",
    left: "10px",
    background: "white",
    padding: "0.8rem",
    borderRadius: "8px",
    fontSize: "0.8rem",
    lineHeight: "1.5",
    boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
    zIndex: 1000,
    maxWidth: "230px"
  }}>
    <div style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>คำอธิบายแผนที่ (ความหนาแน่นประชากร)</div>
    {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
      <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
        <div style={{
          width: 20,
          height: 20,
          background: interpolateViridis(v),
          border: "1px solid #999"
        }}
        ></div>
        <span>
          {v === 0
            ? "ความหนาแน่นน้อยที่สุด"
            : v === 0.25
            ? "ความหนาแน่นน้อย"
            : v === 0.5
            ? "ความหนาแน่นปานกลาง"
            : v === 0.75
            ? "ความหนาแน่นมาก"
            : "ความหนาแน่นมากที่สุด"}
        </span>
        </div>
        ))}
        </div>
        )}
</div>
<div style={{
  flex: 1,
  backgroundColor: "white",
  padding: "1rem",
  paddingBottom: "1.5rem", 
  borderRadius: "8px",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  minWidth: "300px",
  maxHeight: "auto",
  overflowY: "visible", 
  marginLeft: "1rem",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-start"
}}>
  <h2 style={{
    fontSize: "1.3rem",
    marginBottom: "1.5rem",
    textAlign: "center",
    backgroundColor: "#f9fafb",
    padding: "0.75rem 1rem",
    borderRadius: "12px",
    border: "1px solid #ccc",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    width: "90%",
    display: "inline-block",
    background: "linear-gradient(to right,rgb(246, 255, 194),rgb(255, 255, 255))",
    color: "#2563eb"
  }}>🧭 ตัวกรองข้อมูล</h2>

  <div style={{ marginBottom: "1rem" }}>
    <label>📊 โหมดแสดงผล</label>
    <select value={displayMode} onChange={(e) => setDisplayMode(e.target.value)} style={{ width: "100%", marginTop: "0.5rem" }}>
      <option value="gi">แสดงแบบ Getis-Ord Gi*</option>
      <option value="age">แสดงความหนาแน่นประชากรตามกลุ่มอายุ</option>
    </select>
  </div>

  <div style={{ marginBottom: "1rem" }}>
    <label>🗺️ โซนกรุงเทพมหานคร</label>
    <select value={selectedZone} onChange={(e) => { setSelectedZone(e.target.value); setExcludedDistricts([]); }} style={{ width: "100%", marginTop: "0.5rem" }}>
      <option value="">-- แสดงทั้งหมด --</option>
      <option value="inner">กรุงเทพชั้นใน</option>
      <option value="middle">กรุงเทพชั้นกลาง</option>
      <option value="outer">กรุงเทพชั้นนอก</option>
    </select>
  </div>

  <div style={{ marginBottom: "1rem" }}>
    <label>📍 เขต</label>
    <div style={{
      maxHeight: "250px",
      overflowY: "auto",
      border: "1px solid #ddd",
      borderRadius: "6px",
      padding: "0.5rem",
      marginTop: "0.5rem"
    }}>
      {districts
        .filter(d => !selectedZone || zoneMapping[selectedZone]?.includes(d))
        .map((district, idx) => (
          <div
            key={idx}
            onClick={() => setExcludedDistricts(prev =>
              prev.includes(district)
                ? prev.filter(d => d !== district)
                : [...prev, district]
            )}
            style={{
              cursor: "pointer",
              textDecoration: excludedDistricts.includes(district) ? "line-through" : "none",
              opacity: excludedDistricts.includes(district) ? 0.5 : 1,
              marginBottom: "0.4rem"
            }}
          >
            {district}
          </div>
        ))}
    </div>
  </div>

<div style={{ marginTop: "1rem" }}>
  <label style={{ display: "block",marginBottom: "0.5rem" }}>
    👤 กลุ่มอายุ
  </label>
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "0.5rem",
      border: "1px solid #ddd",
      borderRadius: "6px",
      padding: "0.75rem",
      background: "#f9fafb"
    }}
  >
    <label>
      <input
        type="checkbox"
        checked={selectedAgeGroups.age_0_14}
        onChange={() =>
          setSelectedAgeGroups((prev) => ({ ...prev, age_0_14: !prev.age_0_14 }))
        }
      />{" "}
      อายุน้อยกว่า 1 ถึง 14 ปี
    </label>

    <label>
      <input
        type="checkbox"
        checked={selectedAgeGroups.age_15_24}
        onChange={() =>
          setSelectedAgeGroups((prev) => ({ ...prev, age_15_24: !prev.age_15_24 }))
        }
      />{" "}
      อายุ 15 ถึง 24 ปี
    </label>

    <label>
      <input
        type="checkbox"
        checked={selectedAgeGroups.age_25_59}
        onChange={() =>
          setSelectedAgeGroups((prev) => ({ ...prev, age_25_59: !prev.age_25_59 }))
        }
      />{" "}
      อายุ 25 ถึง 59 ปี
    </label>

    <label>
      <input
        type="checkbox"
        checked={selectedAgeGroups.age_60_up}
        onChange={() =>
          setSelectedAgeGroups((prev) => ({ ...prev, age_60_up: !prev.age_60_up }))
        }
      />{" "}
      อายุ 60 ปีขึ้นไป
    </label>
  </div>
</div>
</div>

</div>
  <div style={{ marginTop: "0.5rem",
        background: "white",
        padding: "1rem",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
    <h2 style={{ fontSize: "1rem",
        fontWeight: "bold",
        marginBottom: "1rem" }}>แผนภูมิประชากร</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData.filter(d => !excludedDistricts.includes(d.district)).filter(d => !selectedZone || zoneMapping[selectedZone]?.includes(d.district))}>
            <XAxis dataKey="district" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="population" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
  </div>

      <div style={{ textAlign: "center",
        padding: "1rem",
        marginTop: "2rem",
        borderTop: "1px solid #eee",
        color: "#666",
        fontSize: "0.85rem" }}>
        © {new Date().getFullYear()} เว็บไซต์นี้สร้างขึ้นเพื่อโครงงานวิชา Spatial Statistics Analysis (ภมส441), Spatial database (ภมส442) และ Geospatial Visualization (ภมส443)
      </div>
    </div>
  );
}