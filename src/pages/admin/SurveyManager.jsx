// ============================================
// SCAN2WIN — Admin Survey Manager
// Worldbex Events "Scan to Win" Platform
//
// Route: /admin/surveys
// Allows admins to create and manage surveys,
// questions, options, and matrix rows per campaign.
// ============================================

import { useState } from "react";
import {
  useListCampaigns,
  useListSurveys,
  useGetSurveyById,
  useCreateSurvey,
  useUpdateSurvey,
  useDeleteSurvey,
  useCreateSurveyQuestion,
  useUpdateSurveyQuestion,
  useDeleteSurveyQuestion,
  useCreateQuestionOption,
  useUpdateQuestionOption,
  useDeleteQuestionOption,
  useCreateMatrixRow,
  useUpdateMatrixRow,
  useDeleteMatrixRow,
  useGetSurveyAnalytics,
} from "../../services/requests/useApi";
import {
  Plus,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  BarChart2,
  ClipboardList,
  Loader2,
  GripVertical,
  ToggleLeft,
  ToggleRight,
  RotateCcw,
  Trophy,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const TRIGGER_OPTIONS = [
  // { value: "booth_scan",   label: "Booth Scan" },
  { value: "raffle_entry", label: "Raffle Entry" },
  // { value: "prize_claim",  label: "Prize Claim" },
];

const QUESTION_TYPES = [
  { value: "single_choice", label: "Single Choice (radio)" },
  { value: "multiple_choice", label: "Multiple Choice (checkbox)" },
  { value: "dropdown", label: "Dropdown" },
  { value: "boolean", label: "Yes / No" },
  { value: "text", label: "Short Text" },
  { value: "long_text", label: "Long Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "rating", label: "Rating (stars)" },
  { value: "likert", label: "Likert Scale" },
  { value: "ranking", label: "Ranking" },
  { value: "matrix", label: "Matrix Grid" },
];

const TYPE_NEEDS_OPTIONS = [
  "single_choice",
  "multiple_choice",
  "dropdown",
  "boolean",
  "likert",
  "ranking",
];
const TYPE_NEEDS_MATRIX_ROWS = ["matrix"];
const TYPE_NEEDS_OPTIONS_AND_MATRIX = ["matrix"];

// ─── Shared UI helpers ────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all";

const selectCls =
  "w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 transition-all bg-white";

const btnPrimary =
  "flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-amber-400 shadow hover:opacity-90 active:scale-95 transition-all disabled:opacity-50";

const btnGhost =
  "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 active:scale-95 transition-all";

const btnDanger =
  "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-50 active:scale-95 transition-all";

const Card = ({ children, className = "" }) => (
  <div
    className={`rounded-2xl border border-gray-100 bg-white shadow-sm ${className}`}
  >
    {children}
  </div>
);

const SectionTitle = ({ children }) => (
  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
    {children}
  </p>
);

const Spinner = () => (
  <div className="flex items-center justify-center py-10">
    <Loader2 size={28} className="animate-spin text-orange-400" />
  </div>
);

// ─── Inline editable text ─────────────────────────────────────────────────────

const InlineEdit = ({
  value,
  onSave,
  placeholder = "Edit…",
  className = "",
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const save = () => {
    if (draft.trim() && draft !== value) onSave(draft.trim());
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") setEditing(false);
          }}
          className={`${inputCls} ${className}`}
        />
        <button
          onClick={save}
          className="p-1 text-green-500 hover:bg-green-50 rounded-lg"
        >
          <Check size={15} />
        </button>
        <button
          onClick={() => setEditing(false)}
          className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg"
        >
          <X size={15} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      className={`text-left hover:bg-orange-50 rounded-lg px-1 -mx-1 transition-colors group ${className}`}
    >
      {value || <span className="text-gray-300">{placeholder}</span>}
      <Edit2
        size={11}
        className="inline ml-1.5 opacity-0 group-hover:opacity-50 transition-opacity"
      />
    </button>
  );
};

// ─── Analytics panel ──────────────────────────────────────────────────────────

// ─── Analytics helpers ────────────────────────────────────────────────────────

const BAR_COLORS = [
  "#f97316",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#ef4444",
];

const QuestionTypeTag = ({ type }) => {
  const label = QUESTION_TYPES.find((t) => t.value === type)?.label ?? type;
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 uppercase tracking-wide">
      {label}
    </span>
  );
};

