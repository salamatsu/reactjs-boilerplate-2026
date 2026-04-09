// ============================================
// SCAN2WIN — Admin Analytics Dashboard
// Route: /admin/analytics
// Sections: Participants · Booths · QR Codes · Entries · Prizes · Funnel
// ============================================

import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { formatUTC, DATE_FORMATS } from "../../utils/formatDate";
import {
  App,
  Button,
  Collapse,
  Empty,
  Input,
  Progress,
  Select,
  Spin,
  Statistic,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  BarChartOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  OrderedListOutlined,
  PieChartOutlined,
  ReloadOutlined,
  SearchOutlined,
  TrophyOutlined,
  UserOutlined,
  QrcodeOutlined,
  ShopOutlined,
  PlayCircleOutlined,
  GiftOutlined,
  FunnelPlotOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import {
  useListCampaigns,
  useParticipantAnalytics,
  useBoothAnalytics,
  useRaffleQrAnalytics,
  useEntryAnalytics,
  usePrizeAnalytics,
  useFunnelAnalytics,
  useExportParticipants,
  useExportClaims,
  useExportSurveyResponses,
  useExportFull,
} from "../../services/requests/useApi";

const { Text, Title } = Typography;

// ─── Palette ──────────────────────────────────────────────────────────────────

const C = {
  primary: "#1E3A71",
  accent: "#fd9114",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",
  purple: "#8B5CF6",
  pink: "#EC4899",
  teal: "#14B8A6",
  bg: "#F8FAFC",
  card: "#ffffff",
  border: "#E5E7EB",
  muted: "#6B7280",
  text: "#1A1A2E",
};

const BAR_COLORS = [C.info, C.success, C.accent, C.purple, C.pink, C.teal, C.warning, C.danger];

// ─── Shared UI ────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, sub, color = C.primary, icon }) => (
  <div
    className="rounded-2xl p-4 flex flex-col gap-1"
    style={{ background: C.card, border: `1px solid ${C.border}` }}
  >
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs font-medium" style={{ color: C.muted }}>{label}</span>
      {icon && (
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
          <span style={{ color, fontSize: 14 }}>{icon}</span>
        </div>
      )}
    </div>
    <div className="text-2xl font-black leading-tight" style={{ color }}>{value ?? "—"}</div>
    {sub ? <div className="text-xs" style={{ color: C.muted }}>{sub}</div> : null}
  </div>
);

const SectionCard = ({ title, children, action }) => (
  <div
    className="rounded-2xl overflow-hidden"
    style={{ background: C.card, border: `1px solid ${C.border}` }}
  >
    <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
      <span className="font-bold text-sm" style={{ color: C.text }}>{title}</span>
      {action}
    </div>
    <div className="p-4">{children}</div>
  </div>
);

