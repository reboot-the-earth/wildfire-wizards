import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TYPING_DELAY = 400;

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇲🇽' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'tl', label: 'Tagalog', flag: '🇵🇭' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
];

const UI = {
  en: { placeholder: 'Ask about fire, shelters, neighbors...', online: 'Online — Real-time data', title: 'Emergency Assistant', quickActions: ['My farm status', 'Shelters', 'Who needs help?', 'Fire info'] },
  es: { placeholder: 'Pregunte sobre incendio, refugios, vecinos...', online: 'En línea — Datos en tiempo real', title: 'Asistente de Emergencia', quickActions: ['Estado de mi granja', 'Refugios', '¿Quién necesita ayuda?', 'Info del incendio'] },
  zh: { placeholder: '询问火灾、避难所、邻居...', online: '在线 — 实时数据', title: '紧急助手', quickActions: ['我的农场状态', '避难所', '谁需要帮助？', '火灾信息'] },
  vi: { placeholder: 'Hỏi về cháy, nơi trú ẩn, hàng xóm...', online: 'Trực tuyến — Dữ liệu thời gian thực', title: 'Trợ lý Khẩn cấp', quickActions: ['Tình trạng trang trại', 'Nơi trú ẩn', 'Ai cần giúp?', 'Thông tin cháy'] },
  tl: { placeholder: 'Magtanong tungkol sa sunog, shelter, kapitbahay...', online: 'Online — Real-time data', title: 'Emergency Assistant', quickActions: ['Status ng farm ko', 'Mga shelter', 'Sino ang kailangan ng tulong?', 'Info ng sunog'] },
  ko: { placeholder: '화재, 대피소, 이웃에 대해 질문하세요...', online: '온라인 — 실시간 데이터', title: '긴급 도우미', quickActions: ['내 농장 상태', '대피소', '도움이 필요한 사람?', '화재 정보'] },
};

const KEYWORDS = {
  en: {
    greet: ['hi', 'hello', 'hey', 'help me', 'what can you'],
    fire: ['fire', 'blaze', 'wildfire', 'burn', 'flame'],
    farm: ['my farm', 'my house', 'my ranch', 'my status', 'am i safe', 'how much time', 'valley center', 'current user'],
    shelter: ['shelter', 'facilit', 'where to go', 'capacity', 'space', 'room', 'take my animal', 'destination'],
    neighbor: ['neighbor', 'nearby', 'fellow', 'who can help', 'willing to help', 'offering', 'helper'],
    sos: ['need help', 'sos', 'who needs', 'distress', 'stuck', 'stranded', 'emergency'],
    route: ['route', 'road', 'path', 'direction', 'way out', 'escape', 'drive'],
    animal: ['animal', 'livestock', 'cattle', 'horse', 'goat', 'sheep', 'poultry', 'how many'],
    weather: ['wind', 'weather', 'temperature', 'humid', 'condition'],
    register: ['register', 'sign up', 'unregister', 'not on app'],
    checklist: ['checklist', 'what to do', 'steps', 'prepare', 'pack', 'ready'],
    contact: ['contact', 'phone', 'call', 'number'],
    thanks: ['thank', 'thanks', 'ok', 'got it', 'cool', 'great'],
  },
  es: {
    greet: ['hola', 'ayuda', 'qué puedes', 'buenas'],
    fire: ['fuego', 'incendio', 'llama', 'quemar'],
    farm: ['mi granja', 'mi rancho', 'mi casa', 'estoy seguro', 'cuánto tiempo', 'mi estado'],
    shelter: ['refugio', 'albergue', 'adónde ir', 'capacidad', 'espacio', 'destino'],
    neighbor: ['vecino', 'cercano', 'quién puede ayudar', 'ayuda disponible'],
    sos: ['necesita ayuda', 'sos', 'quién necesita', 'emergencia', 'atrapado'],
    route: ['ruta', 'camino', 'dirección', 'salida', 'escapar', 'manejar'],
    animal: ['animal', 'ganado', 'caballo', 'cabra', 'oveja', 'cuántos'],
    weather: ['viento', 'clima', 'temperatura', 'humedad'],
    register: ['registrar', 'no registrado'],
    checklist: ['lista', 'qué hacer', 'pasos', 'preparar'],
    contact: ['contacto', 'teléfono', 'llamar', 'número'],
    thanks: ['gracias', 'ok', 'entendido', 'vale'],
  },
  zh: {
    greet: ['你好', '帮助', '嗨', '能做什么'],
    fire: ['火灾', '野火', '火', '燃烧'],
    farm: ['我的农场', '我的房子', '安全吗', '多少时间', '我的状态'],
    shelter: ['避难所', '去哪里', '容量', '空间', '目的地'],
    neighbor: ['邻居', '附近', '谁能帮忙', '帮助'],
    sos: ['需要帮助', '求救', '谁需要', '紧急', '困住'],
    route: ['路线', '道路', '方向', '出路', '逃跑'],
    animal: ['动物', '牲畜', '牛', '马', '羊', '多少'],
    weather: ['风', '天气', '温度', '湿度'],
    register: ['注册', '未注册'],
    checklist: ['清单', '该做什么', '准备'],
    contact: ['联系', '电话', '号码'],
    thanks: ['谢谢', '好的', '明白了'],
  },
  vi: {
    greet: ['xin chào', 'giúp tôi', 'chào'],
    fire: ['cháy', 'lửa', 'hỏa hoạn'],
    farm: ['trang trại', 'nhà tôi', 'an toàn', 'bao lâu', 'tình trạng'],
    shelter: ['nơi trú ẩn', 'đi đâu', 'sức chứa', 'chỗ trống'],
    neighbor: ['hàng xóm', 'gần đây', 'ai giúp'],
    sos: ['cần giúp', 'sos', 'ai cần', 'khẩn cấp', 'mắc kẹt'],
    route: ['đường', 'lối thoát', 'hướng', 'lái xe'],
    animal: ['động vật', 'gia súc', 'ngựa', 'bò', 'dê'],
    weather: ['gió', 'thời tiết', 'nhiệt độ', 'độ ẩm'],
    register: ['đăng ký', 'chưa đăng ký'],
    checklist: ['danh sách', 'phải làm gì', 'chuẩn bị'],
    contact: ['liên hệ', 'điện thoại', 'gọi', 'số'],
    thanks: ['cảm ơn', 'ok', 'hiểu rồi'],
  },
  tl: {
    greet: ['kumusta', 'tulong', 'hello', 'hi'],
    fire: ['sunog', 'apoy', 'nasusunog'],
    farm: ['farm ko', 'bahay ko', 'ligtas ba', 'gaano katagal', 'status'],
    shelter: ['shelter', 'saan pupunta', 'kapasidad', 'espasyo'],
    neighbor: ['kapitbahay', 'malapit', 'sino makakatulong'],
    sos: ['kailangan tulong', 'sos', 'sino kailangan', 'emergency', 'naiipit'],
    route: ['ruta', 'daan', 'direksyon', 'labasan', 'takasan'],
    animal: ['hayop', 'baka', 'kabayo', 'kambing', 'ilan'],
    weather: ['hangin', 'panahon', 'temperatura', 'humidity'],
    register: ['register', 'hindi registered'],
    checklist: ['listahan', 'ano gagawin', 'ihanda'],
    contact: ['contact', 'telepono', 'tawag', 'numero'],
    thanks: ['salamat', 'ok', 'sige', 'gets'],
  },
  ko: {
    greet: ['안녕', '도움', '하이'],
    fire: ['화재', '불', '산불'],
    farm: ['내 농장', '내 집', '안전', '얼마나', '상태'],
    shelter: ['대피소', '어디로', '수용', '공간'],
    neighbor: ['이웃', '근처', '도울 수 있는'],
    sos: ['도움 필요', 'sos', '누가 필요', '긴급', '갇힌'],
    route: ['경로', '도로', '방향', '탈출', '운전'],
    animal: ['동물', '가축', '말', '소', '양', '몇'],
    weather: ['바람', '날씨', '온도', '습도'],
    register: ['등록', '미등록'],
    checklist: ['체크리스트', '뭘 해야', '준비'],
    contact: ['연락처', '전화', '번호'],
    thanks: ['감사', '고마워', '알겠어', 'ok'],
  },
};

