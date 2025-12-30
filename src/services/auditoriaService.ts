import { supabase } from "../supabaseClient";
import type { Auditoria } from "../types";

export const auditoriaService = {
  // Obtener historial - versión simple (MANTENIDA)
  async obtenerHistorial(limit: number = 10): Promise<Auditoria[]> {
    try {
      const { data, error } = await supabase
        .from("auditoria")
        .select(
          `
          id,
          accion,
          tabla_afectada,
          registro_id,
          detalles,
          created_at,
          empleado_id,
          empleados (nombre, rol)
        `
        )
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error obteniendo historial:", error);
        return [];
      }

      return (data || []).map((item) => {
        // Manejar el hecho de que Supabase puede devolver la relación como objeto o array
        const emp = Array.isArray(item.empleados)
          ? item.empleados[0]
          : item.empleados;

        return {
          id: item.id,
          empleado_id: item.empleado_id,
          accion: item.accion,
          tabla_afectada: item.tabla_afectada,
          registro_id: item.registro_id,
          detalles: item.detalles,
          created_at: item.created_at,
          empleado_nombre: emp?.nombre || "Sistema",
          empleado_rol: emp?.rol || "admin",
          tipo: (item.accion.startsWith("MANUAL_")
            ? "manual"
            : "automático") as "manual" | "automático",
        };
      });
    } catch (error) {
      console.error("Error en obtenerHistorial:", error);
      return [];
    }
  },

  // NUEVA FUNCIÓN: Obtener historial con filtros avanzados (PARA EL NUEVO DISEÑO)
  async obtenerHistorialCompleto(filters: {
    usuario?: string;
    rol?: string;
    modulo?: string;
    fechaInicio?: string;
    fechaFin?: string;
  }): Promise<Auditoria[]> {
    try {
      let query = supabase
        .from("auditoria")
        .select(
          `
          id,
          accion,
          tabla_afectada,
          registro_id,
          detalles,
          created_at,
          empleado_id,
          empleados (nombre, rol)
        `
        )
        .order("created_at", { ascending: false });

      if (filters.modulo) query = query.eq("tabla_afectada", filters.modulo);
      if (filters.fechaInicio)
        query = query.gte("created_at", `${filters.fechaInicio}T00:00:00`);
      if (filters.fechaFin)
        query = query.lte("created_at", `${filters.fechaFin}T23:59:59`);

      const { data, error } = await query;

      if (error) throw error;

      let result: Auditoria[] = (data || []).map((item) => {
        const emp = Array.isArray(item.empleados)
          ? item.empleados[0]
          : item.empleados;

        return {
          id: item.id,
          empleado_id: item.empleado_id,
          accion: item.accion.replace("MANUAL_", ""),
          tabla_afectada: item.tabla_afectada,
          registro_id: item.registro_id,
          detalles: item.detalles,
          created_at: item.created_at,
          empleado_nombre: emp?.nombre || "Sistema",
          empleado_rol: emp?.rol || "admin",
          tipo: (item.accion.startsWith("MANUAL_")
            ? "manual"
            : "automático") as "manual" | "automático",
        };
      });

      // Filtrado manual para relaciones
      if (filters.usuario) {
        result = result.filter((r) =>
          r.empleado_nombre
            ?.toLowerCase()
            .includes(filters.usuario!.toLowerCase())
        );
      }
      if (filters.rol) {
        result = result.filter((r) => r.empleado_rol === filters.rol);
      }

      return result;
    } catch (error) {
      console.error("Error en obtenerHistorialCompleto:", error);
      return [];
    }
  },

  // Registrar acción - VERSIÓN MEJORADA (MANTENIDA)
  async registrarAccion(
    accion: string,
    tabla_afectada: string,
    registro_id?: string,
    detalles?: any
  ): Promise<boolean> {
    try {
      let actorId = null;
      try {
        const userStr = localStorage.getItem("arlet_user");
        if (userStr) {
          const user = JSON.parse(userStr);
          actorId = user.id || user.username;
        }
      } catch (e) {
        console.warn("No se pudo obtener usuario para auditoría:", e);
      }

      console.log("Registrando auditoría por:", actorId, { accion });

      const { error } = await supabase.from("auditoria").insert({
        empleado_id: actorId,
        accion: `MANUAL_${accion}`,
        tabla_afectada,
        registro_id,
        detalles: detalles || null,
      });

      if (error) {
        console.error("Error en auditoría (intento 1):", error);
        const { error: error2 } = await supabase.from("auditoria").insert({
          empleado_id: null,
          accion: `MANUAL_${accion}`,
          tabla_afectada,
          registro_id,
          detalles: detalles || null,
        });

        if (error2) return false;
      }

      return true;
    } catch (error) {
      console.error("Error fatal en auditoría:", error);
      return false;
    }
  },

  // MÉTODOS DE EMPLEADOS (MANTENIDOS)
  async registrarCreacionEmpleado(empleado: any): Promise<boolean> {
    return this.registrarAccion("CREAR_EMPLEADO", "empleados", empleado.id, {
      nuevo_empleado: empleado.nombre,
    });
  },

  async registrarActualizacionEmpleado(
    empleadoId: string,
    cambios: any
  ): Promise<boolean> {
    return this.registrarAccion(
      "ACTUALIZAR_EMPLEADO",
      "empleados",
      empleadoId,
      { cambios }
    );
  },

  async registrarEliminacionEmpleado(
    empleadoId: string,
    empleadoInfo: any
  ): Promise<boolean> {
    return this.registrarAccion("ELIMINAR_EMPLEADO", "empleados", empleadoId, {
      empleado_eliminado: empleadoInfo.nombre,
    });
  },

  async registrarCambioEstado(
    empleadoId: string,
    nombre: string,
    estadoAnterior: string,
    estadoNuevo: string
  ): Promise<boolean> {
    return this.registrarAccion("CAMBIAR_ESTADO", "empleados", empleadoId, {
      empleado: nombre,
      cambio: `${estadoAnterior} → ${estadoNuevo}`,
    });
  },

  async registrarCambioContrasena(
    empleadoId: string,
    nombre: string
  ): Promise<boolean> {
    return this.registrarAccion("CAMBIAR_CONTRASENA", "empleados", empleadoId, {
      empleado: nombre,
    });
  },

  // NUEVOS MÉTODOS PARA RESERVAS Y PEDIDOS
  async registrarReserva(
    accion: "CREAR" | "EDITAR" | "ELIMINAR" | "ESTADO",
    id: string | number,
    info: any
  ): Promise<boolean> {
    return this.registrarAccion(
      `${accion}_RESERVA`,
      "reservas",
      String(id),
      info
    );
  },

  async registrarPedido(
    accion: "CREAR" | "EDITAR" | "ELIMINAR" | "ESTADO" | "COCINA",
    id: string,
    info: any
  ): Promise<boolean> {
    return this.registrarAccion(`${accion}_PEDIDO`, "pedidos", id, info);
  },

  async obtenerEstadisticas() {
    try {
      const hoyStr = new Date().toISOString().split("T")[0];
      const { count: totalCount } = await supabase
        .from("auditoria")
        .select("*", { count: "exact", head: true });
      const { count: hoyCount } = await supabase
        .from("auditoria")
        .select("*", { count: "exact", head: true })
        .gte("created_at", `${hoyStr}T00:00:00`);

      return { total: totalCount || 0, hoy: hoyCount || 0 };
    } catch {
      return null;
    }
  },

  // FUNCIÓN PARA EXPORTAR A EXCEL (CSV)
  exportarAExcel(datos: Auditoria[]) {
    if (!datos || datos.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }

    const headers = [
      "Fecha y Hora",
      "Usuario",
      "Rol",
      "Modulo",
      "Accion",
      "Descripcion Detallada",
      "Referencia ID",
    ];
    const rows = datos.map((log) => [
      new Date(log.created_at).toLocaleString("es-PE"),
      log.empleado_nombre || "Sistema",
      log.empleado_rol || "---",
      log.tabla_afectada,
      log.accion,
      JSON.stringify(log.detalles).replace(/"/g, "'"),
      log.registro_id || "---",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `bitacora_arlet_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};
