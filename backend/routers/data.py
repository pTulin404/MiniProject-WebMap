from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from db import SessionLocal
import json

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/hex-population")
def get_hex_population(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("""
            SELECT 
                hex_id, district_name, 
                age_0_14, age_15_24, age_25_59, age_60_up, 
                total_population,
                z_score_age_0_14, p_value_age_0_14,
                z_score_age_15_24, p_value_age_15_24,
                z_score_age_25_59, p_value_age_25_59,
                z_score_age_60_up, p_value_age_60_up,
                z_score_total_population, p_value_total_population,
                ST_AsGeoJSON(ST_Transform(geom, 4326)) AS geom
            FROM population_by_hex_filled_table
        """)).mappings()

        features = []
        for row in result:
            features.append({
                "type": "Feature",
                "geometry": json.loads(row["geom"]),
                "properties": {
                    "hex_id": row["hex_id"],
                    "district_name": row["district_name"],
                    "age_0_14": row["age_0_14"],
                    "age_15_24": row["age_15_24"],
                    "age_25_59": row["age_25_59"],
                    "age_60_up": row["age_60_up"],
                    "total_population": row["total_population"],
                    "z_score_age_0_14": row["z_score_age_0_14"],
                    "p_value_age_0_14": row["p_value_age_0_14"],
                    "z_score_age_15_24": row["z_score_age_15_24"],
                    "p_value_age_15_24": row["p_value_age_15_24"],
                    "z_score_age_25_59": row["z_score_age_25_59"],
                    "p_value_age_25_59": row["p_value_age_25_59"],
                    "z_score_age_60_up": row["z_score_age_60_up"],
                    "p_value_age_60_up": row["p_value_age_60_up"],
                    "z_score_total_population": row["z_score_total_population"],
                    "p_value_total_population": row["p_value_total_population"]
                }
            })
        return {"type": "FeatureCollection", "features": features}
    except Exception as e:
        print("ERROR (hex-population):", e)
        return {"error": str(e)}

@router.get("/district-population-chart")
def get_chart_data(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("SELECT district, population FROM district_population_chart")).mappings()
        data = []
        for row in result:
            data.append({
                "district": row["district"],
                "population": row["population"]
            })
        return data
    except Exception as e:
        print("\U0001F525 ERROR (chart):", e)
        return {"error": str(e)}