import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TYPING_DELAY = 400;

function fuzzyMatch(text, keywords) {
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

function buildResponse(query, context) {
  const { fireData, facilities, fellowFarmers, getFacilityStatus, getDestinationRisk } = context;
  const q = query.toLowerCase().trim();

  const currentUserFarm = fireData.farms_at_risk?.find((f) => f.farm_id === 'valley_center_ranch');

  if (fuzzyMatch(q, ['hi', 'hello', 'hey', 'help me', 'what can you'])) {
    return `Welcome to **NoHerdLeft** emergency assistant. I can help with:\n\n• **Fire status** — current fire info, wind, weather\n• **My farm** — your farm's risk level and evacuation urgency\n• **Shelters / facilities** — where to take animals, capacity, directions\n• **Neighbors** — who's nearby, who can help, who needs help\n• **Evacuation routes** — safest paths out\n• **Animals** — total at risk\n\nJust ask a question like *"How much time do I have?"* or *"Which shelters have space?"*`;
  }

  if (fuzzyMatch(q, ['fire', 'blaze', 'wildfire', 'burn', 'flame'])) {
    const w = fireData.wind || {};
    const wx = fireData.weather || {};
    const hotspots = fireData.active_hotspots?.length || 0;
    return `🔥 **Lilac Fire — Bonsall**\n\n• **Active hotspots:** ${hotspots}\n• **Wind:** ${w.speed_mph} mph, gusts to ${w.gusts_mph} mph, bearing ${w.direction_deg}°\n• **Weather:** ${wx.temp_f}°F, ${wx.humidity_pct}% humidity (critically dry)\n• **Farms at risk:** ${fireData.farms_at_risk?.length || 0}\n\nThe fire is spreading southwest driven by Santa Ana winds. Evacuation is **strongly recommended** for all farms within the projected 4-hour perimeter.`;
  }

  if (fuzzyMatch(q, ['my farm', 'my house', 'my ranch', 'my status', 'am i safe', 'how much time', 'valley center', 'current user'])) {
    if (!currentUserFarm) return `I couldn't find your farm in the system. Please register your farm location first.`;
    return `🏠 **Your Farm — ${currentUserFarm.name}**\n\n• **Risk level:** ${currentUserFarm.risk_level.toUpperCase()}\n• **Time to fire:** ${currentUserFarm.estimated_time_to_fire_hours} hours\n• **Status:** ${currentUserFarm.needsHelp ? '🆘 You have requested help' : 'No help request active'}\n${currentUserFarm.helpMessage ? `• **Your message:** ${currentUserFarm.helpMessage}` : ''}\n\n⚠️ ${currentUserFarm.alert_message}\n\n**Action:** Begin evacuating immediately. Load highest-priority animals first.`;
  }

  if (fuzzyMatch(q, ['shelter', 'facilit', 'where to go', 'capacity', 'space', 'room', 'take my animal', 'destination'])) {
    const lines = facilities.map((f) => {
      const status = getFacilityStatus(f);
      const risk = getDestinationRisk(f);
      const avail = f.capacity_available === 0 ? 'FULL' : `${f.capacity_available}/${f.capacity_total}`;
      return `• **${f.name}** — ${avail} spots · ${risk.label} · ${status.label}\n  Accepts: ${f.accepts.join(', ')} · Contact: ${f.contact}`;
    });
    const open = facilities.filter((f) => f.capacity_available > 0);
    const totalSpots = open.reduce((s, f) => s + f.capacity_available, 0);
    return `🏥 **Evacuation Shelters** (${open.length} available, ${totalSpots} total spots)\n\n${lines.join('\n\n')}`;
  }

  if (fuzzyMatch(q, ['neighbor', 'nearby', 'fellow', 'who can help', 'willing to help', 'offering', 'helper'])) {
    const helpers = fellowFarmers.filter((f) => f.willingToHelp);
    const needHelp = fellowFarmers.filter((f) => f.needsHelp);
    const lines = helpers.map(
      (f) => `• **${f.name}** (${f.owner}) — ${f.spare_capacity} spaces, ${f.spare_trailers} trailer(s)\n  _"${f.helpMessage}"_`
    );
    let response = `👥 **Neighbors Willing to Help** (${helpers.length})\n\n${lines.join('\n\n')}`;
    if (needHelp.length > 0) {
      const sosLines = needHelp.map(
        (f) => `• **${f.name}** (${f.owner}) — 🆘 ${f.sosMessage || 'Needs assistance'}`
      );
      response += `\n\n---\n\n🆘 **Neighbors Needing Help** (${needHelp.length})\n\n${sosLines.join('\n\n')}`;
    }
    return response;
  }

  if (fuzzyMatch(q, ['need help', 'sos', 'who needs', 'distress', 'stuck', 'stranded', 'emergency'])) {
    const sosNeighbors = fellowFarmers.filter((f) => f.needsHelp);
    const sosFarms = (fireData.farms_at_risk || []).filter((f) => f.needsHelp);
    const lines = [
      ...sosFarms.map((f) => `• **${f.name}** — ${f.risk_level} risk, ${f.estimated_time_to_fire_hours}h to fire\n  _"${f.helpMessage}"_`),
      ...sosNeighbors.map((f) => `• **${f.name}** (${f.owner}) — 🆘 ${f.sosMessage || 'Needs assistance'}`),
    ];
    return `🆘 **People Who Need Help** (${sosFarms.length + sosNeighbors.length})\n\n${lines.join('\n\n')}\n\nIf you can assist, please reach out to these farms directly or offer capacity through your profile.`;
  }

  if (fuzzyMatch(q, ['route', 'road', 'path', 'direction', 'way out', 'escape', 'drive'])) {
    return `🛣️ **Evacuation Routes**\n\nPrimary routes from your area:\n\n• **I-15 South** → Del Mar Fairgrounds (best for horses)\n• **CA-76 East** → Ramona Rodeo Grounds (multi-species)\n• **Old Highway 395 South** → San Pasqual Valley Farm\n\n⚠️ Avoid roads heading northeast — fire is approaching from that direction. Check CalTrans for real-time road closures.\n\nLoad priority: pregnant/injured animals first, then young stock, then remaining herd.`;
  }

  if (fuzzyMatch(q, ['animal', 'livestock', 'cattle', 'horse', 'goat', 'sheep', 'poultry', 'how many'])) {
    const totalFarms = fireData.farms_at_risk?.length || 0;
    return `🐴 **Animals at Risk**\n\n• **Farms in danger zone:** ${totalFarms}\n• Your farm: 150 cattle + 8 horses (per your help request)\n• Fallbrook Equestrian: 24 horses needing transport\n\n**Available shelter capacity:**\n${facilities.filter(f => f.capacity_available > 0).map(f => `• ${f.name}: ${f.capacity_available} spots (${f.accepts.join(', ')})`).join('\n')}\n\nPrioritize loading: injured/pregnant → young → adults`;
  }

  if (fuzzyMatch(q, ['wind', 'weather', 'temperature', 'humid', 'condition'])) {
    const w = fireData.wind || {};
    const wx = fireData.weather || {};
    return `🌡️ **Current Conditions**\n\n• **Temperature:** ${wx.temp_f}°F\n• **Humidity:** ${wx.humidity_pct}% (critically low)\n• **Wind speed:** ${w.speed_mph} mph\n• **Wind gusts:** ${w.gusts_mph} mph\n• **Wind direction:** ${w.direction_deg}° (NE → SW)\n\nSanta Ana conditions are driving rapid fire spread. Low humidity means fires burn hotter and faster.`;
  }

  if (fuzzyMatch(q, ['register', 'sign up', 'unregister', 'not on app'])) {
    const unreg = fellowFarmers.filter((f) => !f.registered);
    const lines = unreg.map((f) => `• **${f.name}** (${f.owner}) — ${f.needsHelp ? '🆘 NEEDS HELP' : 'Status unknown'}`);
    return `📋 **Unregistered Neighbors** (${unreg.length})\n\nThese farms are NOT on NoHerdLeft and won't receive SMS alerts:\n\n${lines.join('\n')}\n\n⚠️ If it's safe to do so, please contact them directly to relay the fire warning.`;
  }

  if (fuzzyMatch(q, ['checklist', 'what to do', 'steps', 'prepare', 'pack', 'ready'])) {
    return `✅ **Emergency Evacuation Checklist**\n\n1. ☐ Load medications, vet records, registration papers\n2. ☐ Fill water containers for transport\n3. ☐ Halter/tag all animals with your contact info\n4. ☐ Load pregnant/injured animals first\n5. ☐ Open gates for animals you can't transport\n6. ☐ Close windows/doors on structures\n7. ☐ Turn off propane/gas\n8. ☐ Leave a note with animal count at farm entrance\n9. ☐ Take photos of all animals for identification\n10. ☐ Notify neighbors who aren't on the app\n\n📱 Share your location with someone not in the fire zone.`;
  }

  if (fuzzyMatch(q, ['contact', 'phone', 'call', 'number'])) {
    const lines = facilities
      .filter((f) => f.contact)
      .map((f) => `• **${f.name}:** ${f.contact}`);
    return `📞 **Emergency Contacts**\n\n${lines.join('\n')}\n\n• **911** — Life-threatening emergency\n• **CAL FIRE:** 800-468-4408\n• **SD County Animal Services:** 619-767-2675\n• **SD Humane Society:** 619-299-7012`;
  }

  if (fuzzyMatch(q, ['thank', 'thanks', 'ok', 'got it', 'cool', 'great'])) {
    return `Stay safe out there. Remember: **no animal is worth your life**. If conditions worsen, evacuate yourself immediately.\n\nI'm here if you need anything else.`;
  }

  return `I'm not sure about that. Try asking about:\n\n• **"fire status"** — current fire details\n• **"my farm"** — your risk level and time remaining\n• **"shelters"** — available evacuation facilities\n• **"who needs help"** — farms requesting assistance\n• **"neighbors"** — who can help nearby\n• **"routes"** — evacuation directions\n• **"checklist"** — what to do before leaving\n• **"contacts"** — emergency phone numbers`;
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
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Hi! I'm your **NoHerdLeft** emergency assistant. Ask me anything about the fire, your farm, shelters, or neighbors. Type **"help"** to see what I can do.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg = { id: Date.now().toString(), role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = buildResponse(trimmed, {
        fireData,
        facilities,
        fellowFarmers,
        getFacilityStatus,
        getDestinationRisk,
      });
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', text: response },
      ]);
      setIsTyping(false);
    }, TYPING_DELAY + Math.random() * 300);
  }, [input, fireData, facilities, fellowFarmers, getFacilityStatus, getDestinationRisk]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f97316, #dc2626)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-bold text-white leading-none">Emergency Assistant</h3>
          <p className="text-[10px] text-emerald-400 font-medium mt-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
            Online — Real-time data
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scroll-light">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[12px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-br-md'
                    : 'bg-white/[0.07] text-coal-200 border border-white/[0.06] rounded-bl-md'
                }`}
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
        {['My farm status', 'Shelters', 'Who needs help?', 'Fire info'].map((q) => (
          <button
            key={q}
            onClick={() => {
              const userMsg = { id: Date.now().toString(), role: 'user', text: q };
              setMessages((prev) => [...prev, userMsg]);
              setIsTyping(true);
              setTimeout(() => {
                const response = buildResponse(q, { fireData, facilities, fellowFarmers, getFacilityStatus, getDestinationRisk });
                setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', text: response }]);
                setIsTyping(false);
              }, TYPING_DELAY + Math.random() * 300);
            }}
            className="text-[10px] font-semibold px-2.5 py-1 rounded-full border border-white/10 text-coal-300 hover:text-white hover:border-orange-500/40 hover:bg-orange-500/10 transition-all"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-3 pb-3 pt-1.5">
        <div className="flex items-center gap-2 bg-white/[0.06] border border-white/[0.08] rounded-xl px-3 py-2 focus-within:border-orange-500/40 transition-colors">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about fire, shelters, neighbors..."
            className="flex-1 bg-transparent text-sm text-white placeholder-coal-500 outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
            style={{ background: input.trim() ? 'linear-gradient(135deg, #f97316, #dc2626)' : 'transparent' }}
          >
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
