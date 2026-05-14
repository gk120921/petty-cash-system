// 採購系統前端全域 API 配置
// 遵循物理隔離原則：子系統不應直接依賴 Portal 端口
const PORT = 3002;
export const API_BASE = `http://${window.location.hostname}:${PORT}/api`;

export default API_BASE;
