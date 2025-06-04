const API_BASE = "https://miniproject-webmap.onrender.com";

export async function fetchHexPopulation() {
    try {
        console.log("🔍 Fetching hex population data...");
        const response = await fetch(`${API_BASE}/hex-population`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("✅ API Response:", data);
        return data;
    } catch (error) {
        console.error("❌ Error fetching data:", error);
        throw error;
    }
}

export async function fetchChartData() {
    try {
        console.log("🔍 Fetching chart data...");
        const response = await fetch(`${API_BASE}/district-population-chart`);  // ✅ แก้ตรงนี้
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("✅ Chart Data:", data);
        return data;
    } catch (error) {
        console.error("❌ Error fetching chart data:", error);
        throw error;
    }
}