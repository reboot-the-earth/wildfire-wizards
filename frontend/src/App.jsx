import { useState, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import CountdownBanner from './components/layout/CountdownBanner';
import LeftSidebar from './components/layout/LeftSidebar';
import RightSidebar from './components/layout/RightSidebar';
import ProjectFooter from './components/layout/ProjectFooter';
import EvacMap from './components/map/EvacMap';
import DemoController from './components/demo/DemoController';
import { useDemoMode } from './hooks/useDemoMode';
import { mockFireData } from './data/mockFireData';
import { mockFacilities } from './data/mockFacilities';
import { mockRoutes } from './data/mockRoutes';
import { demoFarms, mockEvacuationPlan, DEMO_STEPS } from './data/mockFarmProfiles';
import { fetchFarmerPlan } from './utils/api';

const DEFAULT_FARM_DATA = {
  name: '',
  address: '',
  location: null,
  animals: [],
  transport: { trailers: 1, type: 'stock_trailer' },
};

export default function App() {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(false);
  const [farmData, setFarmData] = useState(DEFAULT_FARM_DATA);
  const [hasPlan, setHasPlan] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mapCenter, setMapCenter] = useState([33.24, -117.18]);
  const [mapZoom, setMapZoom] = useState(11);
  const [activeFarm, setActiveFarm] = useState(null);
  const [showRoutes, setShowRoutes] = useState(false);
  const [livePlan, setLivePlan] = useState(null);
  const [planSource, setPlanSource] = useState(null);

  const demo = useDemoMode();

  const currentCountdownHours = useMemo(() => {
    if (demo.isDemoMode && demo.step?.activeFarm) {
      const farm = mockFireData.farms_at_risk.find(
        (f) => f.farm_id === demo.step.activeFarm
      );
      return farm?.estimated_time_to_fire_hours || 3.7;
    }
    return 3.7;
  }, [demo.isDemoMode, demo.step]);

  const handleGeneratePlan = useCallback(async () => {
    setIsGenerating(true);
    const matchedRiskFarm = farmData.location
      ? mockFireData.farms_at_risk.find(
          (f) =>
            Math.abs((f.lat ?? 0) - farmData.location.lat) < 0.05 &&
            Math.abs((f.lon ?? 0) - farmData.location.lon) < 0.05
        )
      : null;
    const timeAvailableHours =
      matchedRiskFarm?.estimated_time_to_fire_hours ?? currentCountdownHours ?? 3.7;

    const farmId = (farmData.name || 'farm')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');

    const plan = await fetchFarmerPlan({
      farm: {
        id: farmId,
        name: farmData.name || 'Your Farm',
        lat: farmData.location?.lat ?? null,
        lon: farmData.location?.lon ?? null,
      },
      animals: farmData.animals || [],
      transport: farmData.transport || { trailers: 1, type: 'stock_trailer' },
      timeAvailableHours,
    });

    if (plan) {
      setLivePlan(plan);
      setPlanSource('live');
    } else {
      setLivePlan(null);
      setPlanSource('mock');
    }

    setIsGenerating(false);
    setHasPlan(true);
    setShowRoutes(true);
    setRightOpen(true);
    setLeftOpen(false);
  }, [farmData, currentCountdownHours]);

  const handleDemoStepChange = useCallback((step) => {
    if (!step) return;
    if (step.mapCenter) setMapCenter(step.mapCenter);
    if (step.mapZoom) setMapZoom(step.mapZoom);
    setShowRoutes(step.showRoutes || false);
    setActiveFarm(step.activeFarm || null);

    if (step.activeFarm) {
      setHasPlan(true);
      setRightOpen(true);
      setLeftOpen(false);
    } else {
      setHasPlan(false);
      setRightOpen(false);
    }
  }, []);

  const handleDemoNext = useCallback(() => {
    demo.nextStep();
    const nextIdx = Math.min(demo.currentStep + 1, demo.totalSteps - 1);
    handleDemoStepChange(DEMO_STEPS[nextIdx]);
  }, [demo, handleDemoStepChange]);

  const handleDemoPrev = useCallback(() => {
    demo.prevStep();
    const prevIdx = Math.max(demo.currentStep - 1, 0);
    handleDemoStepChange(DEMO_STEPS[prevIdx]);
  }, [demo, handleDemoStepChange]);

  const handleStartDemo = useCallback(() => {
    demo.startDemo();
    handleDemoStepChange(DEMO_STEPS[0]);
  }, [demo, handleDemoStepChange]);

  const effectiveShowFarms = demo.isDemoMode ? demo.step?.showFarms ?? true : true;
  const effectiveShowFire = demo.isDemoMode ? demo.step?.showFire ?? true : true;

  const noSafeRoutes = showRoutes
    ? mockRoutes.routes_to_facilities?.filter((r) => r.status === 'no_safe_route') || []
    : [];

  const totalAnimalsAtRisk = useMemo(
    () => (mockFireData.farms_at_risk || [])
      .reduce((acc, f) => acc + (f.animal_count || f.animals_count || 0), 0)
      || 299,
    []
  );

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden ember-bg text-coal-100">
      <CountdownBanner
        hoursRemaining={currentCountdownHours}
        farmName={activeFarm ? demoFarms.find((f) => f.id === activeFarm)?.name : null}
        fireName="Lilac Fire — Bonsall"
        farmsAtRisk={(mockFireData.farms_at_risk || []).length || 3}
        animalsAtRisk={totalAnimalsAtRisk}
        windMph={mockFireData.wind?.speed_mph || 35}
        planSource={hasPlan ? planSource : null}
      />

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden relative">
        <LeftSidebar
          isOpen={leftOpen && !demo.isDemoMode}
          onToggle={() => setLeftOpen(!leftOpen)}
          onGeneratePlan={handleGeneratePlan}
          farmData={farmData}
          setFarmData={setFarmData}
          isGenerating={isGenerating}
        />

        {/* Map */}
        <div className="flex-1 relative">
          <EvacMap
            center={mapCenter}
            zoom={mapZoom}
            fireData={effectiveShowFire ? mockFireData : null}
            facilities={mockFacilities}
            routes={showRoutes ? mockRoutes : null}
            farms={effectiveShowFarms ? mockFireData.farms_at_risk : null}
            showFire={effectiveShowFire}
            showFacilities={true}
            showRoutes={showRoutes}
            showFarms={effectiveShowFarms}
            activeFarm={activeFarm}
          />

          {/* Weather strip */}
          <div className="absolute top-3 left-3 z-20 glass-coal rounded-xl shadow-coal-lift flex items-center gap-3 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[11px] font-bold text-red-300 tabular-nums">{mockFireData.weather.temp_f}°F</span>
            </div>
            <div className="w-px h-3.5 bg-white/10" />
            <span className="text-[11px] text-coal-300">
              <span className="text-sky-300 font-semibold tabular-nums">{mockFireData.weather.humidity_pct}%</span> hum
            </span>
            <div className="w-px h-3.5 bg-white/10" />
            <span className="text-[11px] text-coal-300">
              Wind <span className="text-sky-300 font-semibold tabular-nums">{mockFireData.wind.speed_mph}</span>
              <span className="text-coal-400">mph</span>
              {mockFireData.wind.gusts_mph > mockFireData.wind.speed_mph && (
                <span className="text-coal-400"> · g{mockFireData.wind.gusts_mph}</span>
              )}
            </span>
          </div>

          {/* Legend */}
          <div className="absolute bottom-[228px] right-3 z-20 glass-coal rounded-xl px-3 py-2.5 shadow-coal-lift">
            <div className="text-[9px] text-coal-400 uppercase tracking-widest mb-1.5 font-bold">Spread Forecast</div>
            <div className="space-y-1">
              {[
                { color: '#ef4444', label: 'Active' },
                { color: '#fb923c', label: '1 hr' },
                { color: '#facc15', label: '2 hr' },
                { color: '#eab308', label: '4 hr' },
                { color: '#a16207', label: '6 hr' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="w-4 h-[3px] rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}66` }} />
                  <span className="text-[10px] text-coal-200">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* No safe route alert */}
          <AnimatePresence>
            {noSafeRoutes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute top-16 left-1/2 -translate-x-1/2 z-20 glass-warm rounded-xl px-4 py-2.5 shadow-ember-glow max-w-sm w-[90%]"
              >
                {noSafeRoutes.map((r) => (
                  <div key={r.facility_id} className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-red-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <div className="text-xs font-bold text-red-200">No Safe Route</div>
                      <div className="text-[11px] text-red-300/90">{r.facility_name}: {r.reason}</div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Demo mode button */}
          {!demo.isDemoMode && (
            <button
              onClick={handleStartDemo}
              className="absolute bottom-4 left-4 z-20 glass-coal rounded-xl px-4 py-2.5 text-[11px] text-coal-200 hover:text-white transition-colors shadow-coal-lift flex items-center gap-2 font-medium hover:border-ember-400/40 group"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ember-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-ember-500" />
              </span>
              <span className="uppercase tracking-widest text-[10px] font-bold">Run Demo Walkthrough</span>
            </button>
          )}

          {/* Project info / Open Data / Submission link */}
          {!demo.isDemoMode && <ProjectFooter />}
        </div>

        {/* Right Sidebar */}
        <RightSidebar
          isOpen={rightOpen && hasPlan}
          onToggle={() => setRightOpen(!rightOpen)}
          plan={hasPlan ? (livePlan?.priority_plan ?? mockEvacuationPlan.priority_plan) : []}
          checklist={hasPlan ? (livePlan?.checklist ?? mockEvacuationPlan.checklist) : null}
          triageWarning={hasPlan ? (livePlan?.triage_warning ?? mockEvacuationPlan.triage_warning) : null}
          timeEstimate={hasPlan ? (livePlan?.time_estimate ?? mockEvacuationPlan.time_estimate) : null}
          planSource={hasPlan ? planSource : null}
        />
      </div>

      {/* Demo Controller */}
      <DemoController
        isDemoMode={demo.isDemoMode}
        currentStep={demo.currentStep}
        totalSteps={demo.totalSteps}
        step={demo.step}
        onNext={handleDemoNext}
        onPrev={handleDemoPrev}
        onExit={demo.exitDemo}
        isFirst={demo.isFirstStep}
        isLast={demo.isLastStep}
      />
    </div>
  );
}