const Bar = ({ pct, color, label, count, total }) => (
  <div className="flex items-center gap-3 py-1">
    <div className="w-28 shrink-0 text-xs truncate" style={{ color: C.text }} title={label}>{label}</div>
    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: C.bg }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct ?? 0}%`, background: color }}
      />
    </div>
    <div className="text-xs font-mono w-16 text-right shrink-0" style={{ color: C.muted }}>
      {count}{total != null ? ` / ${total}` : ""} <span style={{ color: `${color}` }}>{pct != null ? `(${pct}%)` : ""}</span>
    </div>
  </div>
);

const LoadingPane = () => (
  <div className="flex justify-center items-center py-16"><Spin /></div>
);

const ErrorPane = ({ onRetry }) => (
  <div className="flex flex-col items-center gap-3 py-16">
    <Text type="secondary">Failed to load data.</Text>
    <Button size="small" onClick={onRetry} icon={<ReloadOutlined />}>Retry</Button>
  </div>
);

const fmt = (n) => (n == null ? "—" : Number(n).toLocaleString());
const pct = (n) => (n == null ? "—" : `${Number(n).toFixed(1)}%`);

// ─── Tab: Participants ─────────────────────────────────────────────────────────

const ParticipantsTab = ({ campaignId }) => {
  const { data, isLoading, isError, refetch } = useParticipantAnalytics(campaignId);
  if (isLoading) return <LoadingPane />;
  if (isError) return <ErrorPane onRetry={refetch} />;

  const d = data?.data ?? {};
  const totals = d.totals ?? {};
  const byDay = d.byDay ?? [];
  const byStatus = d.byStatus ?? [];
  const topBooths = d.topBooths ?? [];

  return (
    <div className="flex flex-col gap-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Participants" value={fmt(totals.total)} color={C.info} icon={<UserOutlined />} />
        <StatCard label="Active" value={fmt(totals.active)} color={C.success} icon={<UserOutlined />} />
        <StatCard label="Threshold Reached" value={fmt(totals.thresholdReached)} color={C.accent} icon={<TrophyOutlined />} />
        <StatCard label="Completion Rate" value={pct(totals.completionRate)} color={C.purple} sub="reached threshold" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* By status */}
        {byStatus.length > 0 ? (
          <SectionCard title="By Status">
            <div className="flex flex-col gap-1">
              {byStatus.map((s, i) => (
                <Bar key={s.status} label={s.status} count={s.count} pct={s.percentage} color={BAR_COLORS[i % BAR_COLORS.length]} />
              ))}
            </div>
          </SectionCard>
        ) : null}

        {/* Top booths by participants */}
        {topBooths.length > 0 ? (
          <SectionCard title="Top Booths by Participants">
            <div className="flex flex-col gap-1">
              {topBooths.map((b, i) => (
                <Bar key={b.boothId} label={b.boothName ?? `Booth ${b.boothId}`} count={b.participants} pct={b.percentage} color={BAR_COLORS[i % BAR_COLORS.length]} />
              ))}
            </div>
          </SectionCard>
        ) : null}
      </div>

      {/* Daily registrations */}
      {byDay.length > 0 ? (
        <SectionCard title="Daily Registrations">
          <Table
            size="small"
            dataSource={byDay.map((r, i) => ({ ...r, key: i }))}
            pagination={false}
            columns={[
              { title: "Date", dataIndex: "date", key: "date", render: (v) => <span className="font-mono text-xs">{v}</span> },
              { title: "New Participants", dataIndex: "count", key: "count", align: "right", render: (v) => <span className="font-bold">{fmt(v)}</span> },
              { title: "Cumulative", dataIndex: "cumulative", key: "cumulative", align: "right", render: (v) => fmt(v) },
            ]}
          />
        </SectionCard>
      ) : null}
    </div>
  );
};

// ─── Tab: Booths ──────────────────────────────────────────────────────────────

const BoothsTab = ({ campaignId }) => {
  const { data, isLoading, isError, refetch } = useBoothAnalytics(campaignId);
  if (isLoading) return <LoadingPane />;
  if (isError) return <ErrorPane onRetry={refetch} />;

  const d = data?.data ?? {};
  const summary = d.summary ?? {};
  const booths = d.booths ?? [];
  // API returns scansByDay
  const byDay = d.scansByDay ?? d.byDay ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Scans" value={fmt(summary.totalScans)} color={C.info} icon={<ShopOutlined />} />
        {/* API field: participantsWhoScanned */}
        <StatCard label="Unique Participants" value={fmt(summary.participantsWhoScanned ?? summary.uniqueParticipants)} color={C.success} />
        {/* API field: totalPointsDistributed */}
        <StatCard label="Points Distributed" value={fmt(summary.totalPointsDistributed ?? summary.pointsDistributed)} color={C.accent} />
        {/* API field: avgBoothsPerParticipant */}
        <StatCard label="Avg Booths / Participant" value={summary.avgBoothsPerParticipant != null ? Number(summary.avgBoothsPerParticipant).toFixed(1) : summary.avgScansPerBooth != null ? Number(summary.avgScansPerBooth).toFixed(1) : "—"} color={C.purple} />
      </div>

      {booths.length > 0 ? (
        <SectionCard title="Per-Booth Breakdown">
          <Table
            size="small"
            dataSource={booths.map((b) => ({ ...b, key: b.id ?? b.boothId }))}
            pagination={{ pageSize: 10, size: "small" }}
            columns={[
              { title: "Booth", dataIndex: "boothName", key: "boothName", render: (v, r) => <><div className="font-semibold text-xs">{v}</div><div className="text-[10px] font-mono" style={{ color: C.muted }}>{r.boothCode}</div></> },
              { title: "Scans", dataIndex: "totalScans", key: "totalScans", align: "right", render: (v) => fmt(v) },
              { title: "Unique", dataIndex: "uniqueParticipants", key: "uniqueParticipants", align: "right", render: (v) => fmt(v) },
              {
                title: "Points",
                key: "points",
                align: "right",
                // API field: totalPointsDistributed
                render: (_, r) => fmt(r.totalPointsDistributed ?? r.pointsDistributed),
              },
            ]}
          />
        </SectionCard>
      ) : null}

      {byDay.length > 0 ? (
        <SectionCard title="Scan Volume by Day">
          <div className="flex flex-col gap-1">
            {byDay.map((d, i) => (
              <Bar key={d.date} label={d.date} count={d.scans} color={BAR_COLORS[i % BAR_COLORS.length]} />
            ))}
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
};

// ─── Tab: QR Codes ────────────────────────────────────────────────────────────

const QrTab = ({ campaignId }) => {
  const { data, isLoading, isError, refetch } = useRaffleQrAnalytics(campaignId);
  if (isLoading) return <LoadingPane />;
  if (isError) return <ErrorPane onRetry={refetch} />;

  const d = data?.data ?? {};

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Generated" value={fmt(d.total)} color={C.info} icon={<QrcodeOutlined />} />
        <StatCard label="Active" value={fmt(d.active)} color={C.success} />
        <StatCard label="Used" value={fmt(d.used)} color={C.accent} />
        <StatCard label="Expired" value={fmt(d.expired)} color={C.danger} />
        <StatCard label="Conversion Rate" value={pct(d.conversionRate)} color={C.purple} sub="used / generated" />
        <StatCard label="Avg Time to Use" value={d.avgSecondsToUse != null ? `${Math.round(d.avgSecondsToUse / 60)} min` : "—"} color={C.teal} sub="from generation" />
      </div>

      {/* Visual breakdown */}
      <SectionCard title="Status Breakdown">
        <div className="flex flex-col gap-2">
          {[
            { label: "Used", count: d.used, total: d.total, color: C.success },
            { label: "Active (unused)", count: d.active, total: d.total, color: C.info },
            { label: "Expired", count: d.expired, total: d.total, color: C.danger },
          ].map((r) => (
            <Bar
              key={r.label}
              label={r.label}
              count={r.count}
              pct={r.total ? Math.round((r.count / r.total) * 100) : 0}
              color={r.color}
            />
          ))}
        </div>
      </SectionCard>
    </div>
  );
};

// ─── Tab: Entries (Spin Wheel) ────────────────────────────────────────────────

const EntriesTab = ({ campaignId }) => {
  const { data, isLoading, isError, refetch } = useEntryAnalytics(campaignId);
  if (isLoading) return <LoadingPane />;
  if (isError) return <ErrorPane onRetry={refetch} />;

  const d = data?.data ?? {};
  const totals = d.totals ?? {};
  // API: winRate is top-level, not inside totals
  const winRate = d.winRate ?? totals.winRate;
  // API: wheelResults instead of byOutcome
  const rawOutcomes = d.wheelResults ?? d.byOutcome ?? [];
  const totalOutcomeCount = rawOutcomes.reduce((s, o) => s + (o.count ?? 0), 0);
  const byOutcome = rawOutcomes.map((o) => ({
    outcome: o.wheelResult ?? o.outcome,
    count: o.count,
    percentage: totalOutcomeCount ? Math.round((o.count / totalOutcomeCount) * 100) : 0,
  }));
  // API: entriesByDay instead of byDay
  const byDay = (d.entriesByDay ?? d.byDay ?? []).map((r) => ({
    date: r.date,
    // API field: entries; fallback to spins
    spins: r.entries ?? r.spins,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Spins" value={fmt(totals.total)} color={C.info} icon={<PlayCircleOutlined />} />
        <StatCard label="Won" value={fmt(totals.won)} color={C.success} />
        <StatCard label="Lost" value={fmt(totals.lost)} color={C.muted} />
        <StatCard label="Win Rate" value={pct(winRate)} color={C.accent} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {byOutcome.length > 0 ? (
          <SectionCard title="Wheel Results Breakdown">
            <div className="flex flex-col gap-1">
              {byOutcome.map((o, i) => (
                <Bar key={o.outcome} label={o.outcome} count={o.count} pct={o.percentage} color={BAR_COLORS[i % BAR_COLORS.length]} />
              ))}
            </div>
          </SectionCard>
        ) : null}

        {byDay.length > 0 ? (
          <SectionCard title="Spins by Day">
            <div className="flex flex-col gap-1">
              {byDay.map((d, i) => (
                <Bar key={d.date} label={d.date} count={d.spins} color={BAR_COLORS[i % BAR_COLORS.length]} />
              ))}
            </div>
          </SectionCard>
        ) : null}
      </div>
    </div>
  );
};

// ─── Tab: Prizes ──────────────────────────────────────────────────────────────

const PrizesTab = ({ campaignId }) => {
  const { data, isLoading, isError, refetch } = usePrizeAnalytics(campaignId);
  if (isLoading) return <LoadingPane />;
  if (isError) return <ErrorPane onRetry={refetch} />;

  const d = data?.data ?? {};
  const cs = d.claimSummary ?? {};
  const prizes = d.prizes ?? [];
  const byDay = d.claimsByDay ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Won" value={fmt(cs.total)} color={C.accent} icon={<GiftOutlined />} />
        <StatCard label="Claimed" value={fmt(cs.claimed)} color={C.success} />
        <StatCard label="Forfeited" value={fmt(cs.forfeited)} color={C.danger} />
        <StatCard label="Forfeiture Rate" value={pct(cs.forfeitureRate)} color={C.warning} />
      </div>

      {prizes.length > 0 ? (
        <SectionCard title="Per-Prize Breakdown">
          <Table
            size="small"
            dataSource={prizes.map((p) => {
              // API: won/claimed/forfeited nested under byStatus
              const byStatus = p.byStatus ?? {};
              const won = p.won ?? byStatus.won ?? 0;
              const claimed = p.claimed ?? byStatus.claimed ?? 0;
              const forfeited = p.forfeited ?? byStatus.forfeited ?? 0;
              const claimRate = won > 0 ? Math.round((claimed / won) * 100) : 0;
              return {
                ...p,
                key: p.id ?? p.prizeId,
                _won: won,
                _claimed: claimed,
                _forfeited: forfeited,
                _claimRate: claimRate,
              };
            })}
            pagination={{ pageSize: 10, size: "small" }}
            columns={[
              { title: "Prize", dataIndex: "prizeName", key: "prizeName", render: (v) => <span className="font-semibold text-xs">{v}</span> },
              { title: "Won", dataIndex: "_won", key: "_won", align: "right", render: (v) => fmt(v) },
              { title: "Claimed", dataIndex: "_claimed", key: "_claimed", align: "right", render: (v) => <span style={{ color: C.success, fontWeight: 700 }}>{fmt(v)}</span> },
              { title: "Forfeited", dataIndex: "_forfeited", key: "_forfeited", align: "right", render: (v) => <span style={{ color: v > 0 ? C.danger : C.muted }}>{fmt(v)}</span> },
              { title: "Claim Rate", dataIndex: "_claimRate", key: "_claimRate", align: "right", render: (v) => (
                <div className="flex items-center gap-2 justify-end">
                  <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: C.border }}>
                    <div className="h-full rounded-full" style={{ width: `${v ?? 0}%`, background: C.success }} />
                  </div>
                  <span className="font-mono text-xs">{pct(v)}</span>
                </div>
              )},
            ]}
          />
        </SectionCard>
      ) : null}

      {byDay.length > 0 ? (
        <SectionCard title="Claims by Day">
          <div className="flex flex-col gap-1">
            {byDay.map((d, i) => (
              <Bar key={d.date} label={d.date} count={d.claims} color={BAR_COLORS[i % BAR_COLORS.length]} />
            ))}
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
};

// ─── Tab: Funnel ──────────────────────────────────────────────────────────────

const FUNNEL_ICONS = ["👤", "📷", "🔑", "✅", "🎡", "🏆", "📦"];
const FUNNEL_COLORS = [C.info, C.teal, C.purple, C.success, C.accent, C.warning, C.danger];

const FunnelTab = ({ campaignId }) => {
  const { data, isLoading, isError, refetch } = useFunnelAnalytics(campaignId);
  if (isLoading) return <LoadingPane />;
  if (isError) return <ErrorPane onRetry={refetch} />;

  const d = data?.data ?? {};
  const funnel = d.funnel ?? [];
  const overall = d.overallConversionRate;
  const top = funnel[0]?.count || 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <StatCard label="Overall Conversion Rate" value={pct(overall)} color={C.success} sub="Registered → Claimed" />
        <StatCard label="Total Registered" value={fmt(funnel[0]?.count)} color={C.info} sub="top of funnel" />
      </div>

      <SectionCard title="Conversion Funnel">
        <div className="flex flex-col gap-3">
          {funnel.map((step, i) => {
            const widthPct = Math.round((step.count / top) * 100);
            // API field: dropOffFromPrev
            const dropOff = step.dropOffFromPrev ?? step.dropOffRate ?? step.dropoffRate;
            return (
              <div key={step.step} className="relative">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-base w-6 text-center leading-none">{FUNNEL_ICONS[i] ?? "•"}</span>
                  <span className="text-sm font-semibold flex-1" style={{ color: C.text }}>{step.label}</span>
                  <span className="text-sm font-black" style={{ color: FUNNEL_COLORS[i] }}>{fmt(step.count)}</span>
                  {dropOff != null && i > 0 ? (
                    <Tooltip title="Drop-off from previous step">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: "#FEF2F2", color: C.danger }}>
                        -{pct(dropOff)}
                      </span>
                    </Tooltip>
                  ) : null}
                </div>
                <div className="h-3 rounded-full overflow-hidden ml-9" style={{ background: C.bg }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${widthPct}%`, background: FUNNEL_COLORS[i], opacity: 0.85 }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {funnel.length === 0 ? <Empty description="No funnel data" /> : null}
      </SectionCard>
    </div>
  );
};

