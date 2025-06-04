from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import data

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000","https://mini-project-web-map-umber.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(data.router)