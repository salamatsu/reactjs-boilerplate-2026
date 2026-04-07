// ============================================
// SCAN2WIN — Prize Pool Config
// Worldbex Events "Scan to Win" Platform
//
// Route: /admin/pool  (secret — no nav link)
// Actor: Admin only
//
// Allows the admin to toggle isPool (0 / 1) per
// prize to control which prizes can actually be won
// on the roulette wheel.
//
//   isPool: 1 → eligible to win
//   isPool: 0 → shown on wheel for visual variety only
// ============================================

import { useMemo, useState } from "react";
import {
  Button,
  Card,
  Spin,
  Switch,
  Typography,
  message,
  Badge,
} from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { Layers, Trophy } from "lucide-react";
import { useGetPrizes, useUpdatePrizePool } from "../../services/requests/useApi";

const { Title, Text } = Typography;

// ─── Prize Pool Config Page ───────────────────────────────────────────────────

const PrizePoolConfig = () => {
  const { data: prizes = [], isLoading } = useGetPrizes();
  const { mutateAsync: savePool, isPending: saving } = useUpdatePrizePool();

  // User-driven overrides: { [prizeId]: 0 | 1 }
  // Kept separate from server data so the initial values come from prizes
  // (via useMemo) and user toggles layer on top via this state.
  const [overrides, setOverrides] = useState({});

  // Merged pool map: server defaults + user overrides (derived during render)
  const poolMap = useMemo(() => {
    const base = {};
    prizes.forEach((p) => { base[p.id] = p.isPool; });
    return { ...base, ...overrides };
  }, [prizes, overrides]);

  const toggle = (id) => {
    setOverrides((prev) => ({ ...prev, [id]: poolMap[id] === 1 ? 0 : 1 }));
  };

  const handleSave = async () => {
    try {
      const poolData = Object.entries(poolMap).map(([id, isPool]) => ({
        id,
        isPool,
      }));
      await savePool(poolData);
      message.success("Prize pool configuration saved.");
    } catch {
      message.error("Failed to save pool configuration.");
    }
  };

  const poolCount = Object.values(poolMap).filter((v) => v === 1).length;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <Layers size={24} className="text-[#fd9114]" />
          <div>
            <Title level={4} className="!mb-0">
              Prize Pool Config
            </Title>
            <Text type="secondary" className="text-xs">
              Toggle which prizes can actually be won on the roulette wheel.
            </Text>
          </div>
        </div>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={saving}
          onClick={handleSave}
          style={{ background: "#fd9114", borderColor: "#fd9114" }}
          aria-label="Save pool configuration"
        >
          Save
        </Button>
      </div>

      {/* Pool summary badge */}
      <div className="mb-6">
        <Badge
          count={poolCount}
          showZero
          style={{ backgroundColor: "#00D68F" }}
        >
          <Text type="secondary" className="text-sm">
            prizes in pool (eligible to win)
          </Text>
        </Badge>
      </div>

      {/* Prize toggle list */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spin size="large" />
        </div>
      ) : prizes.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Trophy size={40} className="mx-auto mb-3 opacity-30" />
          <p>No prizes found. Add prizes in the Roulette Prizes CMS first.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {prizes.map((prize) => {
            const inPool = poolMap[prize.id] === 1;
            return (
              <Card
                key={prize.id}
                size="small"
                className={`rounded-xl border transition-all ${
                  inPool
                    ? "border-[#00D68F]/40 bg-[#00D68F]/5"
                    : "border-gray-100"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {prize.image ? (
                      <img
                        src={prize.image}
                        alt={prize.name}
                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        <Trophy size={18} className="text-gray-300" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {prize.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {inPool ? "Eligible to win" : "Display only"}
                      </p>
                    </div>
                  </div>

                  {/* isPool toggle */}
                  <Switch
                    checked={inPool}
                    onChange={() => toggle(prize.id)}
                    checkedChildren="Pool"
                    unCheckedChildren="Off"
                    style={inPool ? { backgroundColor: "#00D68F" } : {}}
                    aria-label={`Toggle pool for ${prize.name}`}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Helper note */}
      <div className="mt-6 rounded-xl bg-gray-50 p-4 text-xs text-gray-500 leading-relaxed">
        <strong>How it works:</strong> Prizes with{" "}
        <span className="text-[#00D68F] font-semibold">Pool ON</span> are
        eligible to be randomly selected as the winner after the spin.
        Prizes with <strong>Pool OFF</strong> appear on the wheel for visual
        variety but can never be the winning outcome. Make sure at least{" "}
        <strong>one prize is in the pool</strong> before the event starts.
      </div>
    </div>
  );
};

export default PrizePoolConfig;