// ─── Tab: Export ─────────────────────────────────────────────────────────────

const fmtDate = (v) => formatUTC(v);

// Fields that are internal IDs — hidden from table display and CSV export
const HIDDEN_FIELDS = new Set([
  "id", "campaignId", "participantId", "surveyId", "questionId",
  "optionId", "raffleEntryId", "claimId", "scanLogId", "responseId",
  "boothId", "prizeId", "entryId", "rowId", "matrixRowId", "updatedAt",
]);

const downloadJson = (data, filename) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

const downloadCsv = (rows, filename) => {
  if (!rows?.length) return;
  const flatRows = rows.map((r) => {
    const flat = {};
    Object.entries(r).forEach(([k, v]) => {
      if (k.startsWith("_") || HIDDEN_FIELDS.has(k)) return;
      flat[k] = typeof v === "object" && v !== null ? JSON.stringify(v) : (v ?? "");
    });
    return flat;
  });
  const headers = Object.keys(flatRows[0]);
  const escape = (v) => {
    const s = String(v ?? "");
    return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(","), ...flatRows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

const ExStatusTag = ({ value }) => {
  if (value == null) return <span style={{ color: C.muted }}>—</span>;
  const colorMap = {
    active: "success", inactive: "default", completed: "success",
    pending: "warning", forfeited: "error", claimed: "success",
    won: "success", lost: "default", expired: "error",
    draft: "default", ended: "default", registered: "processing",
  };
  return <Tag color={colorMap[String(value).toLowerCase()] ?? "default"} className="text-xs capitalize">{value}</Tag>;
};

// ── Answer visualizer — renders each answer based on questionType ──────────────
const AnswerValue = ({ answer }) => {
  const type = (answer.questionType ?? "").toLowerCase().replace(/[_\s-]/g, "");
  const { answerText, answerOptionText, answerNumeric, answerDate, answerJson } = answer;

  // Rating / Scale / NPS → number badge + filled dots (only when answerNumeric is present)
  if (type.includes("rating") || type.includes("scale") || type.includes("nps") || (type.includes("likert") && answerNumeric != null)) {
    if (answerNumeric == null) return <span style={{ color: C.muted }}>—</span>;
    const max = type.includes("nps") ? 10 : type.includes("scale") ? 10 : 5;
    const n = Number(answerNumeric);
    const color = n >= max * 0.7 ? C.success : n >= max * 0.4 ? C.warning : C.danger;
    return (
      <div className="flex items-center gap-2">
        <span className="font-bold text-sm" style={{ color }}>{n}</span>
        <div className="flex gap-0.5">
          {Array.from({ length: max }).map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ background: i < n ? color : C.border }}
            />
          ))}
        </div>
        <span className="text-xs" style={{ color: C.muted }}>/ {max}</span>
      </div>
    );
  }

  // Likert (text option, e.g. "Excellent") → single tag
  if (type.includes("likert")) {
    return answerOptionText
      ? <Tag color="blue" className="text-xs">{answerOptionText}</Tag>
      : answerText
      ? <Tag color="blue" className="text-xs">{answerText}</Tag>
      : <span style={{ color: C.muted }}>—</span>;
  }

  // Checkbox / Multi-select → multiple tags from answerJson[]
  if (type.includes("checkbox") || type.includes("multiselect") || type.includes("multi") || type.includes("multiple")) {
    const rawOptions = Array.isArray(answerJson) ? answerJson
      : answerJson ? Object.values(answerJson)
      : answerOptionText ? [answerOptionText]
      : [];
    // API may return [{ optionId }] objects without text — display as "Option #ID"
    const options = rawOptions.map((o) => {
      if (o == null) return "—";
      if (typeof o !== "object") return String(o);
      return o.optionText ?? o.text ?? o.label ?? o.value ?? (o.optionId != null ? `Option #${o.optionId}` : JSON.stringify(o));
    });
    return options.length
      ? <div className="flex flex-wrap gap-1">{options.map((o, i) => <Tag key={i} color="blue" className="text-xs">{o}</Tag>)}</div>
      : <span style={{ color: C.muted }}>—</span>;
  }

  // Multiple choice / Dropdown / Select → single tag
  if (type.includes("choice") || type.includes("select") || type.includes("dropdown")) {
    return answerOptionText
      ? <Tag color="geekblue" className="text-xs">{answerOptionText}</Tag>
      : answerText
      ? <Tag color="geekblue" className="text-xs">{answerText}</Tag>
      : <span style={{ color: C.muted }}>—</span>;
  }

  // Matrix → row/column pairs
  if (type.includes("matrix")) {
    const data = answerJson;
    if (!data) return <span style={{ color: C.muted }}>—</span>;

    // Extract readable label from a value that may be a plain string or an object
    const label = (v) => {
      if (v == null) return "—";
      if (typeof v !== "object") return String(v);
      return v.columnText ?? v.label ?? v.text ?? v.value ?? v.name ?? v.answer ?? JSON.stringify(v);
    };

    // Array of row objects: [{ rowText, columnText }, ...]
    if (Array.isArray(data)) {
      return (
        <div className="flex flex-col gap-0.5">
          {data.map((item, i) => {
            const rowLabel = item.rowText ?? item.row ?? item.label ?? item.name ?? `Row ${i + 1}`;
            const colLabel = label(item.columnText ?? item.answer ?? item.value ?? item);
            return (
              <div key={i} className="flex items-center gap-1.5">
                <span className="text-xs shrink-0" style={{ color: C.muted }}>{rowLabel}:</span>
                <Tag color="purple" className="text-xs !m-0">{colLabel}</Tag>
              </div>
            );
          })}
        </div>
      );
    }

    // Object: { "Row A": "Col X", "Row B": { ... } }
    return (
      <div className="flex flex-col gap-0.5">
        {Object.entries(data).map(([row, val]) => (
          <div key={row} className="flex items-center gap-1.5">
            <span className="text-xs shrink-0" style={{ color: C.muted }}>{row}:</span>
            <Tag color="purple" className="text-xs !m-0">{label(val)}</Tag>
          </div>
        ))}
      </div>
    );
  }

  // Boolean / Yes-No
  if (type.includes("bool") || type.includes("yesno")) {
    const val = answerText ?? String(answerNumeric ?? "");
    const isYes = /^(yes|true|1)$/i.test(val);
    return <Tag color={isYes ? "success" : "default"} className="text-xs">{val || "—"}</Tag>;
  }

  // Date
  if (type.includes("date")) {
    return <span className="text-xs font-mono">{fmtDate(answerDate ?? answerText) ?? "—"}</span>;
  }

  // Number / Numeric
  if (type.includes("number") || type.includes("numeric")) {
    return answerNumeric != null
      ? <span className="font-mono font-bold text-sm">{answerNumeric}</span>
      : <span style={{ color: C.muted }}>—</span>;
  }

  // Default: text
  const text = answerText ?? answerOptionText ?? (answerNumeric != null ? String(answerNumeric) : null);
  return text
    ? <span className="text-xs leading-relaxed">{text}</span>
    : <span style={{ color: C.muted }}>—</span>;
};

