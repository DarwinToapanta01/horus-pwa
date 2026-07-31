import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import api from '../../api/axios';
import { IconLocation, IconComment } from '../../components/Icons';

const Comentarios = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [reporte, setReporte] = useState(null);
    const [comentarios, setComentarios] = useState([]);
    const [nuevoComentario, setNuevoComentario] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDatos();
    }, [id]);

    const fetchDatos = async () => {
        try {
            const resReporte = await api.get(`/reports/${id}`);
            const resComentarios = await api.get(`/reports/${id}/comments`);
            setReporte(resReporte.data);
            setComentarios(resComentarios.data);
        } catch (err) {
            console.error("Error al cargar datos");
        } finally {
            setLoading(false);
        }
    };

    const handlePostComment = async (e) => {
        e.preventDefault();
        if (!nuevoComentario.trim()) return;
        try {
            await api.post('/comments', {
                report_id: id,
                content: nuevoComentario
            });
            setNuevoComentario('');
            fetchDatos();
        } catch (err) {
            alert("Error al publicar comentario");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">Cargando comentarios...</p>
            </div>
        );
    }

    if (!reporte) return null;

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col">
            {/* Cabecera con Mapa */}
            <div className="h-64 w-full relative">
                <MapContainer
                    center={[reporte.latitude, reporte.longitude]}
                    zoom={16}
                    zoomControl={false}
                    className="h-full w-full"
                    style={{ filter: 'brightness(0.75) contrast(1.1)' }}
                >
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                    <Marker position={[reporte.latitude, reporte.longitude]} />
                </MapContainer>

                {/* Gradient sutil solo en los bordes */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-transparent to-transparent pointer-events-none"></div>

                {/* Botón volver - compacto */}
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-4 left-4 z-[1001] bg-slate-900/90 backdrop-blur-md border border-white/20 p-2.5 rounded-xl hover:bg-slate-800 transition-all active:scale-95 shadow-lg"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                </button>

                {/* Badge flotante con info mínima - esquina superior derecha */}
                <div className="absolute top-4 right-4 z-[1001] bg-slate-900/90 backdrop-blur-md border border-emerald-500/30 px-4 py-2 rounded-xl shadow-lg">
                    <div className="flex items-center gap-2">
                        <IconLocation className="w-5 h-5 text-emerald-400" />
                        <div>
                            <p className="text-xs font-black uppercase tracking-tight">Zona #{reporte.id}</p>
                            <p className="text-[9px] text-emerald-400 font-bold uppercase">✓ Verificada</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Barra de información debajo del mapa */}
            <div className="bg-slate-800/50 backdrop-blur-lg border-b border-white/10 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <p className="text-sm text-slate-300 font-medium line-clamp-1">{reporte.description}</p>
                    </div>
                    <div className="ml-4 text-[10px] bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full font-bold uppercase tracking-wider whitespace-nowrap">
                        {comentarios.length} {comentarios.length === 1 ? 'comentario' : 'comentarios'}
                    </div>
                </div>
            </div>

            {/* Listado de Comentarios */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 pb-32 bg-slate-900">
                {/* Luz de fondo sutil */}
                <div className="fixed top-1/2 right-0 w-64 h-64 bg-emerald-600/5 blur-[100px] pointer-events-none"></div>

                {comentarios.length === 0 ? (
                    <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-3xl text-center mt-8">
                        <div className="flex justify-center mb-4 opacity-50">
                            <IconComment className="w-12 h-12 text-slate-400" />
                        </div>
                        <p className="text-slate-400 text-sm font-medium">No hay testimonios aún.</p>
                        <p className="text-slate-500 text-xs mt-2">Sé el primero en compartir información sobre esta zona.</p>
                    </div>
                ) : (
                    comentarios.map((c, index) => (
                        <div
                            key={c.id}
                            className="bg-white/5 backdrop-blur-lg border border-white/10 p-5 rounded-3xl shadow-xl hover:border-emerald-500/20 transition-all relative"
                        >
                            <div className="flex gap-3 mb-3">
                                <div className="bg-emerald-500/10 border border-emerald-500/20 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-emerald-400 font-black text-sm">
                                        {(c.user_name || 'U').charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <span className="text-emerald-400 font-bold text-sm uppercase tracking-wide truncate">
                                            {c.user_name || 'Usuario'}
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                                            {new Date(c.created_at).toLocaleDateString('es-ES', {
                                                day: 'numeric',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-300 leading-relaxed font-medium">
                                        {c.content}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Input fijo abajo */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/95 backdrop-blur-xl border-t border-white/20 shadow-2xl z-50">
                <form onSubmit={handlePostComment} className="flex gap-3">
                    <input
                        type="text"
                        value={nuevoComentario}
                        onChange={(e) => setNuevoComentario(e.target.value)}
                        placeholder="Comparte información..."
                        className="flex-1 bg-slate-800/50 border border-slate-700 rounded-2xl px-5 py-4 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                    <button
                        type="submit"
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-8 rounded-2xl font-bold text-sm uppercase tracking-wide transition-all active:scale-95 shadow-lg shadow-emerald-900/20"
                    >
                        Enviar
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Comentarios;