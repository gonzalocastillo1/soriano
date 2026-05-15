import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { signOut, createUserWithEmailAndPassword } from "firebase/auth";

function PanelAdmin() {
  const [seccion, setSeccion] = useState("reclamos");
  const [reclamos, setReclamos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [areas, setAreas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [fotoAmpliada, setFotoAmpliada] = useState(null);
  const [filtro, setFiltro] = useState("todos");

  // Modales
  const [modalCategoria, setModalCategoria] = useState(null);
  const [modalArea, setModalArea] = useState(null);
  const [modalUsuario, setModalUsuario] = useState(null);

  // Forms
  const [formCategoria, setFormCategoria] = useState({ nombre: "", icono: "📋" });
  const [formArea, setFormArea] = useState({ nombre: "", categoriaId: "" });
  const [formUsuario, setFormUsuario] = useState({ nombre: "", email: "", password: "", rol: "encargado", categoriaId: "", areaId: "" });

  useEffect(() => {
    const unsubReclamos = onSnapshot(collection(db, "reclamos"), (snap) => {
      const datos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      datos.sort((a, b) => b.fecha?.toMillis() - a.fecha?.toMillis());
      setReclamos(datos);
    });
    const unsubCategorias = onSnapshot(collection(db, "categorias"), (snap) => {
      setCategorias(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    const unsubAreas = onSnapshot(collection(db, "areas"), (snap) => {
      setAreas(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    const unsubUsuarios = onSnapshot(collection(db, "usuarios"), (snap) => {
      setUsuarios(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubReclamos(); unsubCategorias(); unsubAreas(); unsubUsuarios(); };
  }, []);

  const eliminarReclamo = async (id) => {
    if (confirm("¿Eliminár este reclamo?")) await deleteDoc(doc(db, "reclamos", id));
  };

  // CATEGORIAS
  const guardarCategoria = async () => {
    if (!formCategoria.nombre) return alert("Ingresá un nombre");
    if (modalCategoria?.id) {
      await updateDoc(doc(db, "categorias", modalCategoria.id), formCategoria);
    } else {
      await addDoc(collection(db, "categorias"), formCategoria);
    }
    setModalCategoria(null);
    setFormCategoria({ nombre: "", icono: "📋" });
  };

  const eliminarCategoria = async (id) => {
    if (confirm("¿Eliminar esta categoría?")) await deleteDoc(doc(db, "categorias", id));
  };

  // AREAS
  const guardarArea = async () => {
    if (!formArea.nombre || !formArea.categoriaId) return alert("Completá todos los campos");
    if (modalArea?.id) {
      await updateDoc(doc(db, "areas", modalArea.id), formArea);
    } else {
      await addDoc(collection(db, "areas"), formArea);
    }
    setModalArea(null);
    setFormArea({ nombre: "", categoriaId: "" });
  };

  const eliminarArea = async (id) => {
    if (confirm("¿Eliminar esta área?")) await deleteDoc(doc(db, "areas", id));
  };

  // USUARIOS
  const guardarUsuario = async () => {
    if (!formUsuario.nombre || !formUsuario.email) return alert("Completá todos los campos");
    try {
      if (!modalUsuario?.id) {
        if (!formUsuario.password) return alert("Ingresá una contraseña");
        await createUserWithEmailAndPassword(auth, formUsuario.email, formUsuario.password);
      }
      await setDoc(doc(db, "usuarios", formUsuario.email), {
        nombre: formUsuario.nombre,
        email: formUsuario.email,
        rol: formUsuario.rol,
        categoriaId: formUsuario.categoriaId,
        areaId: formUsuario.areaId,
      });
      setModalUsuario(null);
      setFormUsuario({ nombre: "", email: "", password: "", rol: "encargado", categoriaId: "", areaId: "" });
    } catch (e) {
      alert("Error: " + e.message);
    }
  };

  const eliminarUsuario = async (id) => {
    if (confirm("¿Eliminar este usuario?")) await deleteDoc(doc(db, "usuarios", id));
  };

  const estadoConfig = {
    pendiente: { bg: "bg-yellow-100", texto: "text-yellow-800", label: "Pendiente" },
    asignado: { bg: "bg-orange-100", texto: "text-orange-800", label: "Asignado" },
    "en proceso": { bg: "bg-blue-100", texto: "text-blue-800", label: "En proceso" },
    verificar: { bg: "bg-purple-100", texto: "text-purple-800", label: "Por verificar" },
    resuelto: { bg: "bg-green-100", texto: "text-green-800", label: "Resuelto" },
  };

  const reclamosFiltrados = filtro === "todos" ? reclamos : reclamos.filter((r) => r.estado === filtro);

  const secciones = [
    { id: "reclamos", label: "Reclamos", icono: "📋" },
    { id: "categorias", label: "Categorías", icono: "🏷️" },
    { id: "areas", label: "Áreas", icono: "📍" },
    { id: "usuarios", label: "Usuarios", icono: "👥" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest">Panel</p>
          <h1 className="text-xl font-bold text-gray-800">Administrador</h1>
        </div>
        <button onClick={() => signOut(auth)} className="text-sm text-gray-400 hover:text-red-500 transition font-medium">
          Cerrar sesión
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-4">
        <div className="max-w-4xl mx-auto flex gap-1 overflow-x-auto">
          {secciones.map((s) => (
            <button key={s.id} onClick={() => setSeccion(s.id)}
              className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition ${seccion === s.id ? "border-teal-500 text-teal-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              style={{borderColor: seccion === s.id ? "#3dbfbf" : "transparent", color: seccion === s.id ? "#3dbfbf" : ""}}>
              {s.icono} {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* RECLAMOS */}
        {seccion === "reclamos" && (
          <div>
            <div className="grid grid-cols-5 gap-2 mb-6">
              {["todos", "pendiente", "asignado", "en proceso", "resuelto"].map((estado) => (
                <div key={estado} onClick={() => setFiltro(estado)}
                  className="rounded-xl p-3 text-center cursor-pointer transition shadow-sm"
                  style={{backgroundColor: filtro === estado ? "#3dbfbf" : "white"}}>
                  <p className="text-xl font-black" style={{color: filtro === estado ? "white" : "#3dbfbf"}}>
                    {estado === "todos" ? reclamos.length : reclamos.filter(r => r.estado === estado).length}
                  </p>
                  <p className="text-xs capitalize" style={{color: filtro === estado ? "white" : "#6b7280"}}>{estado}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              {reclamosFiltrados.map((r) => (
                <div key={r.id} className="bg-white rounded-2xl shadow-sm p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-gray-800">{r.nombre}</p>
                      <p className="text-sm text-gray-400">📞 {r.telefono}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${estadoConfig[r.estado]?.bg} ${estadoConfig[r.estado]?.texto}`}>
                        {estadoConfig[r.estado]?.label}
                      </span>
                      <button onClick={() => eliminarReclamo(r.id)}
                        className="text-gray-300 hover:text-red-500 transition text-lg">🗑</button>
                    </div>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{r.categoria}</span>
                  <p className="text-sm text-gray-600 mt-2">{r.descripcion}</p>
                  {r.fotos && r.fotos.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-2">
                      {r.fotos.map((url, i) => (
                        <img key={i} src={url} onClick={() => setFotoAmpliada(url)}
                          className="w-16 h-16 object-cover rounded-xl cursor-pointer hover:opacity-80 transition" />
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-300 mt-2">{r.fecha?.toDate().toLocaleString("es-UY")}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CATEGORIAS */}
        {seccion === "categorias" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">Categorías</h2>
              <button onClick={() => { setModalCategoria({}); setFormCategoria({ nombre: "", icono: "📋" }); }}
                className="text-sm px-4 py-2 rounded-xl text-white font-semibold" style={{backgroundColor: "#3dbfbf"}}>
                + Nueva categoría
              </button>
            </div>
            <div className="space-y-3">
              {categorias.map((cat) => (
                <div key={cat.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{cat.icono}</span>
                    <p className="font-semibold text-gray-800">{cat.nombre}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setModalCategoria(cat); setFormCategoria({ nombre: cat.nombre, icono: cat.icono }); }}
                      className="text-sm px-3 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
                      Editar
                    </button>
                    <button onClick={() => eliminarCategoria(cat.id)}
                      className="text-sm px-3 py-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition">
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AREAS */}
        {seccion === "areas" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">Áreas específicas</h2>
              <button onClick={() => { setModalArea({}); setFormArea({ nombre: "", categoriaId: "" }); }}
                className="text-sm px-4 py-2 rounded-xl text-white font-semibold" style={{backgroundColor: "#3dbfbf"}}>
                + Nueva área
              </button>
            </div>
            {categorias.map((cat) => {
              const areasCat = areas.filter(a => a.categoriaId === cat.id);
              return (
                <div key={cat.id} className="mb-6">
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">{cat.icono} {cat.nombre}</p>
                  {areasCat.length === 0 && <p className="text-sm text-gray-400 ml-2">Sin áreas cargadas</p>}
                  <div className="space-y-2">
                    {areasCat.map((area) => (
                      <div key={area.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
                        <p className="font-semibold text-gray-800">{area.nombre}</p>
                        <div className="flex gap-2">
                          <button onClick={() => { setModalArea(area); setFormArea({ nombre: area.nombre, categoriaId: area.categoriaId }); }}
                            className="text-sm px-3 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
                            Editar
                          </button>
                          <button onClick={() => eliminarArea(area.id)}
                            className="text-sm px-3 py-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition">
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* USUARIOS */}
        {seccion === "usuarios" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">Usuarios</h2>
              <button onClick={() => { setModalUsuario({}); setFormUsuario({ nombre: "", email: "", password: "", rol: "encargado", categoriaId: "", areaId: "" }); }}
                className="text-sm px-4 py-2 rounded-xl text-white font-semibold" style={{backgroundColor: "#3dbfbf"}}>
                + Nuevo usuario
              </button>
            </div>
            {["encargado", "ejecutor"].map((rol) => (
              <div key={rol} className="mb-6">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">
                  {rol === "encargado" ? "👔 Encargados" : "🔧 Ejecutores"}
                </p>
                <div className="space-y-2">
                  {usuarios.filter(u => u.rol === rol).map((u) => {
                    const cat = categorias.find(c => c.id === u.categoriaId);
                    const area = areas.find(a => a.id === u.areaId);
                    return (
                      <div key={u.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-800">{u.nombre || u.email}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                          {cat && <p className="text-xs text-gray-500 mt-0.5">📁 {cat.nombre} {area ? `→ ${area.nombre}` : ""}</p>}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setModalUsuario(u); setFormUsuario({ nombre: u.nombre || "", email: u.email, password: "", rol: u.rol, categoriaId: u.categoriaId || "", areaId: u.areaId || "" }); }}
                            className="text-sm px-3 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
                            Editar
                          </button>
                          <button onClick={() => eliminarUsuario(u.id)}
                            className="text-sm px-3 py-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition">
                            Eliminar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL CATEGORIA */}
      {modalCategoria && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{modalCategoria.id ? "Editar" : "Nueva"} categoría</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre</label>
                <input value={formCategoria.nombre} onChange={e => setFormCategoria({...formCategoria, nombre: e.target.value})}
                  placeholder="Ej: Alumbrado público"
                  className="w-full border-2 rounded-xl px-4 py-3 text-sm focus:outline-none"
                  style={{borderColor: "#3dbfbf"}} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Ícono (emoji)</label>
                <input value={formCategoria.icono} onChange={e => setFormCategoria({...formCategoria, icono: e.target.value})}
                  placeholder="Ej: 💡"
                  className="w-full border-2 rounded-xl px-4 py-3 text-sm focus:outline-none"
                  style={{borderColor: "#3dbfbf"}} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={guardarCategoria}
                className="flex-1 py-2 rounded-xl text-white font-semibold" style={{backgroundColor: "#3dbfbf"}}>
                Guardar
              </button>
              <button onClick={() => setModalCategoria(null)}
                className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-600 font-semibold">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AREA */}
      {modalArea && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{modalArea.id ? "Editar" : "Nueva"} área</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre del área</label>
                <input value={formArea.nombre} onChange={e => setFormArea({...formArea, nombre: e.target.value})}
                  placeholder="Ej: Zona Norte"
                  className="w-full border-2 rounded-xl px-4 py-3 text-sm focus:outline-none"
                  style={{borderColor: "#3dbfbf"}} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Categoría</label>
                <select value={formArea.categoriaId} onChange={e => setFormArea({...formArea, categoriaId: e.target.value})}
                  className="w-full border-2 rounded-xl px-4 py-3 text-sm focus:outline-none"
                  style={{borderColor: "#3dbfbf"}}>
                  <option value="">Seleccioná una categoría</option>
                  {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={guardarArea}
                className="flex-1 py-2 rounded-xl text-white font-semibold" style={{backgroundColor: "#3dbfbf"}}>
                Guardar
              </button>
              <button onClick={() => setModalArea(null)}
                className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-600 font-semibold">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL USUARIO */}
      {modalUsuario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{modalUsuario.id ? "Editar" : "Nuevo"} usuario</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre</label>
                <input value={formUsuario.nombre} onChange={e => setFormUsuario({...formUsuario, nombre: e.target.value})}
                  placeholder="Nombre completo"
                  className="w-full border-2 rounded-xl px-4 py-3 text-sm focus:outline-none"
                  style={{borderColor: "#3dbfbf"}} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input value={formUsuario.email} onChange={e => setFormUsuario({...formUsuario, email: e.target.value})}
                  placeholder="email@soriano.gub.uy" disabled={!!modalUsuario.id}
                  className="w-full border-2 rounded-xl px-4 py-3 text-sm focus:outline-none disabled:bg-gray-50"
                  style={{borderColor: "#3dbfbf"}} />
              </div>
              {!modalUsuario.id && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Contraseña</label>
                  <input type="password" value={formUsuario.password} onChange={e => setFormUsuario({...formUsuario, password: e.target.value})}
                    placeholder="••••••••"
                    className="w-full border-2 rounded-xl px-4 py-3 text-sm focus:outline-none"
                    style={{borderColor: "#3dbfbf"}} />
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Rol</label>
                <select value={formUsuario.rol} onChange={e => setFormUsuario({...formUsuario, rol: e.target.value, areaId: ""})}
                  className="w-full border-2 rounded-xl px-4 py-3 text-sm focus:outline-none"
                  style={{borderColor: "#3dbfbf"}}>
                  <option value="encargado">Encargado</option>
                  <option value="ejecutor">Ejecutor de tareas</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Categoría</label>
                <select value={formUsuario.categoriaId} onChange={e => setFormUsuario({...formUsuario, categoriaId: e.target.value, areaId: ""})}
                  className="w-full border-2 rounded-xl px-4 py-3 text-sm focus:outline-none"
                  style={{borderColor: "#3dbfbf"}}>
                  <option value="">Seleccioná una categoría</option>
                  {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
                </select>
              </div>
              {formUsuario.rol === "ejecutor" && formUsuario.categoriaId && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Área específica</label>
                  <select value={formUsuario.areaId} onChange={e => setFormUsuario({...formUsuario, areaId: e.target.value})}
                    className="w-full border-2 rounded-xl px-4 py-3 text-sm focus:outline-none"
                    style={{borderColor: "#3dbfbf"}}>
                    <option value="">Seleccioná un área</option>
                    {areas.filter(a => a.categoriaId === formUsuario.categoriaId).map(area => (
                      <option key={area.id} value={area.id}>{area.nombre}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={guardarUsuario}
                className="flex-1 py-2 rounded-xl text-white font-semibold" style={{backgroundColor: "#3dbfbf"}}>
                Guardar
              </button>
              <button onClick={() => setModalUsuario(null)}
                className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-600 font-semibold">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Foto ampliada */}
      {fotoAmpliada && (
        <div onClick={() => setFotoAmpliada(null)}
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 cursor-pointer p-4">
          <img src={fotoAmpliada} alt="foto ampliada" className="max-w-full max-h-full rounded-2xl shadow-2xl" />
        </div>
      )}
    </div>
  );
}

export default PanelAdmin;