// ── Survey answers expanded panel ─────────────────────────────────────────────
const AnswersPanel = ({ answers }) => {
  if (!answers?.length) return <Empty description="No answers" image={Empty.PRESENTED_IMAGE_SIMPLE} className="py-2" />;
  return (
    <div className="grid gap-2 p-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
      {answers.map((a, i) => (
        <div
          key={i}
          className="rounded-lg p-2 flex flex-col gap-1"
          style={{ background: C.bg, border: `1px solid ${C.border}` }}
        >
          <div className="flex items-start justify-between gap-1">
            <div className="text-[11px] font-semibold leading-snug flex-1" style={{ color: C.text }}>
              {a.questionText ?? `Q${i + 1}`}
            </div>
            {a.questionType && (
              <Tag className="text-[9px] m-0! shrink-0 leading-tight px-1" style={{ background: `${C.purple}15`, color: C.purple, border: "none" }}>
                {a.questionType.replace(/_/g, " ")}
              </Tag>
            )}
          </div>
          <div>
            <AnswerValue answer={a} />
          </div>
        </div>
      ))}
    </div>
  );
};

const PARTICIPANTS_COLS = [
  { title: "Code", dataIndex: "participantCode", key: "participantCode", width: 120, fixed: "left", render: (v) => <span className="font-mono text-xs font-bold">{v ?? "—"}</span> },
  { title: "Full Name", dataIndex: "fullName", key: "fullName", width: 180 },
  { title: "Mobile", dataIndex: "mobileNumber", key: "mobileNumber", width: 140 },
  { title: "Email", dataIndex: "email", key: "email", width: 220, ellipsis: true, render: (v) => v ?? "—" },
  { title: "Points", dataIndex: "totalPoints", key: "totalPoints", align: "right", width: 80, render: fmt },
  { title: "Scans", dataIndex: "totalScans", key: "totalScans", align: "right", width: 70, render: fmt },
  { title: "QR Generated", dataIndex: "raffleQrGenerated", key: "raffleQrGenerated", align: "center", width: 120, render: (v) => v ? <Tag color="success">Yes</Tag> : <Tag>No</Tag> },
  { title: "QR Generated At", dataIndex: "raffleQrGeneratedAt", key: "raffleQrGeneratedAt", width: 170, render: (v) => fmtDate(v) ?? "—" },
  { title: "Status", dataIndex: "status", key: "status", width: 110, render: (v) => <ExStatusTag value={v} /> },
  { title: "Registered", dataIndex: "dateCreated", key: "dateCreated", width: 170, render: (v) => fmtDate(v) ?? "—" },
];

const CLAIMS_COLS = [
  { title: "Participant Code", dataIndex: "participantCode", key: "participantCode", width: 140, fixed: "left", render: (v) => <span className="font-mono text-xs font-bold">{v ?? "—"}</span> },
  { title: "Full Name", dataIndex: "fullName", key: "fullName", width: 180 },
  { title: "Mobile", dataIndex: "mobileNumber", key: "mobileNumber", width: 140 },
  { title: "Email", dataIndex: "email", key: "email", width: 220, ellipsis: true, render: (v) => v ?? "—" },
  { title: "Prize", dataIndex: "prizeName", key: "prizeName", width: 160, render: (v) => v ?? "—" },
  { title: "Wheel Result", dataIndex: "wheelResult", key: "wheelResult", width: 130, render: (v) => v ?? "—" },
  { title: "Entry Status", dataIndex: "entryStatus", key: "entryStatus", width: 120, render: (v) => <ExStatusTag value={v} /> },
  { title: "Claim Status", dataIndex: "claimStatus", key: "claimStatus", width: 120, render: (v) => <ExStatusTag value={v} /> },
  { title: "Claimed By", dataIndex: "claimedBy", key: "claimedBy", width: 140, render: (v) => v ?? "—" },
  { title: "Date", dataIndex: "dateCreated", key: "dateCreated", width: 170, render: (v) => fmtDate(v) ?? "—" },
];

const SURVEY_COLS = [
  { title: "Participant Code", dataIndex: "participantCode", key: "participantCode", width: 140, fixed: "left", render: (v) => <span className="font-mono text-xs font-bold">{v ?? "—"}</span> },
  { title: "Full Name", dataIndex: "fullName", key: "fullName", width: 180 },
  { title: "Mobile", dataIndex: "mobileNumber", key: "mobileNumber", width: 140 },
  { title: "Survey", key: "surveyTitle", width: 200, ellipsis: true, render: (_, r) => r.surveyName ?? r.surveyTitle ?? "—" },
  { title: "Answers", dataIndex: "answers", key: "answers", align: "center", width: 90, render: (v) => <Tag color="blue">{v?.length ?? 0}</Tag> },
  { title: "Submitted At", dataIndex: "submittedAt", key: "submittedAt", width: 170, render: (v) => fmtDate(v) ?? "—" },
];

const FULL_COLS = [
  { title: "Code", dataIndex: "participantCode", key: "participantCode", width: 120, fixed: "left", render: (v) => <span className="font-mono text-xs font-bold">{v ?? "—"}</span> },
  { title: "Full Name", dataIndex: "fullName", key: "fullName", width: 180 },
  { title: "Mobile", dataIndex: "mobileNumber", key: "mobileNumber", width: 140 },
  { title: "Email", dataIndex: "email", key: "email", width: 220, ellipsis: true, render: (v) => v ?? "—" },
  { title: "Points", dataIndex: "totalPoints", key: "totalPoints", align: "right", width: 80, render: fmt },
  { title: "Scans", dataIndex: "totalScans", key: "totalScans", align: "right", width: 70, render: fmt },
  { title: "Claims", dataIndex: "claims", key: "claims", align: "center", width: 80, render: (v) => <Tag color={v?.length ? "orange" : "default"}>{v?.length ?? 0}</Tag> },
  { title: "Surveys", dataIndex: "surveyResponses", key: "surveyResponses", align: "center", width: 90, render: (v) => <Tag color={v?.length ? "purple" : "default"}>{v?.length ?? 0}</Tag> },
  { title: "Status", dataIndex: "status", key: "status", width: 110, render: (v) => <ExStatusTag value={v} /> },
  { title: "Registered", dataIndex: "dateCreated", key: "dateCreated", width: 170, render: (v) => fmtDate(v) ?? "—" },
];