// ─── Analytics Drawer ─────────────────────────────────────────────────────────

const AnalyticsDrawer = ({ campaignId, surveyId, open, onClose }) => {
  const { data, isLoading, refetch } = useGetSurveyAnalytics({
    campaignId,
    surveyId,
  });

  const survey = data?.data?.survey;
  const questions = data?.data?.analytics ?? [];

  // Aggregate totals across all questions
  const totalAnswers = questions.reduce((s, q) => s + (q.totalAnswers ?? 0), 0);
  const answeredQuestions = questions.filter((q) => q.totalAnswers > 0).length;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col bg-white shadow-2xl transition-transform duration-300"
        style={{
          width: "min(520px, 100vw)",
          transform: open ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {/* Header */}
        <div className="shrink-0 px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
              <BarChart2 size={18} className="text-orange-500" />
            </div>
            <div className="min-w-0">
              <h2 className="font-black text-base text-gray-800 leading-tight">
                Survey Analytics
              </h2>
              {survey ? (
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {survey.surveyName}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={refetch}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
              title="Refresh"
            >
              <RotateCcw size={15} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <Spinner />
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 px-6">
              <BarChart2 size={40} className="text-gray-200" />
              <p className="text-sm text-gray-400 text-center">
                No responses yet. Analytics will appear once participants start
                submitting.
              </p>
            </div>
          ) : (
            <div className="p-5 space-y-5">
              {/* Summary row */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: "Total Answers",
                    value: totalAnswers,
                    color: "#f97316",
                    bg: "#fff7ed",
                  },
                  {
                    label: "Questions Answered",
                    value: `${answeredQuestions} / ${questions.length}`,
                    color: "#10b981",
                    bg: "#ecfdf5",
                  },
                ].map(({ label, value, color, bg }) => (
                  <div
                    key={label}
                    className="rounded-2xl p-4 text-center"
                    style={{ background: bg }}
                  >
                    <p className="text-2xl font-black" style={{ color }}>
                      {value}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5 font-medium">
                      {label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Per-question cards */}
              {questions.map((q, qi) => {
                const breakdown = q.data?.breakdown ?? [];
                const topOption = breakdown.reduce(
                  (best, b) => (b.count > (best?.count ?? -1) ? b : best),
                  null,
                );

                return (
                  <div
                    key={q.questionId}
                    className="rounded-2xl border border-gray-100 overflow-hidden"
                  >
                    {/* Question header */}
                    <div className="px-4 pt-4 pb-3 bg-gray-50/60 border-b border-gray-100">
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-500 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                          {qi + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 leading-snug">
                            {q.questionText}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <QuestionTypeTag type={q.questionType} />
                            <span className="text-[11px] text-gray-400">
                              {q.totalAnswers} answer
                              {q.totalAnswers !== 1 ? "s" : ""}
                            </span>
                            {topOption && topOption.count > 0 ? (
                              <span className="text-[11px] text-orange-500 font-semibold">
                                Top: {topOption.optionText} (
                                {topOption.percentage}%)
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Breakdown */}
                    {breakdown.length > 0 ? (
                      <div className="px-4 py-3 space-y-3">
                        {breakdown.map((b, bi) => {
                          const color = BAR_COLORS[bi % BAR_COLORS.length];
                          const isTop =
                            b.optionId === topOption?.optionId && b.count > 0;
                          return (
                            <div key={b.optionId}>
                              <div className="flex items-center justify-between mb-1 gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {isTop ? (
                                    <Trophy size={10} className="shrink-0 text-yellow-500" />
                                  ) : null}
                                  <span
                                    className="text-xs truncate"
                                    style={{
                                      color: isTop ? "#1f2937" : "#6b7280",
                                      fontWeight: isTop ? 600 : 400,
                                    }}
                                  >
                                    {b.optionText}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-xs font-bold text-gray-600">
                                    {b.count}
                                  </span>
                                  <span
                                    className="text-[11px] font-bold w-10 text-right"
                                    style={{ color }}
                                  >
                                    {b.percentage}%
                                  </span>
                                </div>
                              </div>
                              <div className="w-full h-2 rounded-full bg-gray-100">
                                <div
                                  className="h-2 rounded-full transition-all duration-500"
                                  style={{
                                    width: `${b.percentage}%`,
                                    background: color,
                                    opacity: b.count === 0 ? 0.25 : 1,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="px-4 py-3 text-xs text-gray-400">
                        No breakdown available for this question type.
                      </p>
                    )}

                    {/* Zero-answer notice */}
                    {q.totalAnswers === 0 ? (
                      <div className="px-4 pb-3">
                        <p className="text-[11px] text-gray-300 italic">
                          No responses yet
                        </p>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// ─── Option / Matrix row editors ─────────────────────────────────────────────

const OptionEditor = ({ campaignId, surveyId, question }) => {
  const [newText, setNewText] = useState("");
  const { mutateAsync: createOption, isPending: creating } =
    useCreateQuestionOption();
  const { mutateAsync: updateOption } = useUpdateQuestionOption();
  const { mutateAsync: deleteOption } = useDeleteQuestionOption();

  const add = async () => {
    if (!newText.trim()) return;
    await createOption({
      campaignId,
      surveyId,
      questionId: question.id,
      optionText: newText.trim(),
      optionValue: newText.trim().toLowerCase().replace(/\s+/g, "_"),
    });
    setNewText("");
  };

  return (
    <div className="mt-3 space-y-1.5">
      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
        Options
      </p>
      {(question.options ?? []).map((opt) => (
        <div
          key={opt.id}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 bg-gray-50 border border-gray-100"
        >
          <GripVertical size={12} className="text-gray-300 shrink-0" />
          <InlineEdit
            value={opt.optionText}
            onSave={(v) =>
              updateOption({
                campaignId,
                surveyId,
                questionId: question.id,
                optionId: opt.id,
                optionText: v,
              })
            }
            className="flex-1 text-sm text-gray-700"
          />
          <button
            onClick={() =>
              deleteOption({
                campaignId,
                surveyId,
                questionId: question.id,
                optionId: opt.id,
              })
            }
            className="p-0.5 text-red-400 hover:bg-red-50 rounded"
          >
            <X size={12} />
          </button>
        </div>
      ))}
      <div className="flex gap-2 mt-2">
        <input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add option…"
          className={inputCls}
        />
        <button
          onClick={add}
          disabled={creating || !newText.trim()}
          className={btnPrimary}
        >
          {creating ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Plus size={14} />
          )}
        </button>
      </div>
    </div>
  );
};

const MatrixEditor = ({ campaignId, surveyId, question }) => {
  const [newRow, setNewRow] = useState("");
  const { mutateAsync: createRow, isPending: creatingRow } =
    useCreateMatrixRow();
  const { mutateAsync: updateRow } = useUpdateMatrixRow();
  const { mutateAsync: deleteRow } = useDeleteMatrixRow();

  const addRow = async () => {
    if (!newRow.trim()) return;
    await createRow({
      campaignId,
      surveyId,
      questionId: question.id,
      rowText: newRow.trim(),
    });
    setNewRow("");
  };

  return (
    <div className="mt-3 space-y-3">
      {/* Columns (options) */}
      <OptionEditor
        campaignId={campaignId}
        surveyId={surveyId}
        question={question}
      />
      {/* Rows */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
          Matrix Rows
        </p>
        {(question.matrixRows ?? []).map((row) => (
          <div
            key={row.id}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 bg-blue-50 border border-blue-100 mb-1.5"
          >
            <GripVertical size={12} className="text-blue-200 shrink-0" />
            <InlineEdit
              value={row.rowText}
              onSave={(v) =>
                updateRow({
                  campaignId,
                  surveyId,
                  questionId: question.id,
                  rowId: row.id,
                  rowText: v,
                })
              }
              className="flex-1 text-sm text-gray-700"
            />
            <button
              onClick={() =>
                deleteRow({
                  campaignId,
                  surveyId,
                  questionId: question.id,
                  rowId: row.id,
                })
              }
              className="p-0.5 text-red-400 hover:bg-red-50 rounded"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        <div className="flex gap-2 mt-1">
          <input
            value={newRow}
            onChange={(e) => setNewRow(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addRow()}
            placeholder="Add row…"
            className={inputCls}
          />
          <button
            onClick={addRow}
            disabled={creatingRow || !newRow.trim()}
            className={btnPrimary}
          >
            {creatingRow ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Question card ────────────────────────────────────────────────────────────

const QuestionCard = ({ question, campaignId, surveyId, index }) => {
  const [expanded, setExpanded] = useState(false);
  const { mutateAsync: updateQuestion } = useUpdateSurveyQuestion();
  const { mutateAsync: deleteQuestion, isPending: deleting } =
    useDeleteSurveyQuestion();

  const update = (patch) =>
    updateQuestion({ campaignId, surveyId, questionId: question.id, ...patch });

  const typeLabel =
    QUESTION_TYPES.find((t) => t.value === question.questionType)?.label ??
    question.questionType;
  const needsOptions = TYPE_NEEDS_OPTIONS.includes(question.questionType);
  const needsMatrix = TYPE_NEEDS_MATRIX_ROWS.includes(question.questionType);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-500 text-xs font-black flex items-center justify-center shrink-0">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <InlineEdit
            value={question.questionText}
            onSave={(v) => update({ questionText: v })}
            className="font-semibold text-sm text-gray-800 w-full"
            placeholder="Question text…"
          />
          <span className="text-[11px] text-gray-400">{typeLabel}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => update({ isRequired: !question.isRequired })}
            className="flex items-center gap-1 text-xs rounded-lg px-2 py-1 transition-colors"
            style={
              question.isRequired
                ? { color: "#f97316", background: "#fff7ed" }
                : { color: "#9ca3af", background: "#f9fafb" }
            }
          >
            {question.isRequired ? (
              <ToggleRight size={14} />
            ) : (
              <ToggleLeft size={14} />
            )}
            {question.isRequired ? "Required" : "Optional"}
          </button>
          <button onClick={() => setExpanded((p) => !p)} className={btnGhost}>
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          <button
            onClick={() =>
              deleteQuestion({ campaignId, surveyId, questionId: question.id })
            }
            disabled={deleting}
            className={btnDanger}
          >
            {deleting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
          </button>
        </div>
      </div>

      {/* Expanded options */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50 pt-3">
          {/* Validation rules for rating/number */}
          {["rating", "number"].includes(question.questionType) && (
            <div className="flex gap-3 mb-3">
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">Min</label>
                <input
                  type="number"
                  defaultValue={question.validationRules?.min ?? ""}
                  onBlur={(e) =>
                    update({
                      validationRules: {
                        ...question.validationRules,
                        min: Number(e.target.value),
                      },
                    })
                  }
                  className={inputCls}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">Max</label>
                <input
                  type="number"
                  defaultValue={question.validationRules?.max ?? ""}
                  onBlur={(e) =>
                    update({
                      validationRules: {
                        ...question.validationRules,
                        max: Number(e.target.value),
                      },
                    })
                  }
                  className={inputCls}
                />
              </div>
            </div>
          )}
          {["text", "long_text"].includes(question.questionType) && (
            <div className="mb-3">
              <label className="text-xs text-gray-500 mb-1 block">
                Max Length
              </label>
              <input
                type="number"
                defaultValue={question.validationRules?.maxLength ?? ""}
                onBlur={(e) =>
                  update({
                    validationRules: {
                      ...question.validationRules,
                      maxLength: Number(e.target.value),
                    },
                  })
                }
                className={inputCls}
              />
            </div>
          )}
          {/* Options */}
          {needsOptions && !needsMatrix && (
            <OptionEditor
              campaignId={campaignId}
              surveyId={surveyId}
              question={question}
            />
          )}
          {needsMatrix && (
            <MatrixEditor
              campaignId={campaignId}
              surveyId={surveyId}
              question={question}
            />
          )}
        </div>
      )}
    </div>
  );
};

// ─── Survey detail panel ──────────────────────────────────────────────────────

const SurveyDetail = ({ campaignId, surveyId, onDelete }) => {
  const { data, isLoading } = useGetSurveyById({ campaignId, surveyId });
  const { mutateAsync: updateSurvey } = useUpdateSurvey();
  const { mutateAsync: createQuestion, isPending: creatingQ } =
    useCreateSurveyQuestion();
  const { mutateAsync: deleteQuestion } = useDeleteSurveyQuestion();
  const [newQType, setNewQType] = useState("single_choice");
  const [newQText, setNewQText] = useState("");
  const [showAnalytics, setShowAnalytics] = useState(false);

  const survey = data?.data?.survey ?? data?.data;
  const questions = (survey?.questions ?? [])
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const addQuestion = async () => {
    if (!newQText.trim()) return;
    await createQuestion({
      campaignId,
      surveyId,
      questionText: newQText.trim(),
      questionType: newQType,
      isRequired: false,
      sortOrder: questions.length,
    });
    setNewQText("");
  };

  if (isLoading) return <Spinner />;
  if (!survey)
    return (
      <p className="text-sm text-gray-400 text-center py-10">
        Survey not found.
      </p>
    );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Survey header */}
      <div className="shrink-0 px-5 py-4 border-b border-gray-100">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <InlineEdit
              value={survey.surveyName}
              onSave={(v) =>
                updateSurvey({ campaignId, surveyId, surveyName: v })
              }
              className="font-black text-lg text-gray-800 w-full"
            />
            <InlineEdit
              value={survey.description ?? ""}
              onSave={(v) =>
                updateSurvey({ campaignId, surveyId, description: v })
              }
              className="text-sm text-gray-500 mt-0.5 w-full"
              placeholder="Add description…"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setShowAnalytics(true)} className={btnGhost}>
              <BarChart2 size={15} /> Analytics
            </button>
            <button onClick={() => onDelete(surveyId)} className={btnDanger}>
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Survey meta */}
        <div className="mt-3 flex flex-wrap gap-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Trigger</label>
            <select
              value={survey.triggerEvent}
              onChange={(e) =>
                updateSurvey({
                  campaignId,
                  surveyId,
                  triggerEvent: e.target.value,
                })
              }
              className={selectCls}
              style={{ width: "auto", minWidth: 160 }}
            >
              {TRIGGER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() =>
                updateSurvey({
                  campaignId,
                  surveyId,
                  isRequired: !survey.isRequired,
                })
              }
              className="flex items-center gap-1.5 text-sm rounded-xl px-3 py-2 border transition-colors"
              style={
                survey.isRequired
                  ? {
                      color: "#f97316",
                      borderColor: "#fed7aa",
                      background: "#fff7ed",
                    }
                  : {
                      color: "#9ca3af",
                      borderColor: "#e5e7eb",
                      background: "#f9fafb",
                    }
              }
            >
              {survey.isRequired ? (
                <ToggleRight size={16} />
              ) : (
                <ToggleLeft size={16} />
              )}
              {survey.isRequired ? "Required" : "Optional"}
            </button>
          </div>
          <div className="flex items-end">
            <button
              onClick={() =>
                updateSurvey({
                  campaignId,
                  surveyId,
                  isActive: !survey.isActive,
                })
              }
              className="flex items-center gap-1.5 text-sm rounded-xl px-3 py-2 border transition-colors"
              style={
                survey.isActive
                  ? {
                      color: "#10b981",
                      borderColor: "#a7f3d0",
                      background: "#ecfdf5",
                    }
                  : {
                      color: "#9ca3af",
                      borderColor: "#e5e7eb",
                      background: "#f9fafb",
                    }
              }
            >
              {survey.isActive ? (
                <ToggleRight size={16} />
              ) : (
                <ToggleLeft size={16} />
              )}
              {survey.isActive ? "Active" : "Inactive"}
            </button>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        <SectionTitle>Questions ({questions.length})</SectionTitle>
        {questions.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">
            No questions yet. Add one below.
          </p>
        )}
        {questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            question={q}
            campaignId={campaignId}
            surveyId={surveyId}
            index={i}
          />
        ))}
      </div>

      {/* Add question */}
      <div className="shrink-0 px-5 py-4 border-t border-gray-100 bg-gray-50/50">
        <SectionTitle>Add Question</SectionTitle>
        <div className="flex gap-2">
          <input
            value={newQText}
            onChange={(e) => setNewQText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addQuestion()}
            placeholder="Question text…"
            className={`${inputCls} flex-1`}
          />
          <select
            value={newQType}
            onChange={(e) => setNewQType(e.target.value)}
            className={selectCls}
            style={{ width: "auto", minWidth: 160 }}
          >
            {QUESTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <button
            onClick={addQuestion}
            disabled={creatingQ || !newQText.trim()}
            className={btnPrimary}
          >
            {creatingQ ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Plus size={15} />
            )}
            Add
          </button>
        </div>
      </div>

      <AnalyticsDrawer
        campaignId={campaignId}
        surveyId={surveyId}
        open={showAnalytics}
        onClose={() => setShowAnalytics(false)}
      />
    </div>
  );
};

// ─── Main SurveyManager ───────────────────────────────────────────────────────

const SurveyManager = () => {
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const [selectedSurveyId, setSelectedSurveyId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newSurveyName, setNewSurveyName] = useState("");
  const [newTrigger, setNewTrigger] = useState("raffle_entry");

  const { data: campaignsData, isLoading: loadingCampaigns } =
    useListCampaigns();
  const campaigns = campaignsData?.data?.campaigns ?? campaignsData?.data ?? [];

  const { data: surveysData, isLoading: loadingSurveys } =
    useListSurveys(selectedCampaignId);
  const surveys = surveysData?.data?.surveys ?? surveysData?.data ?? [];

  const { mutateAsync: createSurvey, isPending: creatingLoading } =
    useCreateSurvey();
  const { mutateAsync: deleteSurvey } = useDeleteSurvey();

  const handleCreate = async () => {
    if (!newSurveyName.trim() || !selectedCampaignId) return;
    const res = await createSurvey({
      campaignId: selectedCampaignId,
      surveyName: newSurveyName.trim(),
      triggerEvent: newTrigger,
      isRequired: false,
      isActive: true,
    });
    const newId = res?.data?.survey?.id ?? res?.data?.id;
    if (newId) setSelectedSurveyId(newId);
    setNewSurveyName("");
    setCreating(false);
  };

  const handleDelete = async (surveyId) => {
    if (!confirm("Delete this survey? This cannot be undone.")) return;
    await deleteSurvey({ campaignId: selectedCampaignId, surveyId });
    if (selectedSurveyId === surveyId) setSelectedSurveyId(null);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Top bar */}
      <div className="shrink-0 px-6 py-4 bg-white border-b border-gray-100 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <ClipboardList size={20} className="text-orange-500" />
          <h1 className="font-black text-lg text-gray-800">Survey Manager</h1>
        </div>
        <div className="flex-1 max-w-xs">
          {loadingCampaigns ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 size={14} className="animate-spin" /> Loading campaigns…
            </div>
          ) : (
            <select
              value={selectedCampaignId ?? ""}
              onChange={(e) => {
                setSelectedCampaignId(e.target.value || null);
                setSelectedSurveyId(null);
              }}
              className={selectCls}
            >
              <option value="">— Select campaign —</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.campaignName}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {!selectedCampaignId ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <ClipboardList size={48} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">
              Select a campaign to manage its surveys.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Left — survey list */}
          <div className="w-72 shrink-0 border-r border-gray-100 bg-white flex flex-col overflow-hidden">
            <div className="shrink-0 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <SectionTitle>Surveys</SectionTitle>
              <button
                onClick={() => setCreating((p) => !p)}
                className="flex items-center gap-1 text-xs font-bold text-orange-500 hover:bg-orange-50 rounded-lg px-2 py-1 transition-colors"
              >
                <Plus size={13} /> New
              </button>
            </div>

            {/* Create form */}
            {creating && (
              <div className="px-4 pb-3 border-b border-gray-100 space-y-2">
                <input
                  autoFocus
                  value={newSurveyName}
                  onChange={(e) => setNewSurveyName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  placeholder="Survey name…"
                  className={inputCls}
                />
                <select
                  value={newTrigger}
                  onChange={(e) => setNewTrigger(e.target.value)}
                  className={selectCls}
                >
                  {TRIGGER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreate}
                    disabled={creatingLoading || !newSurveyName.trim()}
                    className={`${btnPrimary} flex-1 justify-center`}
                  >
                    {creatingLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Check size={14} />
                    )}{" "}
                    Create
                  </button>
                  <button
                    onClick={() => setCreating(false)}
                    className={`${btnGhost} flex-1 justify-center`}
                  >
                    <X size={14} /> Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              {loadingSurveys ? (
                <Spinner />
              ) : surveys.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8 px-4">
                  No surveys yet. Create one.
                </p>
              ) : (
                surveys.map((s) => {
                  const active = selectedSurveyId === s.id;
                  const triggerLabel =
                    TRIGGER_OPTIONS.find((t) => t.value === s.triggerEvent)
                      ?.label ?? s.triggerEvent;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSurveyId(s.id)}
                      className="w-full text-left px-4 py-3 border-b border-gray-50 transition-colors hover:bg-orange-50"
                      style={
                        active
                          ? {
                              background: "#fff7ed",
                              borderLeft: "3px solid #f97316",
                            }
                          : { borderLeft: "3px solid transparent" }
                      }
                    >
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {s.surveyName}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-400">
                          {triggerLabel}
                        </span>
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={
                            s.isActive
                              ? { background: "#ecfdf5", color: "#10b981" }
                              : { background: "#f3f4f6", color: "#9ca3af" }
                          }
                        >
                          {s.isActive ? "Active" : "Inactive"}
                        </span>
                        {s.isRequired && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-400">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-300 mt-0.5">
                        {s.questionCount ?? 0} questions ·{" "}
                        {s.responseCount ?? 0} responses
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right — survey detail */}
          <div className="flex-1 overflow-hidden">
            {!selectedSurveyId ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <ClipboardList
                    size={48}
                    className="mx-auto text-gray-200 mb-3"
                  />
                  <p className="text-gray-400 text-sm">
                    Select a survey to edit its questions.
                  </p>
                </div>
              </div>
            ) : (
              <SurveyDetail
                key={selectedSurveyId}
                campaignId={selectedCampaignId}
                surveyId={selectedSurveyId}
                onDelete={handleDelete}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SurveyManager;
