export const auditHelper = {
  // Para triggers futuros
  async setCurrentUserForAudit() {
    try {
      const userStr = localStorage.getItem("arlet_user");
      if (!userStr) return;

      const user = JSON.parse(userStr);

      // Esto es para futuros triggers
      console.log("Usuario para auditoría:", user.username);
    } catch (error) {
      console.error("Error configurando usuario para auditoría:", error);
    }
  },
};