const ExportSection = ({ campaignId, type, label, description, color, mutation, filename }) => {
  const { notification } = App.useApp();
  const [rows, setRows] = useState(null);
  const [loadedAt, setLoadedAt] = useState(null);
  const [search, setSearch] = useState("");

  const load = () => {
    mutation.mutate(campaignId, {
      onSuccess: (res) => {
        const d = res?.data ?? res;
        const extracted =
          type === "participants" ? (d.participants ?? [])
          : type === "claims"    ? (d.claims ?? [])
          : type === "survey"    ? (d.responses ?? [])
          : (d.participants ?? []);
        setRows(extracted);
        setLoadedAt(dayjs());
        setSearch("");
      },
      onError: () => notification.error({ message: "Failed to load export data" }),
    });
  };

  // Auto-load on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const cols =
    type === "participants" ? PARTICIPANTS_COLS
    : type === "claims"    ? CLAIMS_COLS
    : type === "survey"    ? SURVEY_COLS
    : FULL_COLS;

  const filtered = !search.trim() || !rows
    ? rows
    : rows.filter((row) =>
        Object.values(row).some(
          (v) => v != null && typeof v !== "object" && String(v).toLowerCase().includes(search.toLowerCase())
        )
      );

  const expandable = type === "survey"
    ? {
        expandedRowRender: (record) => <AnswersPanel answers={record.answers} />,
        rowExpandable: (r) => (r.answers?.length ?? 0) > 0,
        expandRowByClick: false,
      }
    : type === "full"
    ? {
        expandedRowRender: (record) => {
          const claims = record.claims ?? [];
          const surveys = record.surveyResponses ?? [];
          return (
            <div className="flex flex-col gap-5 px-4 py-4">
              {/* Claims */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <GiftOutlined style={{ color: C.success, fontSize: 13 }} />
                  <span className="text-xs font-bold" style={{ color: C.success }}>Claims</span>
                  <Tag color="orange" className="!m-0">{claims.length}</Tag>
                </div>
                {claims.length ? (
                  <Table
                    size="small"
                    dataSource={claims.map((c, i) => ({ ...c, _k: i }))}
                    rowKey="_k"
                    pagination={false}
                    columns={[
                      { title: "Prize", dataIndex: "prizeName", key: "prizeName", render: (v) => v ? <span className="font-semibold">{v}</span> : "—" },
                      { title: "Wheel Result", dataIndex: "wheelResult", key: "wheelResult", render: (v) => v ?? "—" },
                      { title: "Claim Status", key: "claimStatus", render: (_, c) => <ExStatusTag value={c.claimStatus ?? c.status} /> },
                      { title: "Claimed By", dataIndex: "claimedBy", key: "claimedBy", render: (v) => v ?? "—" },
                      { title: "Date", dataIndex: "dateCreated", key: "dateCreated", render: (v) => fmtDate(v) ?? "—" },
                    ]}
                  />
                ) : <div className="text-xs py-2" style={{ color: C.muted }}>No claims recorded.</div>}
              </div>

              {/* Survey responses */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <BarChartOutlined style={{ color: C.purple, fontSize: 13 }} />
                  <span className="text-xs font-bold" style={{ color: C.purple }}>Survey Responses</span>
                  <Tag color="purple" className="!m-0">{surveys.length}</Tag>
                </div>
                {surveys.length ? (
                  <div className="flex flex-col gap-3">
                    {surveys.map((s, si) => (
                      <div key={si} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
                        <div className="flex items-center justify-between px-3 py-2" style={{ background: `${C.purple}0a`, borderBottom: `1px solid ${C.border}` }}>
                          <span className="text-xs font-semibold" style={{ color: C.purple }}>{s.surveyName ?? s.surveyTitle ?? `Survey ${si + 1}`}</span>
                          <span className="text-xs" style={{ color: C.muted }}>{fmtDate(s.submittedAt) ?? ""}</span>
                        </div>
                        <AnswersPanel answers={s.answers} />
                      </div>
                    ))}
                  </div>
                ) : <div className="text-xs py-2" style={{ color: C.muted }}>No survey responses recorded.</div>}
              </div>
            </div>
          );
        },
        rowExpandable: (r) => (r.claims?.length ?? 0) > 0 || (r.surveyResponses?.length ?? 0) > 0,
      }
    : undefined;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-5 py-4 flex-wrap gap-3"
        style={{ borderBottom: `1px solid ${C.border}`, background: `${color}08` }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}20` }}>
            <DownloadOutlined style={{ color, fontSize: 16 }} />
          </div>
          <div>
            <div className="font-bold text-sm" style={{ color: C.text }}>{label}</div>
            <div className="text-xs mt-0.5" style={{ color: C.muted }}>{description}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {rows != null && (
            <span className="text-xs px-2 py-0.5 rounded-full font-mono" style={{ background: `${color}15`, color }}>
              {rows.length.toLocaleString()} records
            </span>
          )}
          {loadedAt && (
            <span className="text-xs" style={{ color: C.muted }}>
              as of {loadedAt.format(DATE_FORMATS.TIME_SECONDS)}
            </span>
          )}
          <Button size="small" icon={<ReloadOutlined />} loading={mutation.isPending} onClick={load}>
            Refresh
          </Button>
          {rows?.length > 0 && (
            <>
              <Button size="small" icon={<DownloadOutlined />} onClick={() => downloadCsv(rows, filename.replace(".json", ".csv"))}>
                CSV
              </Button>
              <Button size="small" icon={<DownloadOutlined />} onClick={() => downloadJson(rows, filename)} style={{ borderColor: color, color }}>
                JSON
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Search bar (only when data is ready) ── */}
      {!mutation.isPending && rows?.length > 0 && (
        <div className="px-5 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
          <Input
            placeholder="Search across all fields…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            size="small"
            style={{ maxWidth: 320 }}
          />
          <span className="text-xs" style={{ color: C.muted }}>
            {search
              ? `${filtered.length} of ${rows.length} rows match`
              : `${rows.length.toLocaleString()} records${(type === "survey" || type === "full") ? " · Expand a row to see details" : ""}`
            }
          </span>
        </div>
      )}

      {/* ── Body ── */}
      <div className="p-4">
        {mutation.isPending && (
          <div className="flex flex-col items-center gap-3 py-12">
            <Spin size="large" />
            <div className="text-xs" style={{ color: C.muted }}>Loading records…</div>
          </div>
        )}

        {!mutation.isPending && rows?.length === 0 && (
          <Empty description="No records found for this event" className="py-10" />
        )}

        {!mutation.isPending && filtered?.length > 0 && (
          <Table
            size="small"
            dataSource={filtered.map((r, i) => ({ ...r, _rowKey: i }))}
            rowKey="_rowKey"
            columns={cols}
            expandable={expandable}
            pagination={{
              pageSize: 20,
              size: "small",
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50", "100"],
              showTotal: (t, [from, to]) => `${from}–${to} of ${t.toLocaleString()} records`,
            }}
            scroll={{ x: "max-content" }}
          />
        )}

        {!mutation.isPending && rows?.length > 0 && filtered?.length === 0 && (
          <Empty description={`No records match "${search}"`} className="py-8" />
        )}
      </div>
    </div>
  );
};

// ─── Survey Responses Section ─────────────────────────────────────────────────

/** Decode HTML entities like &amp; &lt; &gt; &quot; &#39; */
const decodeHtml = (str) => {
  if (!str || typeof str !== "string") return str;
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
};

/** Return a plain string representation of an answer for export/search */
const flatAnswerText = (answer) => {
  if (!answer) return "";
  const type = (answer.questionType ?? "").toLowerCase().replace(/[_\s-]/g, "");
  if (type.includes("multiple") || type.includes("checkbox") || type.includes("multi")) {
    const items = Array.isArray(answer.answerJson) ? answer.answerJson : [];
    return items
      .map((o) => decodeHtml(o?.optionText ?? o?.text ?? (o?.optionId != null ? `Option #${o.optionId}` : "")))
      .filter(Boolean)
      .join(", ");
  }
  const val = decodeHtml(answer.answerOptionText) ?? decodeHtml(answer.answerText) ?? (answer.answerNumeric != null ? String(answer.answerNumeric) : "");
  return val ?? "";
};

/** Return array of decoded string labels for multi-select answers */
const multiAnswerLabels = (answer) => {
  if (!answer) return [];
  const items = Array.isArray(answer.answerJson) ? answer.answerJson : [];
  return items
    .map((o) => decodeHtml(o?.optionText ?? o?.text ?? (o?.optionId != null ? `Option #${o.optionId}` : "")))
    .filter(Boolean);
};

const Q_TYPE_ICON = {
  likert: <PieChartOutlined />,
  single_choice: <CheckCircleOutlined />,
  multiple_choice: <OrderedListOutlined />,
  long_text: <FileTextOutlined />,
  short_text: <FileTextOutlined />,
};
const Q_TYPE_COLOR = {
  likert: C.accent,
  single_choice: C.info,
  multiple_choice: C.teal,
  long_text: C.muted,
  short_text: C.muted,
};

// ── Answer frequency breakdown for choice-type questions ──────────────────────
const AnswerBreakdown = ({ question, responses, totalResponses }) => {
  const type = (question.questionType ?? "").toLowerCase().replace(/[_\s-]/g, "");
  const isMulti = type.includes("multiple") || type.includes("checkbox") || type.includes("multi");
  const isChoice = isMulti || type.includes("single") || type.includes("choice") || type.includes("likert");
  if (!isChoice) return null;

  // Count frequency per option
  const freq = new Map();
  responses.forEach((r) => {
    const ans = (r.answers ?? []).find((a) => a.questionId === question.questionId);
    if (!ans) return;
    if (isMulti) {
      multiAnswerLabels(ans).forEach((label) => freq.set(label, (freq.get(label) ?? 0) + 1));
    } else {
      const label = decodeHtml(ans.answerOptionText ?? ans.answerText);
      if (label) freq.set(label, (freq.get(label) ?? 0) + 1);
    }
  });

  if (!freq.size) return null;
  const sorted = Array.from(freq.entries()).sort((a, b) => b[1] - a[1]);
  const maxCount = sorted[0]?.[1] ?? 1;

  return (
    <div className="px-6 py-5" style={{ borderBottom: `1px solid ${C.border}`, background: C.bg }}>
      <div className="text-[11px] font-bold tracking-wider mb-4" style={{ color: C.muted }}>ANSWER BREAKDOWN</div>
      <div className="flex flex-col gap-3">
        {sorted.map(([label, count], i) => {
          const pctOfAnswered = Math.round((count / maxCount) * 100);
          const pctOfTotal = totalResponses > 0 ? ((count / totalResponses) * 100).toFixed(1) : 0;
          const barColor = BAR_COLORS[i % BAR_COLORS.length];
          return (
            <div key={label} className="flex items-center gap-4">
              <div className="w-36 shrink-0 text-xs font-medium truncate" style={{ color: C.text }} title={label}>{label}</div>
              <div className="flex-1 h-6 rounded-lg overflow-hidden" style={{ background: `${C.border}60` }}>
                <div
                  className="h-full rounded-lg transition-all duration-500"
                  style={{ width: `${pctOfAnswered}%`, background: barColor, minWidth: count > 0 ? 4 : 0 }}
                />
              </div>
              <div className="text-sm font-black w-8 text-right shrink-0" style={{ color: barColor }}>{count}</div>
              <div className="text-xs w-12 text-right shrink-0 font-medium" style={{ color: C.muted }}>{pctOfTotal}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Respondent table for a single question ────────────────────────────────────
const QuestionRespondentTable = ({ question, responses }) => {
  const [search, setSearch] = useState("");
  const type = (question.questionType ?? "").toLowerCase().replace(/[_\s-]/g, "");
  const isMulti = type.includes("multiple") || type.includes("checkbox") || type.includes("multi");
  const isChoice = isMulti || type.includes("single") || type.includes("choice") || type.includes("likert");

  const rows = responses.map((r) => {
    const ans = (r.answers ?? []).find((a) => a.questionId === question.questionId);
    return {
      participantCode: r.participantCode,
      fullName: r.fullName,
      mobileNumber: r.mobileNumber,
      email: r.email,
      submittedAt: r.submittedAt,
      _answerFlat: flatAnswerText(ans),
      _answerLabels: isMulti ? multiAnswerLabels(ans) : null,
      _answerRaw: ans,
    };
  }).filter((r) => r._answerFlat !== "");

  const filtered = search.trim()
    ? rows.filter((r) =>
        [r.participantCode, r.fullName, r.mobileNumber, r.email, r._answerFlat]
          .some((v) => v && String(v).toLowerCase().includes(search.toLowerCase()))
      )
    : rows;

  const cols = [
    {
      title: "Participant",
      key: "participant",
      width: 200,
      fixed: "left",
      render: (_, r) => (
        <div>
          <div className="font-semibold text-xs">{r.fullName ?? "—"}</div>
          <div className="font-mono text-[10px]" style={{ color: C.muted }}>{r.participantCode ?? "—"}</div>
        </div>
      ),
    },
    { title: "Mobile", dataIndex: "mobileNumber", key: "mn", width: 130, render: (v) => v ?? "—" },
    { title: "Email", dataIndex: "email", key: "em", width: 200, ellipsis: true, render: (v) => v ?? "—" },
    {
      title: "Answer",
      key: "answer",
      render: (_, r) => {
        const v = r._answerFlat;
        if (!v) return <span style={{ color: C.muted }}>—</span>;
        if (isMulti && r._answerLabels?.length) {
          return (
            <div className="flex flex-wrap gap-1">
              {r._answerLabels.map((t, i) => <Tag key={i} color="cyan" className="text-xs">{t}</Tag>)}
            </div>
          );
        }
        if (isChoice) return <Tag color="geekblue" className="text-xs">{v}</Tag>;
        return <span className="text-xs leading-relaxed whitespace-pre-wrap">{v}</span>;
      },
    },
    { title: "Submitted", dataIndex: "submittedAt", key: "sa", width: 150, render: (v) => <span className="text-xs">{fmtDate(v) ?? "—"}</span> },
  ];

  return (
    <div className="px-6 py-5 flex flex-col gap-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Input
          prefix={<SearchOutlined style={{ color: C.muted, fontSize: 12 }} />}
          placeholder="Search by name, code, or answer…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          size="small"
          style={{ maxWidth: 300 }}
        />
        {search.trim() && (
          <span className="text-xs" style={{ color: C.muted }}>
            {filtered.length} of {rows.length} match
          </span>
        )}
      </div>
      {filtered.length === 0 ? (
        <Empty description={search ? `No matches for "${search}"` : "No responses"} image={Empty.PRESENTED_IMAGE_SIMPLE} className="py-6" />
      ) : (
        <Table
          size="small"
          dataSource={filtered.map((r, i) => ({ ...r, _k: i }))}
          rowKey="_k"
          columns={cols}
          pagination={{ pageSize: 10, size: "small", showSizeChanger: true, pageSizeOptions: ["10", "20", "50"], showTotal: (t, [f, to]) => `${f}–${to} of ${t}` }}
          scroll={{ x: "max-content" }}
        />
      )}
    </div>
  );
};

// ── Single question card ───────────────────────────────────────────────────────
const QuestionCard = ({ question, responses, questionIndex, campaignId, totalSubmissions }) => {
  const type = question.questionType ?? "";
  const typeKey = type.toLowerCase().replace(/[_\s-]/g, "");
  const icon = Q_TYPE_ICON[type] ?? <FileTextOutlined />;
  const typeColor = Q_TYPE_COLOR[type] ?? C.muted;

  const answered = responses.filter((r) =>
    (r.answers ?? []).some((a) => a.questionId === question.questionId && flatAnswerText(a) !== "")
  ).length;
  const responseRate = totalSubmissions > 0 ? Math.round((answered / totalSubmissions) * 100) : 0;

  // Export rows for this question
  const exportRows = responses.map((r) => {
    const ans = (r.answers ?? []).find((a) => a.questionId === question.questionId);
    return {
      participantCode: r.participantCode,
      fullName: r.fullName,
      mobileNumber: r.mobileNumber,
      email: r.email,
      submittedAt: fmtDate(r.submittedAt) ?? r.submittedAt ?? "",
      answer: flatAnswerText(ans),
    };
  }).filter((r) => r.answer !== "");

  const slug = decodeHtml(question.questionText ?? "").slice(0, 30).replace(/\s+/g, "-").toLowerCase();
  const csvFilename = `q${questionIndex + 1}-${slug}-${campaignId}.csv`;
  const jsonFilename = `q${questionIndex + 1}-${slug}-${campaignId}.json`;

  const panelHeader = (
    <div className="flex items-center gap-4 flex-1 min-w-0 py-1">
      {/* Number badge */}
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm font-black"
        style={{ background: `${typeColor}18`, color: typeColor }}
      >
        {questionIndex + 1}
      </div>

      {/* Question text + meta */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm leading-snug mb-2" style={{ color: C.text }}>
          {decodeHtml(question.questionText)}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Tag
            icon={icon}
            className="text-[10px] !m-0 px-2 py-0.5"
            style={{ background: `${typeColor}15`, color: typeColor, border: "none" }}
          >
            {type.replace(/_/g, " ")}
          </Tag>
          <span className="text-xs" style={{ color: C.muted }}>
            {answered} / {totalSubmissions} answered
          </span>
          <div className="flex items-center gap-2">
            <Progress
              percent={responseRate}
              size="small"
              showInfo={false}
              strokeColor={typeColor}
              trailColor={C.border}
              style={{ width: 72, margin: 0 }}
            />
            <span className="text-xs font-bold" style={{ color: typeColor }}>{responseRate}%</span>
          </div>
        </div>
      </div>

      {/* Export buttons */}
      {exportRows.length > 0 && (
        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Tooltip title="Export this question as CSV">
            <Button size="small" icon={<DownloadOutlined />} onClick={() => downloadCsv(exportRows, csvFilename)}>CSV</Button>
          </Tooltip>
          <Tooltip title="Export this question as JSON">
            <Button size="small" icon={<DownloadOutlined />} onClick={() => downloadJson(exportRows, jsonFilename)} style={{ borderColor: typeColor, color: typeColor }}>JSON</Button>
          </Tooltip>
        </div>
      )}
    </div>
  );

  return (
    <Collapse
      defaultActiveKey={["q"]}
      style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}
      items={[{
        key: "q",
        label: panelHeader,
        children: (
          <div style={{ padding: 0 }}>
            <AnswerBreakdown question={question} responses={responses} totalResponses={totalSubmissions} />
            <QuestionRespondentTable question={question} responses={responses} />
          </div>
        ),
        style: { borderRadius: 0, padding: 0 },
      }]}
    />
  );
};

// ── Main survey responses container ───────────────────────────────────────────
const SurveyResponsesSection = ({ campaignId, mutation }) => {
  const { notification } = App.useApp();
  const [responses, setResponses] = useState(null);
  const [loadedAt, setLoadedAt] = useState(null);
  const [globalSearch, setGlobalSearch] = useState("");

  const load = () => {
    mutation.mutate(campaignId, {
      onSuccess: (res) => {
        const d = res?.data ?? res;
        setResponses(d.responses ?? []);
        setLoadedAt(dayjs());
        setGlobalSearch("");
      },
      onError: () => notification.error({ message: "Failed to load survey responses" }),
    });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  // Derive sorted question list from all responses
  const questions = (() => {
    if (!responses?.length) return [];
    const seen = new Map();
    responses.forEach((r) => {
      (r.answers ?? []).forEach((a) => {
        if (!seen.has(a.questionId)) {
          seen.set(a.questionId, {
            questionId: a.questionId,
            questionText: a.questionText,
            questionType: a.questionType,
          });
        }
      });
    });
    return Array.from(seen.values()).sort((a, b) => a.questionId - b.questionId);
  })();

  // Filter responses by global search (name / code / email / any answer)
  const visibleResponses = globalSearch.trim()
    ? (responses ?? []).filter((r) => {
        const haystack = [r.participantCode, r.fullName, r.mobileNumber, r.email]
          .concat((r.answers ?? []).map(flatAnswerText))
          .join(" ")
          .toLowerCase();
        return haystack.includes(globalSearch.toLowerCase());
      })
    : (responses ?? []);

  const surveyName = decodeHtml(responses?.[0]?.surveyName ?? "Survey Responses");
  const totalSubmissions = responses?.length ?? 0;
  const completeCount = (responses ?? []).filter((r) => r.isComplete).length;
  const completeRate = totalSubmissions > 0 ? Math.round((completeCount / totalSubmissions) * 100) : 0;

  // Export all: one row per respondent, one column per question (full text as header)
  const exportAll = (format) => {
    if (!responses?.length) return;
    const allRows = responses.map((r) => {
      const base = {
        participantCode: r.participantCode,
        fullName: r.fullName,
        mobileNumber: r.mobileNumber,
        email: r.email,
        isComplete: r.isComplete ? "Yes" : "No",
        submittedAt: fmtDate(r.submittedAt) ?? r.submittedAt ?? "",
      };
      questions.forEach((q, i) => {
        const ans = (r.answers ?? []).find((a) => a.questionId === q.questionId);
        // Use full question text as column header (truncated for CSV safety)
        const header = `Q${i + 1}: ${decodeHtml(q.questionText ?? "").slice(0, 60)}`;
        base[header] = flatAnswerText(ans);
      });
      return base;
    });
    if (format === "csv") downloadCsv(allRows, `survey-all-${campaignId}.csv`);
    else downloadJson(allRows, `survey-all-${campaignId}.json`);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* ── Summary header ── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <div className="flex items-center justify-between px-5 py-4 flex-wrap gap-3" style={{ background: `${C.purple}08`, borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${C.purple}20` }}>
              <BarChartOutlined style={{ color: C.purple, fontSize: 18 }} />
            </div>
            <div>
              <div className="font-bold text-base leading-tight" style={{ color: C.text }}>{surveyName}</div>
              <div className="text-xs mt-0.5" style={{ color: C.muted }}>
                {questions.length} question{questions.length !== 1 ? "s" : ""}
                {loadedAt ? ` · refreshed ${loadedAt.format(DATE_FORMATS.TIME_SECONDS)}` : ""}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="small" icon={<ReloadOutlined />} loading={mutation.isPending} onClick={load}>Refresh</Button>
            {totalSubmissions > 0 && (
              <>
                <Button size="small" icon={<DownloadOutlined />} onClick={() => exportAll("csv")}>Export All CSV</Button>
                <Button
                  size="small"
                  type="primary"
                  ghost
                  icon={<DownloadOutlined />}
                  onClick={() => exportAll("json")}
                  style={{ borderColor: C.purple, color: C.purple }}
                >
                  Export All JSON
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Stats row */}
        {totalSubmissions > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x" style={{ borderBottom: `1px solid ${C.border}` }}>
            {[
              { label: "Total Submissions", value: totalSubmissions, color: C.purple, suffix: "" },
              { label: "Complete", value: completeCount, color: C.success, suffix: "" },
              { label: "Incomplete", value: totalSubmissions - completeCount, color: C.warning, suffix: "" },
              { label: "Completion Rate", value: completeRate, color: C.info, suffix: "%" },
            ].map((s) => (
              <div key={s.label} className="px-6 py-4 text-center">
                <div className="text-2xl font-black leading-none" style={{ color: s.color }}>{s.value}{s.suffix}</div>
                <div className="text-xs font-medium mt-1.5" style={{ color: C.muted }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Global search */}
        {totalSubmissions > 0 && (
          <div className="px-5 py-3.5 flex items-center gap-3 flex-wrap">
            <Input
              prefix={<SearchOutlined style={{ color: C.muted, fontSize: 12 }} />}
              placeholder="Filter all questions by participant name, code, email, or answer…"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              allowClear
              size="small"
              style={{ maxWidth: 440 }}
            />
            {globalSearch.trim() && (
              <span className="text-xs" style={{ color: C.muted }}>
                Showing responses from {visibleResponses.length} of {totalSubmissions} participants
              </span>
            )}
          </div>
        )}
      </div>

      {/* Loading */}
      {mutation.isPending && (
        <div className="flex flex-col items-center gap-3 py-20">
          <Spin size="large" />
          <div className="text-xs" style={{ color: C.muted }}>Loading survey responses…</div>
        </div>
      )}

      {/* Empty */}
      {!mutation.isPending && responses?.length === 0 && (
        <Empty description="No survey responses found for this event" className="py-12" />
      )}

      {/* Question cards */}
      {!mutation.isPending && questions.map((q, i) => (
        <QuestionCard
          key={q.questionId}
          question={q}
          responses={visibleResponses}
          questionIndex={i}
          campaignId={campaignId}
          totalSubmissions={totalSubmissions}
        />
      ))}
    </div>
  );
};

// ─── Export Tab ───────────────────────────────────────────────────────────────

const ExportTab = ({ campaignId }) => {
  const exportParticipants = useExportParticipants();
  const exportClaims = useExportClaims();
  const exportSurveyResponses = useExportSurveyResponses();
  const exportFull = useExportFull();

  const sections = [
    {
      key: "participants",
      type: "participants",
      label: "Participants",
      description: "participantCode · fullName · mobileNumber · email · totalPoints · totalScans · status · dateCreated",
      color: C.info,
      mutation: exportParticipants,
      filename: `export-participants-${campaignId}.json`,
    },
    {
      key: "claims",
      type: "claims",
      label: "Claims",
      description: "Participant info joined with prize claim details — prizeName · wheelResult · entryStatus · claimStatus · claimedBy",
      color: C.success,
      mutation: exportClaims,
      filename: `export-claims-${campaignId}.json`,
    },
    {
      key: "survey",
      type: "survey",
      label: "Survey Responses",
      description: null,
      color: C.purple,
      mutation: exportSurveyResponses,
      filename: null,
    },
    {
      key: "full",
      type: "full",
      label: "Full Export",
      description: "Complete participant records with nested claims and survey responses — expand each row for the full journey",
      color: C.primary,
      mutation: exportFull,
      filename: `export-full-${campaignId}.json`,
    },
  ];

  return (
    <Tabs
      size="small"
      items={sections.map((s) => ({
        key: s.key,
        label: (
          <span className="flex items-center gap-1.5">
            {s.key === "participants" && <UserOutlined />}
            {s.key === "claims" && <GiftOutlined />}
            {s.key === "survey" && <BarChartOutlined />}
            {s.key === "full" && <DownloadOutlined />}
            <span>{s.label}</span>
          </span>
        ),
        children: s.key === "survey"
          ? <SurveyResponsesSection campaignId={campaignId} mutation={s.mutation} />
          : <ExportSection key={s.key} campaignId={campaignId} {...s} />,
      }))}
    />
  );
};

// ─── Campaign Selector ────────────────────────────────────────────────────────

const AnalyticsDashboard = () => {
  const { data: overviewData, isLoading: overviewLoading } = useListCampaigns();
  const campaigns = overviewData?.data?.campaigns ?? overviewData?.data ?? [];
  const [campaignId, setCampaignId] = useState(null);
  const [activeTab, setActiveTab] = useState("participants");

  const selectedCampaign = campaigns.find((c) => c.campaignId === campaignId || c.id === campaignId);

  const tabs = [
    { key: "participants", label: "Participants", icon: <UserOutlined /> },
    { key: "booths",       label: "Booths",       icon: <ShopOutlined /> },
    { key: "qr",          label: "QR Codes",     icon: <QrcodeOutlined /> },
    { key: "entries",     label: "Spin Wheel",   icon: <PlayCircleOutlined /> },
    { key: "prizes",      label: "Prizes",       icon: <GiftOutlined /> },
    { key: "funnel",      label: "Funnel",       icon: <FunnelPlotOutlined /> },
    { key: "export",      label: "Export",       icon: <DownloadOutlined /> },
  ];

  return (
    <App>
      <div className="min-h-screen" style={{ background: C.bg }}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${C.primary}15` }}>
              <BarChartOutlined style={{ color: C.primary, fontSize: 18 }} />
            </div>
            <div>
              <Title level={4} className="!mb-0 !leading-tight" style={{ color: C.text }}>Analytics</Title>
              <div className="text-xs" style={{ color: C.muted }}>Campaign performance &amp; insights</div>
            </div>
          </div>

          {/* Campaign picker */}
          <div className="flex items-center gap-3 flex-wrap">
            <Select
              placeholder="Select a campaign…"
              loading={overviewLoading}
              value={campaignId}
              onChange={setCampaignId}
              className="min-w-64"
              allowClear
              showSearch
              optionFilterProp="label"
              options={campaigns.map((c) => ({
                value: c.campaignId ?? c.id,
                label: c.name ?? c.campaignName,
                extra: c.status,
              }))}
              optionRender={(opt) => (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm">{opt.data.label}</span>
                  {opt.data.extra ? (
                    <Tag color={opt.data.extra === "active" ? "success" : "default"} className="text-xs">
                      {opt.data.extra}
                    </Tag>
                  ) : null}
                </div>
              )}
            />
            {selectedCampaign ? (
              <Tag color={selectedCampaign.status === "active" ? "success" : "default"}>
                {selectedCampaign.status}
              </Tag>
            ) : null}
          </div>
        </div>

        {/* Campaign-level tabs */}
        {campaignId ? (
          <div className="px-6 pb-8">
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              size="small"
              items={tabs.map((t) => ({
                key: t.key,
                label: (
                  <span className="flex items-center gap-1.5">
                    {t.icon}
                    <span>{t.label}</span>
                  </span>
                ),
                children: (
                  <div className="pt-4">
                    {t.key === "participants" ? <ParticipantsTab campaignId={campaignId} /> : null}
                    {t.key === "booths"       ? <BoothsTab campaignId={campaignId} />       : null}
                    {t.key === "qr"           ? <QrTab campaignId={campaignId} />           : null}
                    {t.key === "entries"      ? <EntriesTab campaignId={campaignId} />      : null}
                    {t.key === "prizes"       ? <PrizesTab campaignId={campaignId} />       : null}
                    {t.key === "funnel"       ? <FunnelTab campaignId={campaignId} />       : null}
                    {t.key === "export"       ? <ExportTab campaignId={campaignId} />       : null}
                  </div>
                ),
              }))}
            />
          </div>
        ) : (
          !overviewLoading && campaigns.length === 0 ? (
            <div className="px-6">
              <Empty description="No campaigns found." />
            </div>
          ) : !overviewLoading ? (
            <div className="px-6">
              <div
                className="rounded-2xl p-8 text-center"
                style={{ background: C.card, border: `1px dashed ${C.border}` }}
              >
                <BarChartOutlined style={{ fontSize: 36, color: C.muted, marginBottom: 12 }} />
                <div className="text-sm font-medium" style={{ color: C.muted }}>
                  Select a campaign above to view detailed analytics
                </div>
              </div>
            </div>
          ) : null
        )}
      </div>
    </App>
  );
};

export default AnalyticsDashboard;