const RISK_LABELS = {
  en: { critical: 'CRITICAL', high: 'HIGH', moderate: 'MODERATE', low: 'LOW' },
  es: { critical: 'CRITICO', high: 'ALTO', moderate: 'MODERADO', low: 'BAJO' },
  zh: { critical: '危急', high: '高', moderate: '中等', low: '低' },
  vi: { critical: 'NGUY CẤP', high: 'CAO', moderate: 'TRUNG BÌNH', low: 'THẤP' },
  tl: { critical: 'KRITIKAL', high: 'MATAAS', moderate: 'KATAMTAMAN', low: 'MABABA' },
  ko: { critical: '위급', high: '높음', moderate: '보통', low: '낮음' },
};

function riskLabel(level, lang) {
  return (RISK_LABELS[lang] || RISK_LABELS.en)[level] || level?.toUpperCase() || '?';
}

const RESPONSES = {
  en: {
    welcome: `Hi! I'm your **WildfireWizards** emergency assistant. Ask me anything about the fire, your farm, shelters, or neighbors. Type **"help"** to see what I can do.`,
    greet: (ctx) => `Welcome to **WildfireWizards** emergency assistant. I can help with:\n\n• **Fire status** — current fire info, wind, weather\n• **My farm** — your farm's risk level and evacuation urgency\n• **Shelters** — where to take animals, capacity\n• **Neighbors** — who can help, who needs help\n• **Routes** — safest paths out\n• **Animals** — total at risk\n\nAsk *"How much time do I have?"* or *"Which shelters have space?"*`,
    fire: (ctx) => { const w = ctx.fireData.wind || {}; const wx = ctx.fireData.weather || {}; return `🔥 **Lilac Fire — Bonsall**\n\n• **Active hotspots:** ${ctx.fireData.active_hotspots?.length || 0}\n• **Wind:** ${w.speed_mph} mph, gusts ${w.gusts_mph} mph, bearing ${w.direction_deg}°\n• **Weather:** ${wx.temp_f}°F, ${wx.humidity_pct}% humidity (critically dry)\n• **Farms at risk:** ${ctx.fireData.farms_at_risk?.length || 0}\n\nFire spreading southwest. Evacuation **strongly recommended**.`; },
    farm: (ctx) => { const f = ctx.currentUserFarm; if (!f) return 'Farm not found. Register your location first.'; return `🏠 **Your Farm — ${f.name}**\n\n• **Risk:** ${riskLabel(f.risk_level, 'en')}\n• **Time to fire:** ${f.estimated_time_to_fire_hours}h\n• **Status:** ${f.needsHelp ? '🆘 Help requested' : 'No help request'}\n${f.helpMessage ? `• **Message:** ${f.helpMessage}` : ''}\n\n⚠️ ${f.alert_message}\n\n**Action:** Evacuate immediately.`; },
    shelter: (ctx) => { const lines = ctx.facilities.map(f => { const s = ctx.getFacilityStatus(f); const r = ctx.getDestinationRisk(f); return `• **${f.name}** — ${f.capacity_available === 0 ? 'FULL' : `${f.capacity_available}/${f.capacity_total}`} · ${r.label} · ${s.label}\n  Accepts: ${f.accepts.join(', ')} · ${f.contact}`; }); const open = ctx.facilities.filter(f => f.capacity_available > 0); return `🏥 **Shelters** (${open.length} available, ${open.reduce((s,f) => s + f.capacity_available, 0)} spots)\n\n${lines.join('\n\n')}`; },
    neighbor: (ctx) => { const h = ctx.fellowFarmers.filter(f => f.willingToHelp); const n = ctx.fellowFarmers.filter(f => f.needsHelp); let r = `👥 **Helpers** (${h.length})\n\n${h.map(f => `• **${f.name}** (${f.owner}) — ${f.spare_capacity} spaces\n  _"${f.helpMessage}"_`).join('\n\n')}`; if (n.length) r += `\n\n---\n\n🆘 **Need Help** (${n.length})\n\n${n.map(f => `• **${f.name}** — ${f.sosMessage || 'Needs help'}`).join('\n\n')}`; return r; },
    sos: (ctx) => { const sf = (ctx.fireData.farms_at_risk || []).filter(f => f.needsHelp); const sn = ctx.fellowFarmers.filter(f => f.needsHelp); const lines = [...sf.map(f => `• **${f.name}** — ${riskLabel(f.risk_level, 'en')}, ${f.estimated_time_to_fire_hours}h\n  _"${f.helpMessage}"_`), ...sn.map(f => `• **${f.name}** — 🆘 ${f.sosMessage || 'Needs help'}`)]; return `🆘 **People Needing Help** (${sf.length + sn.length})\n\n${lines.join('\n\n')}`; },
    route: () => `🛣️ **Evacuation Route**\n\n• **I-15 South** → Del Mar Fairgrounds (best, 28 min)\n\n⚠️ Avoid roads heading northeast.\n\nLoad priority: pregnant/injured first, then young, then herd.`,
    animal: (ctx) => `🐴 **Animals at Risk**\n\n• **Farms in danger:** ${ctx.fireData.farms_at_risk?.length || 0}\n• Your farm: 150 cattle + 8 horses\n\n**Shelter capacity:**\n${ctx.facilities.filter(f => f.capacity_available > 0).map(f => `• ${f.name}: ${f.capacity_available} (${f.accepts.join(', ')})`).join('\n')}`,
    weather: (ctx) => { const w = ctx.fireData.wind || {}; const wx = ctx.fireData.weather || {}; return `🌡️ **Conditions**\n\n• **Temp:** ${wx.temp_f}°F\n• **Humidity:** ${wx.humidity_pct}%\n• **Wind:** ${w.speed_mph} mph, gusts ${w.gusts_mph}\n• **Direction:** ${w.direction_deg}° (NE→SW)\n\nSanta Ana conditions — rapid fire spread.`; },
    register: (ctx) => { const u = ctx.fellowFarmers.filter(f => !f.registered); return `📋 **Unregistered** (${u.length})\n\nNot on WildfireWizards — no SMS alerts:\n\n${u.map(f => `• **${f.name}** (${f.owner})`).join('\n')}\n\n⚠️ Contact them directly.`; },
    checklist: () => `✅ **Evacuation Checklist**\n\n1. ☐ Medications, vet records, papers\n2. ☐ Water containers\n3. ☐ Tag all animals with your info\n4. ☐ Load pregnant/injured first\n5. ☐ Open gates for remaining animals\n6. ☐ Close structures, turn off gas\n7. ☐ Leave note with animal count\n8. ☐ Photos of all animals\n9. ☐ Notify unregistered neighbors\n10. ☐ Share your location`,
    contact: (ctx) => `📞 **Contacts**\n\n${ctx.facilities.filter(f => f.contact).map(f => `• **${f.name}:** ${f.contact}`).join('\n')}\n\n• **911** — Emergency\n• **CAL FIRE:** 800-468-4408\n• **SD Animal Services:** 619-767-2675`,
    thanks: () => `Stay safe. **No animal is worth your life.** I'm here if you need more.`,
    fallback: () => `Try asking:\n\n• **"fire"** — fire status\n• **"my farm"** — your risk\n• **"shelters"** — facilities\n• **"who needs help"** — SOS\n• **"neighbors"** — helpers\n• **"routes"** — directions\n• **"checklist"** — prep steps\n• **"contacts"** — phone numbers`,
  },
  es: {
    welcome: `¡Hola! Soy el asistente de emergencia de **WildfireWizards**. Pregúntame sobre el incendio, tu granja, refugios o vecinos. Escribe **"ayuda"** para ver opciones.`,
    greet: () => `Bienvenido al asistente de **WildfireWizards**. Puedo ayudar con:\n\n• **Incendio** — estado actual\n• **Mi granja** — nivel de riesgo\n• **Refugios** — capacidad disponible\n• **Vecinos** — quién puede ayudar\n• **Rutas** — caminos seguros\n• **Animales** — en riesgo`,
    fire: (ctx) => { const w = ctx.fireData.wind || {}; const wx = ctx.fireData.weather || {}; return `🔥 **Incendio Lilac — Bonsall**\n\n• **Focos activos:** ${ctx.fireData.active_hotspots?.length || 0}\n• **Viento:** ${w.speed_mph} mph, ráfagas ${w.gusts_mph} mph, dirección ${w.direction_deg}°\n• **Clima:** ${wx.temp_f}°F, ${wx.humidity_pct}% humedad (críticamente seco)\n• **Granjas en riesgo:** ${ctx.fireData.farms_at_risk?.length || 0}\n\nEl fuego avanza al suroeste. **Se recomienda evacuar.**`; },
    farm: (ctx) => { const f = ctx.currentUserFarm; if (!f) return 'Granja no encontrada.'; return `🏠 **Tu Granja — ${f.name}**\n\n• **Riesgo:** ${riskLabel(f.risk_level, 'es')}\n• **Tiempo al fuego:** ${f.estimated_time_to_fire_hours}h\n• **Estado:** ${f.needsHelp ? '🆘 Ayuda solicitada' : 'Sin solicitud'}\n${f.helpMessage ? `• **Mensaje:** ${f.helpMessage}` : ''}\n\n⚠️ ${f.alert_message}\n\n**Acción:** Evacuar inmediatamente.`; },
    shelter: (ctx) => { const open = ctx.facilities.filter(f => f.capacity_available > 0); return `🏥 **Refugios** (${open.length} disponibles, ${open.reduce((s,f) => s + f.capacity_available, 0)} espacios)\n\n${ctx.facilities.map(f => `• **${f.name}** — ${f.capacity_available === 0 ? 'LLENO' : `${f.capacity_available}/${f.capacity_total}`}\n  Acepta: ${f.accepts.join(', ')} · ${f.contact}`).join('\n\n')}`; },
    neighbor: (ctx) => { const h = ctx.fellowFarmers.filter(f => f.willingToHelp); const n = ctx.fellowFarmers.filter(f => f.needsHelp); let r = `👥 **Vecinos que ayudan** (${h.length})\n\n${h.map(f => `• **${f.name}** (${f.owner}) — ${f.spare_capacity} espacios\n  _"${f.helpMessage}"_`).join('\n\n')}`; if (n.length) r += `\n\n---\n\n🆘 **Necesitan ayuda** (${n.length})\n\n${n.map(f => `• **${f.name}** — ${f.sosMessage || 'Necesita ayuda'}`).join('\n\n')}`; return r; },
    sos: (ctx) => { const sf = (ctx.fireData.farms_at_risk || []).filter(f => f.needsHelp); const sn = ctx.fellowFarmers.filter(f => f.needsHelp); const lines = [...sf.map(f => `• **${f.name}** — ${riskLabel(f.risk_level, 'es')}, ${f.estimated_time_to_fire_hours}h\n  _"${f.helpMessage}"_`), ...sn.map(f => `• **${f.name}** — 🆘 ${f.sosMessage || 'Necesita ayuda'}`)]; return `🆘 **Personas que necesitan ayuda** (${sf.length + sn.length})\n\n${lines.join('\n\n')}`; },
    route: () => `🛣️ **Ruta de Evacuación**\n\n• **I-15 Sur** → Del Mar Fairgrounds (mejor, 28 min)\n\n⚠️ Evitar caminos al noreste.\n\nPrioridad: preñadas/heridas primero.`,
    animal: (ctx) => `🐴 **Animales en riesgo**\n\n• **Granjas en peligro:** ${ctx.fireData.farms_at_risk?.length || 0}\n• Tu granja: 150 vacas + 8 caballos\n\n**Capacidad de refugios:**\n${ctx.facilities.filter(f => f.capacity_available > 0).map(f => `• ${f.name}: ${f.capacity_available} (${f.accepts.join(', ')})`).join('\n')}`,
    weather: (ctx) => { const w = ctx.fireData.wind || {}; const wx = ctx.fireData.weather || {}; return `🌡️ **Condiciones**\n\n• **Temp:** ${wx.temp_f}°F\n• **Humedad:** ${wx.humidity_pct}%\n• **Viento:** ${w.speed_mph} mph, ráfagas ${w.gusts_mph}\n• **Dirección:** ${w.direction_deg}°\n\nCondiciones Santa Ana — propagación rápida.`; },
    register: (ctx) => { const u = ctx.fellowFarmers.filter(f => !f.registered); return `📋 **No registrados** (${u.length})\n\nSin alertas SMS de WildfireWizards:\n\n${u.map(f => `• **${f.name}** (${f.owner})`).join('\n')}\n\n⚠️ Contáctelos directamente.`; },
    checklist: () => `✅ **Lista de Evacuación**\n\n1. ☐ Medicinas y documentos\n2. ☐ Agua para transporte\n3. ☐ Etiquetar animales\n4. ☐ Cargar preñadas/heridas primero\n5. ☐ Abrir puertas para los demás\n6. ☐ Cerrar estructuras, apagar gas\n7. ☐ Dejar nota con conteo\n8. ☐ Fotos de animales\n9. ☐ Avisar vecinos no registrados\n10. ☐ Compartir ubicación`,
    contact: (ctx) => `📞 **Contactos**\n\n${ctx.facilities.filter(f => f.contact).map(f => `• **${f.name}:** ${f.contact}`).join('\n')}\n\n• **911** — Emergencia\n• **CAL FIRE:** 800-468-4408`,
    thanks: () => `Cuídate. **Ningún animal vale tu vida.** Estoy aquí si necesitas más.`,
    fallback: () => `Intenta preguntar:\n\n• **"incendio"** — estado del fuego\n• **"mi granja"** — tu riesgo\n• **"refugios"** — instalaciones\n• **"quién necesita ayuda"** — SOS\n• **"rutas"** — direcciones\n• **"lista"** — preparación`,
  },
  zh: {
    welcome: `你好！我是 **WildfireWizards** 紧急助手。问我关于火灾、农场、避难所或邻居的任何问题。输入 **"帮助"** 查看功能。`,
    greet: () => `欢迎使用 **WildfireWizards**。我可以帮助：\n\n• **火灾状态**\n• **我的农场** — 风险等级\n• **避难所** — 容量\n• **邻居** — 谁能帮忙\n• **路线** — 安全路径\n• **动物** — 风险统计`,
    fire: (ctx) => { const w = ctx.fireData.wind || {}; const wx = ctx.fireData.weather || {}; return `🔥 **丁香花火灾 — Bonsall**\n\n• **热点:** ${ctx.fireData.active_hotspots?.length || 0}\n• **风速:** ${w.speed_mph} mph, 阵风 ${w.gusts_mph} mph, 方向 ${w.direction_deg}°\n• **天气:** ${wx.temp_f}°F, ${wx.humidity_pct}% 湿度（极度干燥）\n• **危险农场:** ${ctx.fireData.farms_at_risk?.length || 0}\n\n火势向西南蔓延。**强烈建议撤离。**`; },
    farm: (ctx) => { const f = ctx.currentUserFarm; if (!f) return '未找到农场。请先注册您的位置。'; return `🏠 **你的农场 — ${f.name}**\n\n• **风险:** ${riskLabel(f.risk_level, 'zh')}\n• **距火时间:** ${f.estimated_time_to_fire_hours}小时\n• **状态:** ${f.needsHelp ? '🆘 已请求帮助' : '无求助'}\n${f.helpMessage ? `• **消息:** ${f.helpMessage}` : ''}\n\n⚠️ ${f.alert_message}\n\n**立即撤离！**`; },
    shelter: (ctx) => { const open = ctx.facilities.filter(f => f.capacity_available > 0); return `🏥 **避难所** (${open.length}个可用, 共${open.reduce((s,f) => s + f.capacity_available, 0)}个位置)\n\n${ctx.facilities.map(f => `• **${f.name}** — ${f.capacity_available === 0 ? '已满' : `${f.capacity_available}/${f.capacity_total}`}\n  接受: ${f.accepts.join(', ')} · ${f.contact}`).join('\n\n')}`; },
    neighbor: (ctx) => { const h = ctx.fellowFarmers.filter(f => f.willingToHelp); const n = ctx.fellowFarmers.filter(f => f.needsHelp); let r = `👥 **愿意帮助的邻居** (${h.length})\n\n${h.map(f => `• **${f.name}** (${f.owner}) — ${f.spare_capacity}个空位\n  _"${f.helpMessage}"_`).join('\n\n')}`; if (n.length) r += `\n\n---\n\n🆘 **需要帮助** (${n.length})\n\n${n.map(f => `• **${f.name}** — ${f.sosMessage || '需要帮助'}`).join('\n\n')}`; return r; },
    sos: (ctx) => { const sf = (ctx.fireData.farms_at_risk || []).filter(f => f.needsHelp); const sn = ctx.fellowFarmers.filter(f => f.needsHelp); const lines = [...sf.map(f => `• **${f.name}** — ${riskLabel(f.risk_level, 'zh')}, ${f.estimated_time_to_fire_hours}小时\n  _"${f.helpMessage}"_`), ...sn.map(f => `• **${f.name}** — 🆘 ${f.sosMessage || '需要帮助'}`)]; return `🆘 **需要帮助的人** (${sf.length + sn.length})\n\n${lines.join('\n\n')}`; },
    route: () => `🛣️ **撤离路线**\n\n• **I-15南** → Del Mar Fairgrounds（最佳, 28分钟）\n\n⚠️ 避免东北方向道路。\n\n装载优先: 怀孕/受伤动物优先。`,
    animal: (ctx) => `🐴 **危险动物**\n\n• **危险农场:** ${ctx.fireData.farms_at_risk?.length || 0}\n• 你的农场: 150头牛 + 8匹马\n\n**避难所容量:**\n${ctx.facilities.filter(f => f.capacity_available > 0).map(f => `• ${f.name}: ${f.capacity_available} (${f.accepts.join(', ')})`).join('\n')}`,
    weather: (ctx) => { const w = ctx.fireData.wind || {}; const wx = ctx.fireData.weather || {}; return `🌡️ **天气状况**\n\n• **温度:** ${wx.temp_f}°F\n• **湿度:** ${wx.humidity_pct}%\n• **风速:** ${w.speed_mph} mph, 阵风 ${w.gusts_mph}\n• **方向:** ${w.direction_deg}°\n\n圣安娜风条件 — 火势迅速蔓延。`; },
    register: (ctx) => { const u = ctx.fellowFarmers.filter(f => !f.registered); return `📋 **未注册** (${u.length})\n\n未使用WildfireWizards — 无短信提醒:\n\n${u.map(f => `• **${f.name}** (${f.owner})`).join('\n')}\n\n⚠️ 直接联系他们。`; },
    checklist: () => `✅ **撤离清单**\n\n1. ☐ 药品和文件\n2. ☐ 运输用水\n3. ☐ 标记所有动物\n4. ☐ 先装怀孕/受伤的\n5. ☐ 打开剩余动物的门\n6. ☐ 关闭建筑，关气\n7. ☐ 留下动物数量的便条\n8. ☐ 拍照所有动物\n9. ☐ 通知未注册邻居\n10. ☐ 分享你的位置`,
    contact: (ctx) => `📞 **联系方式**\n\n${ctx.facilities.filter(f => f.contact).map(f => `• **${f.name}:** ${f.contact}`).join('\n')}\n\n• **911** — 紧急\n• **CAL FIRE:** 800-468-4408`,
    thanks: () => `注意安全。**生命第一。** 需要帮助随时问。`,
    fallback: () => `试试问：\n\n• **"火灾"**\n• **"我的农场"**\n• **"避难所"**\n• **"谁需要帮助"**\n• **"路线"**\n• **"清单"**`,
  },
  vi: {
    welcome: `Xin chào! Tôi là trợ lý khẩn cấp **WildfireWizards**. Hỏi tôi về cháy, trang trại, nơi trú ẩn. Gõ **"giúp tôi"**.`,
    greet: () => `Chào mừng đến **WildfireWizards**:\n\n• **Cháy** — tình trạng\n• **Trang trại** — mức rủi ro\n• **Nơi trú ẩn** — sức chứa\n• **Hàng xóm** — ai giúp được\n• **Đường** — lối thoát an toàn`,
    fire: (ctx) => { const w = ctx.fireData.wind || {}; const wx = ctx.fireData.weather || {}; return `🔥 **Cháy Lilac — Bonsall**\n\n• **Điểm nóng:** ${ctx.fireData.active_hotspots?.length || 0}\n• **Gió:** ${w.speed_mph} mph, giật ${w.gusts_mph} mph, hướng ${w.direction_deg}°\n• **Thời tiết:** ${wx.temp_f}°F, ${wx.humidity_pct}% ẩm (cực kỳ khô)\n• **Trang trại nguy hiểm:** ${ctx.fireData.farms_at_risk?.length || 0}\n\nLửa lan về phía tây nam. **Khuyến nghị sơ tán ngay.**`; },
    farm: (ctx) => { const f = ctx.currentUserFarm; if (!f) return 'Không tìm thấy trang trại. Đăng ký vị trí trước.'; return `🏠 **Trang trại của bạn — ${f.name}**\n\n• **Rủi ro:** ${riskLabel(f.risk_level, 'vi')}\n• **Thời gian đến lửa:** ${f.estimated_time_to_fire_hours}h\n• **Trạng thái:** ${f.needsHelp ? '🆘 Đã yêu cầu giúp đỡ' : 'Không yêu cầu'}\n${f.helpMessage ? `• **Tin nhắn:** ${f.helpMessage}` : ''}\n\n⚠️ ${f.alert_message}\n\n**Sơ tán ngay!**`; },
    shelter: (ctx) => { const open = ctx.facilities.filter(f => f.capacity_available > 0); return `🏥 **Nơi trú ẩn** (${open.length} có sẵn, ${open.reduce((s,f) => s + f.capacity_available, 0)} chỗ)\n\n${ctx.facilities.map(f => `• **${f.name}** — ${f.capacity_available === 0 ? 'ĐẦY' : `${f.capacity_available}/${f.capacity_total}`}\n  Nhận: ${f.accepts.join(', ')} · ${f.contact}`).join('\n\n')}`; },
    neighbor: (ctx) => { const h = ctx.fellowFarmers.filter(f => f.willingToHelp); const n = ctx.fellowFarmers.filter(f => f.needsHelp); let r = `👥 **Hàng xóm giúp đỡ** (${h.length})\n\n${h.map(f => `• **${f.name}** (${f.owner}) — ${f.spare_capacity} chỗ\n  _"${f.helpMessage}"_`).join('\n\n')}`; if (n.length) r += `\n\n---\n\n🆘 **Cần giúp đỡ** (${n.length})\n\n${n.map(f => `• **${f.name}** — ${f.sosMessage || 'Cần giúp'}`).join('\n\n')}`; return r; },
    sos: (ctx) => { const sf = (ctx.fireData.farms_at_risk || []).filter(f => f.needsHelp); const sn = ctx.fellowFarmers.filter(f => f.needsHelp); const lines = [...sf.map(f => `• **${f.name}** — ${riskLabel(f.risk_level, 'vi')}, ${f.estimated_time_to_fire_hours}h\n  _"${f.helpMessage}"_`), ...sn.map(f => `• **${f.name}** — 🆘 ${f.sosMessage || 'Cần giúp'}`)]; return `🆘 **Người cần giúp đỡ** (${sf.length + sn.length})\n\n${lines.join('\n\n')}`; },
    route: () => `🛣️ **Đường sơ tán**\n\n• **I-15 Nam** → Del Mar Fairgrounds (tốt nhất, 28 phút)\n\n⚠️ Tránh hướng đông bắc.\n\nƯu tiên: mang thai/bị thương trước.`,
    animal: (ctx) => `🐴 **Động vật gặp nguy**\n\n• **Trang trại nguy hiểm:** ${ctx.fireData.farms_at_risk?.length || 0}\n• Trang trại bạn: 150 bò + 8 ngựa\n\n**Sức chứa nơi trú ẩn:**\n${ctx.facilities.filter(f => f.capacity_available > 0).map(f => `• ${f.name}: ${f.capacity_available} (${f.accepts.join(', ')})`).join('\n')}`,
    weather: (ctx) => { const w = ctx.fireData.wind || {}; const wx = ctx.fireData.weather || {}; return `🌡️ **Thời tiết**\n\n• **Nhiệt độ:** ${wx.temp_f}°F\n• **Độ ẩm:** ${wx.humidity_pct}%\n• **Gió:** ${w.speed_mph} mph, giật ${w.gusts_mph}\n• **Hướng:** ${w.direction_deg}°\n\nĐiều kiện Santa Ana — lửa lan nhanh.`; },
    register: (ctx) => { const u = ctx.fellowFarmers.filter(f => !f.registered); return `📋 **Chưa đăng ký** (${u.length})\n\nKhông dùng WildfireWizards — không có SMS cảnh báo:\n\n${u.map(f => `• **${f.name}** (${f.owner})`).join('\n')}\n\n⚠️ Liên hệ trực tiếp.`; },
    checklist: () => `✅ **Danh sách sơ tán**\n\n1. ☐ Thuốc và giấy tờ\n2. ☐ Nước vận chuyển\n3. ☐ Đánh dấu tất cả động vật\n4. ☐ Chở con mang thai/bị thương trước\n5. ☐ Mở cổng cho số còn lại\n6. ☐ Đóng chuồng, tắt gas\n7. ☐ Để lại ghi chú số lượng\n8. ☐ Chụp ảnh tất cả động vật\n9. ☐ Thông báo hàng xóm chưa đăng ký\n10. ☐ Chia sẻ vị trí`,
    contact: (ctx) => `📞 **Liên hệ**\n\n${ctx.facilities.filter(f => f.contact).map(f => `• **${f.name}:** ${f.contact}`).join('\n')}\n\n• **911** — Khẩn cấp\n• **CAL FIRE:** 800-468-4408`,
    thanks: () => `Giữ an toàn. **Mạng sống quan trọng nhất.** Tôi ở đây nếu bạn cần.`,
    fallback: () => `Thử hỏi:\n\n• **"cháy"** — tình trạng\n• **"trang trại"** — rủi ro\n• **"nơi trú ẩn"** — sức chứa\n• **"ai cần giúp"** — SOS\n• **"hàng xóm"** — người giúp\n• **"đường"** — hướng dẫn`,
  },
  tl: {
    welcome: `Kumusta! Ako ang **WildfireWizards** emergency assistant. Magtanong tungkol sa sunog, farm, shelter, o kapitbahay.`,
    greet: () => `Welcome sa **WildfireWizards**:\n\n• **Sunog** — status\n• **Farm ko** — risk level\n• **Shelter** — kapasidad\n• **Kapitbahay** — sino makakatulong\n• **Ruta** — ligtas na daan`,
    fire: (ctx) => { const w = ctx.fireData.wind || {}; const wx = ctx.fireData.weather || {}; return `🔥 **Lilac Fire — Bonsall**\n\n• **Hotspots:** ${ctx.fireData.active_hotspots?.length || 0}\n• **Hangin:** ${w.speed_mph} mph, bugso ${w.gusts_mph} mph, direksyon ${w.direction_deg}°\n• **Panahon:** ${wx.temp_f}°F, ${wx.humidity_pct}% humidity (sobrang tuyo)\n• **Farms sa panganib:** ${ctx.fireData.farms_at_risk?.length || 0}\n\nKumakalat ang apoy sa timog-kanluran. **Mag-evacuate na.**`; },
    farm: (ctx) => { const f = ctx.currentUserFarm; if (!f) return 'Hindi nakita ang farm. Mag-register muna ng lokasyon.'; return `🏠 **Farm Mo — ${f.name}**\n\n• **Risk:** ${riskLabel(f.risk_level, 'tl')}\n• **Oras bago ang apoy:** ${f.estimated_time_to_fire_hours}h\n• **Status:** ${f.needsHelp ? '🆘 Humingi ng tulong' : 'Walang request'}\n${f.helpMessage ? `• **Mensahe:** ${f.helpMessage}` : ''}\n\n⚠️ ${f.alert_message}\n\n**Mag-evacuate agad!**`; },
    shelter: (ctx) => { const open = ctx.facilities.filter(f => f.capacity_available > 0); return `🏥 **Mga Shelter** (${open.length} available, ${open.reduce((s,f) => s + f.capacity_available, 0)} slots)\n\n${ctx.facilities.map(f => `• **${f.name}** — ${f.capacity_available === 0 ? 'PUNO' : `${f.capacity_available}/${f.capacity_total}`}\n  Tinatanggap: ${f.accepts.join(', ')} · ${f.contact}`).join('\n\n')}`; },
    neighbor: (ctx) => { const h = ctx.fellowFarmers.filter(f => f.willingToHelp); const n = ctx.fellowFarmers.filter(f => f.needsHelp); let r = `👥 **Tumutulong** (${h.length})\n\n${h.map(f => `• **${f.name}** (${f.owner}) — ${f.spare_capacity} slots\n  _"${f.helpMessage}"_`).join('\n\n')}`; if (n.length) r += `\n\n---\n\n🆘 **Kailangan ng Tulong** (${n.length})\n\n${n.map(f => `• **${f.name}** — ${f.sosMessage || 'Kailangan ng tulong'}`).join('\n\n')}`; return r; },
    sos: (ctx) => { const sf = (ctx.fireData.farms_at_risk || []).filter(f => f.needsHelp); const sn = ctx.fellowFarmers.filter(f => f.needsHelp); const lines = [...sf.map(f => `• **${f.name}** — ${riskLabel(f.risk_level, 'tl')}, ${f.estimated_time_to_fire_hours}h\n  _"${f.helpMessage}"_`), ...sn.map(f => `• **${f.name}** — 🆘 ${f.sosMessage || 'Kailangan ng tulong'}`)]; return `🆘 **Kailangan ng Tulong** (${sf.length + sn.length})\n\n${lines.join('\n\n')}`; },
    route: () => `🛣️ **Evacuation Route**\n\n• **I-15 South** → Del Mar Fairgrounds (pinakamabuti, 28 min)\n\n⚠️ Iwasan ang northeast na daan.\n\nPrioridad: buntis/sugatan muna.`,
    animal: (ctx) => `🐴 **Mga Hayop sa Panganib**\n\n• **Farms sa panganib:** ${ctx.fireData.farms_at_risk?.length || 0}\n• Farm mo: 150 baka + 8 kabayo\n\n**Kapasidad ng shelter:**\n${ctx.facilities.filter(f => f.capacity_available > 0).map(f => `• ${f.name}: ${f.capacity_available} (${f.accepts.join(', ')})`).join('\n')}`,
    weather: (ctx) => { const w = ctx.fireData.wind || {}; const wx = ctx.fireData.weather || {}; return `🌡️ **Panahon**\n\n• **Temperatura:** ${wx.temp_f}°F\n• **Humidity:** ${wx.humidity_pct}%\n• **Hangin:** ${w.speed_mph} mph, bugso ${w.gusts_mph}\n• **Direksyon:** ${w.direction_deg}°\n\nSanta Ana conditions — mabilis kumalat ang apoy.`; },
    register: (ctx) => { const u = ctx.fellowFarmers.filter(f => !f.registered); return `📋 **Hindi Registered** (${u.length})\n\nWala sa WildfireWizards — walang SMS alert:\n\n${u.map(f => `• **${f.name}** (${f.owner})`).join('\n')}\n\n⚠️ Kontakin sila direkta.`; },
    checklist: () => `✅ **Evacuation Checklist**\n\n1. ☐ Gamot at dokumento\n2. ☐ Tubig para sa biyahe\n3. ☐ I-tag ang mga hayop\n4. ☐ Buntis/sugatan muna\n5. ☐ Buksan gate para sa iba\n6. ☐ Isara ang structures, patayin gas\n7. ☐ Iwan ang listahan ng bilang\n8. ☐ Kunan ng litrato lahat ng hayop\n9. ☐ Abisuhan ang hindi registered\n10. ☐ I-share ang lokasyon`,
    contact: (ctx) => `📞 **Contacts**\n\n${ctx.facilities.filter(f => f.contact).map(f => `• **${f.name}:** ${f.contact}`).join('\n')}\n\n• **911** — Emergency\n• **CAL FIRE:** 800-468-4408`,
    thanks: () => `Mag-ingat. **Walang hayop na mas mahalaga sa buhay mo.** Nandito ako kung kailangan mo pa.`,
    fallback: () => `Subukan:\n\n• **"sunog"** — status\n• **"farm ko"** — risk\n• **"shelter"** — kapasidad\n• **"sino kailangan tulong"** — SOS\n• **"kapitbahay"** — tumutulong\n• **"ruta"** — direksyon`,
  },
  ko: {
    welcome: `안녕하세요! **WildfireWizards** 긴급 도우미입니다. 화재, 농장, 대피소에 대해 물어보세요. **"도움"** 을 입력하세요.`,
    greet: () => `**WildfireWizards**에 오신 것을 환영합니다:\n\n• **화재** — 현황\n• **내 농장** — 위험 수준\n• **대피소** — 수용량\n• **이웃** — 도움 가능\n• **경로** — 안전한 길`,
    fire: (ctx) => { const w = ctx.fireData.wind || {}; const wx = ctx.fireData.weather || {}; return `🔥 **라일락 화재 — Bonsall**\n\n• **핫스팟:** ${ctx.fireData.active_hotspots?.length || 0}\n• **바람:** ${w.speed_mph} mph, 돌풍 ${w.gusts_mph} mph, 방향 ${w.direction_deg}°\n• **날씨:** ${wx.temp_f}°F, 습도 ${wx.humidity_pct}% (극도로 건조)\n• **위험 농장:** ${ctx.fireData.farms_at_risk?.length || 0}\n\n화재가 남서쪽으로 확산 중. **즉시 대피하세요.**`; },
    farm: (ctx) => { const f = ctx.currentUserFarm; if (!f) return '농장을 찾을 수 없습니다. 먼저 위치를 등록하세요.'; return `🏠 **당신의 농장 — ${f.name}**\n\n• **위험:** ${riskLabel(f.risk_level, 'ko')}\n• **화재까지:** ${f.estimated_time_to_fire_hours}시간\n• **상태:** ${f.needsHelp ? '🆘 도움 요청함' : '요청 없음'}\n${f.helpMessage ? `• **메시지:** ${f.helpMessage}` : ''}\n\n⚠️ ${f.alert_message}\n\n**지금 대피하세요!**`; },
    shelter: (ctx) => { const open = ctx.facilities.filter(f => f.capacity_available > 0); return `🏥 **대피소** (${open.length}개 이용 가능, ${open.reduce((s,f) => s + f.capacity_available, 0)}자리)\n\n${ctx.facilities.map(f => `• **${f.name}** — ${f.capacity_available === 0 ? '만석' : `${f.capacity_available}/${f.capacity_total}`}\n  수용: ${f.accepts.join(', ')} · ${f.contact}`).join('\n\n')}`; },
    neighbor: (ctx) => { const h = ctx.fellowFarmers.filter(f => f.willingToHelp); const n = ctx.fellowFarmers.filter(f => f.needsHelp); let r = `👥 **도움 가능한 이웃** (${h.length})\n\n${h.map(f => `• **${f.name}** (${f.owner}) — ${f.spare_capacity}자리\n  _"${f.helpMessage}"_`).join('\n\n')}`; if (n.length) r += `\n\n---\n\n🆘 **도움 필요** (${n.length})\n\n${n.map(f => `• **${f.name}** — ${f.sosMessage || '도움 필요'}`).join('\n\n')}`; return r; },
    sos: (ctx) => { const sf = (ctx.fireData.farms_at_risk || []).filter(f => f.needsHelp); const sn = ctx.fellowFarmers.filter(f => f.needsHelp); const lines = [...sf.map(f => `• **${f.name}** — ${riskLabel(f.risk_level, 'ko')}, ${f.estimated_time_to_fire_hours}시간\n  _"${f.helpMessage}"_`), ...sn.map(f => `• **${f.name}** — 🆘 ${f.sosMessage || '도움 필요'}`)]; return `🆘 **도움이 필요한 사람** (${sf.length + sn.length})\n\n${lines.join('\n\n')}`; },
    route: () => `🛣️ **대피 경로**\n\n• **I-15 남쪽** → Del Mar Fairgrounds (최적, 28분)\n\n⚠️ 북동쪽 도로 피하세요.\n\n우선순위: 임신/부상 동물 먼저.`,
    animal: (ctx) => `🐴 **위험한 동물**\n\n• **위험 농장:** ${ctx.fireData.farms_at_risk?.length || 0}\n• 내 농장: 소 150마리 + 말 8마리\n\n**대피소 수용량:**\n${ctx.facilities.filter(f => f.capacity_available > 0).map(f => `• ${f.name}: ${f.capacity_available} (${f.accepts.join(', ')})`).join('\n')}`,
    weather: (ctx) => { const w = ctx.fireData.wind || {}; const wx = ctx.fireData.weather || {}; return `🌡️ **날씨 현황**\n\n• **온도:** ${wx.temp_f}°F\n• **습도:** ${wx.humidity_pct}%\n• **바람:** ${w.speed_mph} mph, 돌풍 ${w.gusts_mph}\n• **방향:** ${w.direction_deg}°\n\n산타아나 조건 — 화재 급속 확산.`; },
    register: (ctx) => { const u = ctx.fellowFarmers.filter(f => !f.registered); return `📋 **미등록** (${u.length})\n\nWildfireWizards 미사용 — SMS 알림 없음:\n\n${u.map(f => `• **${f.name}** (${f.owner})`).join('\n')}\n\n⚠️ 직접 연락하세요.`; },
    checklist: () => `✅ **대피 체크리스트**\n\n1. ☐ 약과 서류\n2. ☐ 운반용 물\n3. ☐ 모든 동물에 이름표\n4. ☐ 임신/부상 먼저\n5. ☐ 나머지 문 열기\n6. ☐ 시설 닫고 가스 차단\n7. ☐ 동물 수 메모 남기기\n8. ☐ 모든 동물 사진 찍기\n9. ☐ 미등록 이웃에게 알리기\n10. ☐ 위치 공유`,
    contact: (ctx) => `📞 **연락처**\n\n${ctx.facilities.filter(f => f.contact).map(f => `• **${f.name}:** ${f.contact}`).join('\n')}\n\n• **911** — 긴급\n• **CAL FIRE:** 800-468-4408`,
    thanks: () => `안전하세요. **생명이 최우선입니다.** 필요하면 언제든 물어보세요.`,
    fallback: () => `시도해보세요:\n\n• **"화재"** — 현황\n• **"내 농장"** — 위험\n• **"대피소"** — 수용\n• **"도움 필요"** — SOS\n• **"이웃"** — 도움자\n• **"경로"** — 방향`,
  },
};

