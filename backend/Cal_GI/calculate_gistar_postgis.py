import geopandas as gpd
import pandas as pd
from sqlalchemy import create_engine, text
from esda.getisord import G_Local
from libpysal.weights import Queen


engine = create_engine("postgresql://{PG_USER}:{PG_PASSWORD}@{PG_HOST}:{PG_PORT}/{PG_DB}")  

sql = "SELECT * FROM population_by_hex_filled_table"
gdf = gpd.read_postgis(sql, engine, geom_col='geom')

age_columns = ['age_0_14', 'age_15_24', 'age_25_59', 'age_60_up']
gdf['total_population'] = gdf[age_columns].sum(axis=1)

w = Queen.from_dataframe(gdf)
w.transform = 'r'

target_columns = age_columns + ['total_population']

for col in target_columns:
    gi = G_Local(gdf[col], w)
    gdf[f'z_score_{col}'] = gi.Zs
    gdf[f'p_value_{col}'] = gi.p_sim


gdf = gdf.dropna(subset=['hex_id'])
gdf['hex_id'] = gdf['hex_id'].astype(int)


with engine.begin() as conn:
    for idx, row in gdf.iterrows():
        conn.execute(text("""
            UPDATE population_by_hex_filled_table
            SET 
                z_score_age_0_14 = :z0, p_value_age_0_14 = :p0,
                z_score_age_15_24 = :z1, p_value_age_15_24 = :p1,
                z_score_age_25_59 = :z2, p_value_age_25_59 = :p2,
                z_score_age_60_up = :z3, p_value_age_60_up = :p3,
                z_score_total_population = :zt, p_value_total_population = :pt
            WHERE hex_id = :h
        """), {
            "z0": float(row['z_score_age_0_14']),
            "p0": float(row['p_value_age_0_14']),
            "z1": float(row['z_score_age_15_24']),
            "p1": float(row['p_value_age_15_24']),
            "z2": float(row['z_score_age_25_59']),
            "p2": float(row['p_value_age_25_59']),
            "z3": float(row['z_score_age_60_up']),
            "p3": float(row['p_value_age_60_up']),
            "zt": float(row['z_score_total_population']),
            "pt": float(row['p_value_total_population']),
            "h": int(row['hex_id'])
        })

print("เขียนค่า Z-score และ p-value สำหรับทุกช่วงอายุ และรวมทั้งหมด กลับเข้าสู่ฐานข้อมูลสำเร็จแล้ว!")