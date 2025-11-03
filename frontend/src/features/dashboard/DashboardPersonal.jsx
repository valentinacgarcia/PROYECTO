import React, { useState, useEffect } from "react";
import {
  BarChart, Bar,
  XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell} from "recharts";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import "./DashboardPersonal.css";


const Heatmap = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !points?.length) return;

    const heatLayer = L.heatLayer(
      points.map(p => [p.lat, p.lon, p.intensidad]),
      { radius: 25, blur: 20, maxZoom: 17 }
    ).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
};

const DashboardPersonal = () => {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mesDesde, setMesDesde] = useState("Ene");
  const [mesHasta, setMesHasta] = useState("Oct");
  const [stats, setStats] = useState(null);


  useEffect(() => {
    setMounted(true);


    // ACA IRIA EL ENDPOINT 
    const fetchDashboardData = async () => {
      try {
        const response = await fetch("/api/dashboard/personal"); 
        if (!response.ok) throw new Error("Error al obtener datos del dashboard");
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Error cargando datos del dashboard:", error);
        setStats(mockData);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
    
  }, []);
  

  //ejemplo visual
  const mockData = {
    total: 8,
    enAdopcion: 3,
    adoptadas: 5,
    adopcionesMensuales: [
      { mes: "Ene", cantidad: 1 },
      { mes: "Feb", cantidad: 2 },
      { mes: "Mar", cantidad: 1 },
      { mes: "Abr", cantidad: 0 },
      { mes: "May", cantidad: 1 },
      { mes: "Jun", cantidad: 2 },
      { mes: "Jul", cantidad: 4 },
      { mes: "Ago", cantidad: 1 },
      { mes: "Sep", cantidad: 0 },
      { mes: "Oct", cantidad: 1 },
      { mes: "Nov", cantidad: 1 },
      { mes: "Dic", cantidad: 3 },
    ],
    porTamanio: [
      { tamanio: "Pequeño", valor: 4 },
      { tamanio: "Mediano", valor: 3 },
      { tamanio: "Grande", valor: 1 },
    ],
    porGenero: [
      { genero: "Macho", valor: 5 },
      { genero: "Hembra", valor: 3 },
    ],
    ultimaMascota: { name: "Luna", fecha: "2025-10-28" },
    tasaExitoGlobal: 68,
    tasaExitoPropia: 62,
    engagementRate: 18, 
    duracionPromedio: 12.5, 
    zonasAdopcion: [
      { lat: -31.42, lon: -64.18, intensidad: 10 },
      { lat: -31.43, lon: -64.20, intensidad: 8 },
      { lat: -31.41, lon: -64.22, intensidad: 5 },
      { lat: -31.44, lon: -64.21, intensidad: 6 },
    ],
  };

  
  const data = stats || mockData;

  const COLORS = ["#53a57d", "#f1b89b"];

  // filtro
  const meses = data.adopcionesMensuales.map(d => d.mes);
  const indiceDesde = meses.indexOf(mesDesde);
  const indiceHasta = meses.indexOf(mesHasta);
  const adopcionesFiltradas = data.adopcionesMensuales.slice(indiceDesde, indiceHasta + 1);

  if (!mounted || loading) {
    return <p style={{ textAlign: "center" }}>Cargando dashboard...</p>;
  }

  return (
    <div className="dashboard-personal-container">
      <h2 className="dashboard-title">Mis Mascotas en Adopción</h2>

      {/*Filtro de meses */}
      <div className="filtro-mes">
        <label>
          Desde:
          <select value={mesDesde} onChange={(e) => setMesDesde(e.target.value)}>
            {meses.map((mes) => (
              <option key={mes} value={mes}>{mes}</option>
            ))}
          </select>
        </label>
        <label>
          Hasta:
          <select value={mesHasta} onChange={(e) => setMesHasta(e.target.value)}>
            {meses.map((mes) => (
              <option key={mes} value={mes}>{mes}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Estadísticas  */}
      <div className="stats-grid-horizontal">
        <div className="stat-card"><h3>Total Mascotas</h3><p>{data.total}</p></div>
        <div className="stat-card"><h3>En Adopción</h3><p>{data.enAdopcion}</p></div>
        <div className="stat-card"><h3>Adoptadas</h3><p>{data.adoptadas}</p></div>
        <div className="stat-card">
          <h3>Última Mascota</h3>
          <p>{data.ultimaMascota.name}</p>
          <small>{data.ultimaMascota.fecha}</small>
        </div>
        <div className="stat-card">
          <h3>% Adopciones Exitosas</h3>
          <p>{((data.adoptadas / data.total) * 100).toFixed(0)}%</p>
        </div>
      </div>

      {/* Métricas adicionales */}
      <div className="stats-grid-horizontal advanced-metrics">
        <div className="stat-card">
          <h3>Tasa de Éxito Global</h3>
          <p>{data.tasaExitoGlobal}%</p>
          <small>En toda la plataforma</small>
        </div>
        <div className="stat-card">
          <h3>Tasa de Éxito Propia</h3>
          <p>{data.tasaExitoPropia}%</p>
          <small>Tus publicaciones</small>
        </div>
        <div className="stat-card">
          <h3>Promedio de Duración</h3>
          <p>{data.duracionPromedio} días</p>
        </div>
      </div>

      {/* Gráficos principales */}
      <div className="charts-row">
        {/* Adopciones mensuales */}
        <div className="chart-large">
          <h3>Adopciones por Mes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={adopcionesFiltradas}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="cantidad" fill="#53a57d" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tamaño y género */}
        <div className="chart-small-column">
          <div className="chart-card">
            <h3>Distribución por Tamaño</h3>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={data.porTamanio}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tamanio" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="valor" fill="#53a57d" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>Distribución por Género</h3>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie
                  data={data.porGenero}
                  dataKey="valor"
                  nameKey="genero"
                  outerRadius={50}
                  label
                >
                  {data.porGenero.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Engagement circular + Mapa */}
      <div className="charts-row">
        {/* Engagement circular */}
        <div className="chart-card engagement-card">
          <h3>Engagement de Publicaciones</h3>
          <div className="circular-container">
            <div
              className="circular-progress"
              style={{
                background: `conic-gradient(#53a57d ${data.engagementRate * 3.6}deg, #e6e6e6 0deg)`
              }}
            >
              <div className="circular-inner">
                <p>{data.engagementRate}%</p>
                <small>de vistas terminaron en adopción</small>
              </div>
            </div>
          </div>
        </div>

        {/* Mapa de calor */}
        <div className="chart-large">
          <h3>Zonas con Mayor Cantidad de Adopciones</h3>
          <MapContainer
            center={[-31.42, -64.19]}
            zoom={13}
            style={{ height: "300px", width: "100%", borderRadius: "12px" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="© OpenStreetMap contributors"
            />
            <Heatmap points={data.zonasAdopcion} />
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardPersonal;