function fuzzyMatch(text, keywords) {
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

function buildResponse(query, context, lang) {
  const kw = KEYWORDS[lang] || KEYWORDS.en;
  const resp = RESPONSES[lang] || RESPONSES.en;
  const ctx = { ...context, currentUserFarm: context.fireData.farms_at_risk?.find((f) => f.farm_id === 'valley_center_ranch') };

  const categories = ['greet','fire','farm','shelter','neighbor','sos','route','animal','weather','register','checklist','contact','thanks'];
  for (const cat of categories) {
    if (kw[cat] && fuzzyMatch(query, kw[cat])) {
      return typeof resp[cat] === 'function' ? resp[cat](ctx) : resp[cat];
    }
  }
  if (KEYWORDS.en !== kw) {
    for (const cat of categories) {
      if (KEYWORDS.en[cat] && fuzzyMatch(query, KEYWORDS.en[cat])) {
        return typeof resp[cat] === 'function' ? resp[cat](ctx) : resp[cat];
      }
    }
  }
  return typeof resp.fallback === 'function' ? resp.fallback(ctx) : resp.fallback;
}

function formatMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/_"(.+?)"_/g, '<em>"$1"</em>')
    .replace(/^• /gm, '<span class="text-amber-400 mr-1">›</span> ')
    .replace(/^(\d+)\. /gm, '<span class="text-amber-400 font-bold mr-1">$1.</span> ')
    .replace(/---/g, '<div class="border-t border-white/10 my-2"></div>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

export default function ChatPanel({ fireData, facilities, fellowFarmers, getFacilityStatus, getDestinationRisk }) {
  const [lang, setLang] = useState('en');
  const [showLangPicker, setShowLangPicker] = useState(false);
  const ui = UI[lang] || UI.en;
  const [messages, setMessages] = useState([
    { id: 'welcome', role: 'assistant', text: (RESPONSES[lang] || RESPONSES.en).welcome },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isTyping, scrollToBottom]);

  const switchLang = useCallback((code) => {
    setLang(code);
    setShowLangPicker(false);
    const welcome = (RESPONSES[code] || RESPONSES.en).welcome;
    setMessages([{ id: 'welcome-' + code, role: 'assistant', text: welcome }]);
  }, []);

  const doSend = useCallback((text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, { id: Date.now().toString(), role: 'user', text: trimmed }]);
    setInput('');
    setIsTyping(true);
    setTimeout(() => {
      const response = buildResponse(trimmed, { fireData, facilities, fellowFarmers, getFacilityStatus, getDestinationRisk }, lang);
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', text: response }]);
      setIsTyping(false);
    }, TYPING_DELAY + Math.random() * 300);
  }, [fireData, facilities, fellowFarmers, getFacilityStatus, getDestinationRisk, lang]);

  const handleSend = useCallback(() => doSend(input), [input, doSend]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f97316, #dc2626)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-white leading-none">{ui.title}</h3>
          <p className="text-[10px] text-emerald-400 font-medium mt-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
            {ui.online}
          </p>
        </div>
        {/* Language picker */}
        <div className="relative">
          <button
            onClick={() => setShowLangPicker(!showLangPicker)}
            className="text-lg px-1.5 py-0.5 rounded-md border border-white/10 hover:border-white/30 transition-colors"
            title="Change language"
          >
            {LANGUAGES.find(l => l.code === lang)?.flag || '🌐'}
          </button>
          {showLangPicker && (
            <div className="absolute top-full right-0 mt-1 w-36 rounded-lg border border-white/10 shadow-xl overflow-hidden z-50" style={{ background: 'rgba(11,16,32,0.96)' }}>
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => switchLang(l.code)}
                  className={`w-full text-left px-3 py-2 text-[11px] flex items-center gap-2 hover:bg-white/10 transition-colors ${lang === l.code ? 'text-orange-400 font-bold' : 'text-coal-200'}`}
                >
                  <span>{l.flag}</span> {l.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scroll-light">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[12px] leading-relaxed ${msg.role === 'user' ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-br-md' : 'bg-white/[0.07] text-coal-200 border border-white/[0.06] rounded-bl-md'}`}
                dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.text) }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-white/[0.07] border border-white/[0.06] rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-coal-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-coal-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-coal-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </motion.div>
        )}
      </div>

      {/* Quick actions */}
      <div className="px-3 pb-1.5 flex gap-1.5 flex-wrap">
        {ui.quickActions.map((q) => (
          <button key={q} onClick={() => doSend(q)} className="text-[10px] font-semibold px-2.5 py-1 rounded-full border border-white/10 text-coal-300 hover:text-white hover:border-orange-500/40 hover:bg-orange-500/10 transition-all">
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-3 pb-3 pt-1.5">
        <div className="flex items-center gap-2 bg-white/[0.06] border border-white/[0.08] rounded-xl px-3 py-2 focus-within:border-orange-500/40 transition-colors">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={ui.placeholder}
            className="flex-1 bg-transparent text-sm text-white placeholder-coal-500 outline-none"
          />
          <button onClick={handleSend} disabled={!input.trim()} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-30" style={{ background: input.trim() ? 'linear-gradient(135deg, #f97316, #dc2626)' : 'transparent' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
