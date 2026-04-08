// ============================================
// SCAN2WIN — React Query Hooks
// Worldbex Events "Scan to Win" Platform
//
// All hooks respect USE_MOCK from constants.jsx.
// When mocking, data is returned from MOCK_DATA
// without any network request.
// ============================================

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { USE_MOCK, MOCK_DATA } from "../../lib/constants";
import {
  getCampaignImagesPublicApi,
  getEventApi,
  getEventsListApi,
  getPrizesApi,
  createPrizeApi,
  updatePrizeApi,
  deletePrizeApi,
  updatePrizePoolApi,
  getSurveyQuestionsApi,
  redeemApi,
  getCampaignByEventTagApi,
  generateRaffleQrApi,
  validateRaffleApi,
  spinWheelApi,
  getCampaignPrizesPublicApi,
  listCampaignsApi,
  getCampaignByIdApi,
  createCampaignApi,
  updateCampaignApi,
  deleteCampaignApi,
  getCampaignBoothsApi,
  getBoothByIdApi,
  createBoothApi,
  updateBoothApi,
  deleteBoothApi,
  getCampaignPrizesApi,
  createCampaignPrizeApi,
  updateCampaignPrizeApi,
  deleteCampaignPrizeApi,
  getCampaignImagesApi,
  uploadCampaignImageApi,
  updateCampaignImageApi,
  replaceCampaignImageApi,
  deleteCampaignImageApi,
  getParticipantProgressApi,
  listSurveysApi,
  getSurveyByIdApi,
  createSurveyApi,
  updateSurveyApi,
  deleteSurveyApi,
  createSurveyQuestionApi,
  updateSurveyQuestionApi,
  deleteSurveyQuestionApi,
  createQuestionOptionApi,
  updateQuestionOptionApi,
  deleteQuestionOptionApi,
  createMatrixRowApi,
  updateMatrixRowApi,
  deleteMatrixRowApi,
  listSurveyResponsesApi,
  getSurveyAnalyticsApi,
  getAnalyticsCampaignsOverviewApi,
  getParticipantAnalyticsApi,
  getBoothAnalyticsApi,
  getRaffleQrAnalyticsApi,
  getEntryAnalyticsApi,
  getPrizeAnalyticsApi,
  getFunnelAnalyticsApi,
  exportParticipantsApi,
  exportClaimsApi,
  exportSurveyResponsesApi,
  exportFullApi,
} from "../api/api";

// ============================================
// EVENT — Visitor App
// Fetches event config + interactions list
// ============================================

export const useGetEvent = () => {
  return useQuery({
    queryKey: ["event"],
    queryFn: () => (USE_MOCK ? MOCK_DATA.event : getEventApi()),
  });
};

export const useGetEventsList = () => {
  return useQuery({
    queryKey: ["events-list"],
    queryFn: getEventsListApi,
  });
};

// ============================================
// PRIZES — CMS + Redeem Portal
// ============================================

export const useGetPrizes = () => {
  return useQuery({
    queryKey: ["prizes"],
    queryFn: () => (USE_MOCK ? MOCK_DATA.prizes : getPrizesApi()),
  });
};

export const useCreatePrize = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPrizeApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prizes"] });
    },
  });
};

export const useUpdatePrize = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePrizeApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prizes"] });
    },
  });
};

export const useDeletePrize = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePrizeApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prizes"] });
    },
  });
};

// Bulk-save isPool toggles from the Prize Pool Config page
// Payload: [{ id, isPool }]
export const useUpdatePrizePool = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePrizePoolApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prizes"] });
    },
  });
};

// ============================================
// SURVEY — Redeem Portal (Step 2)
// ============================================

export const useGetSurveyQuestions = () => {
  return useQuery({
    queryKey: ["survey-questions"],
    queryFn: () =>
      USE_MOCK ? MOCK_DATA.surveyQuestions : getSurveyQuestionsApi(),
  });
};

// ============================================
// REDEEM — Redeem Portal (Step 4)
// Submits scan data, survey answers, and prize won
// ============================================

export const useRedeem = () => {
  return useMutation({
    mutationFn: redeemApi,
  });
};

// ============================================
// CAMPAIGN RAFFLE — Participant Flow
// ============================================

export const useGetCampaignImagesPublic = (campaignId) => {
  return useQuery({
    queryKey: ["campaign-images-public", campaignId],
    queryFn: () => getCampaignImagesPublicApi(campaignId),
    enabled: !!campaignId,
  });
};

export const useGetCampaignByEventTag = (eventTag) => {
  return useQuery({
    queryKey: ["campaign", eventTag],
    queryFn: () =>
      USE_MOCK ? MOCK_DATA.campaign : getCampaignByEventTagApi(eventTag),
    enabled: !!eventTag,
  });
};

export const useGenerateRaffleQr = () => {
  return useMutation({
    mutationFn: (vars) =>
      USE_MOCK
        ? Promise.resolve({ success: true, data: MOCK_DATA.raffleQr })
        : generateRaffleQrApi(vars),
  });
};

export const useValidateRaffle = () => {
  return useMutation({
    mutationFn: validateRaffleApi,
  });
};

export const useSpinWheel = () => {
  return useMutation({
    mutationFn: spinWheelApi,
  });
};

export const useGetCampaignPrizesPublic = (campaignId) => {
  return useQuery({
    queryKey: ["campaign-prizes-public", campaignId],
    queryFn: () => getCampaignPrizesPublicApi(campaignId),
    enabled: !!campaignId,
  });
};

// ============================================
// CAMPAIGN MANAGEMENT — Admin CMS
// ============================================

export const useListCampaigns = () => {
  return useQuery({
    queryKey: ["campaigns"],
    queryFn: listCampaignsApi,
  });
};

export const useGetCampaignById = (campaignId) => {
  return useQuery({
    queryKey: ["campaign-detail", campaignId],
    queryFn: () => getCampaignByIdApi(campaignId),
    enabled: !!campaignId,
  });
};

export const useCreateCampaign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCampaignApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
};

export const useUpdateCampaign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCampaignApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
};

export const useDeleteCampaign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCampaignApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
};

export const useGetCampaignBooths = (campaignId) => {
  return useQuery({
    queryKey: ["campaign-booths", campaignId],
    queryFn: () => getCampaignBoothsApi(campaignId),
    enabled: !!campaignId,
  });
};

export const useGetBoothById = ({ campaignId, boothId }) => {
  return useQuery({
    queryKey: ["booth", campaignId, boothId],
    queryFn: () => getBoothByIdApi({ campaignId, boothId }),
    enabled: !!campaignId && !!boothId,
  });
};

export const useCreateBooth = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBoothApi,
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ["campaign-booths", campaignId] });
    },
  });
};

export const useUpdateBooth = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBoothApi,
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ["campaign-booths", campaignId] });
    },
  });
};

export const useDeleteBooth = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBoothApi,
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ["campaign-booths", campaignId] });
    },
  });
};

export const useGetCampaignPrizes = (campaignId) => {
  return useQuery({
    queryKey: ["campaign-prizes", campaignId],
    queryFn: () => getCampaignPrizesApi(campaignId),
    enabled: !!campaignId,
  });
};

export const useCreateCampaignPrize = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCampaignPrizeApi,
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ["campaign-prizes", campaignId] });
    },
  });
};

export const useUpdateCampaignPrize = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCampaignPrizeApi,
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ["campaign-prizes", campaignId] });
    },
  });
};

export const useDeleteCampaignPrize = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCampaignPrizeApi,
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ["campaign-prizes", campaignId] });
    },
  });
};

export const useGetCampaignImages = (campaignId) => {
  return useQuery({
    queryKey: ["campaign-images", campaignId],
    queryFn: () => getCampaignImagesApi(campaignId),
    enabled: !!campaignId,
  });
};

export const useUploadCampaignImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadCampaignImageApi,
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ["campaign-images", campaignId] });
    },
  });
};

export const useUpdateCampaignImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCampaignImageApi,
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ["campaign-images", campaignId] });
    },
  });
};

export const useReplaceCampaignImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: replaceCampaignImageApi,
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ["campaign-images", campaignId] });
    },
  });
};

export const useDeleteCampaignImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCampaignImageApi,
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ["campaign-images", campaignId] });
    },
  });
};

export const useGetParticipantProgress = ({ campaignId, participantId }) => {
  return useQuery({
    queryKey: ["participant-progress", campaignId, participantId],
    queryFn: () => getParticipantProgressApi({ campaignId, participantId }),
    enabled: !!campaignId && !!participantId,
  });
};

// ============================================
// SURVEY MANAGEMENT — Admin CMS
// ============================================

export const useListSurveys = (campaignId) => {
  return useQuery({
    queryKey: ["surveys", campaignId],
    queryFn: () => listSurveysApi(campaignId),
    enabled: !!campaignId,
  });
};

export const useGetSurveyById = ({ campaignId, surveyId }) => {
  return useQuery({
    queryKey: ["survey", campaignId, surveyId],
    queryFn: () => getSurveyByIdApi({ campaignId, surveyId }),
    enabled: !!campaignId && !!surveyId,
  });
};

export const useCreateSurvey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSurveyApi,
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ["surveys", campaignId] });
    },
  });
};

export const useUpdateSurvey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSurveyApi,
    onSuccess: (_, { campaignId, surveyId }) => {
      queryClient.invalidateQueries({ queryKey: ["surveys", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["survey", campaignId, surveyId] });
    },
  });
};

export const useDeleteSurvey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSurveyApi,
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ["surveys", campaignId] });
    },
  });
};

export const useCreateSurveyQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSurveyQuestionApi,
    onSuccess: (_, { campaignId, surveyId }) => {
      queryClient.invalidateQueries({ queryKey: ["survey", campaignId, surveyId] });
    },
  });
};

export const useUpdateSurveyQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSurveyQuestionApi,
    onSuccess: (_, { campaignId, surveyId }) => {
      queryClient.invalidateQueries({ queryKey: ["survey", campaignId, surveyId] });
    },
  });
};

export const useDeleteSurveyQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSurveyQuestionApi,
    onSuccess: (_, { campaignId, surveyId }) => {
      queryClient.invalidateQueries({ queryKey: ["survey", campaignId, surveyId] });
    },
  });
};

export const useCreateQuestionOption = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createQuestionOptionApi,
    onSuccess: (_, { campaignId, surveyId }) => {
      queryClient.invalidateQueries({ queryKey: ["survey", campaignId, surveyId] });
    },
  });
};

export const useUpdateQuestionOption = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateQuestionOptionApi,
    onSuccess: (_, { campaignId, surveyId }) => {
      queryClient.invalidateQueries({ queryKey: ["survey", campaignId, surveyId] });
    },
  });
};

export const useDeleteQuestionOption = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteQuestionOptionApi,
    onSuccess: (_, { campaignId, surveyId }) => {
      queryClient.invalidateQueries({ queryKey: ["survey", campaignId, surveyId] });
    },
  });
};

export const useCreateMatrixRow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMatrixRowApi,
    onSuccess: (_, { campaignId, surveyId }) => {
      queryClient.invalidateQueries({ queryKey: ["survey", campaignId, surveyId] });
    },
  });
};

export const useUpdateMatrixRow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMatrixRowApi,
    onSuccess: (_, { campaignId, surveyId }) => {
      queryClient.invalidateQueries({ queryKey: ["survey", campaignId, surveyId] });
    },
  });
};

export const useDeleteMatrixRow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMatrixRowApi,
    onSuccess: (_, { campaignId, surveyId }) => {
      queryClient.invalidateQueries({ queryKey: ["survey", campaignId, surveyId] });
    },
  });
};

export const useListSurveyResponses = ({ campaignId, surveyId }) => {
  return useQuery({
    queryKey: ["survey-responses", campaignId, surveyId],
    queryFn: () => listSurveyResponsesApi({ campaignId, surveyId }),
    enabled: !!campaignId && !!surveyId,
  });
};

export const useGetSurveyAnalytics = ({ campaignId, surveyId }) => {
  return useQuery({
    queryKey: ["survey-analytics", campaignId, surveyId],
    queryFn: () => getSurveyAnalyticsApi({ campaignId, surveyId }),
    enabled: !!campaignId && !!surveyId,
  });
};

// ============================================
// G. Admin — Analytics
// ============================================

export const useAnalyticsCampaignsOverview = () => {
  return useQuery({
    queryKey: ["analytics-campaigns-overview"],
    queryFn: getAnalyticsCampaignsOverviewApi,
  });
};

export const useParticipantAnalytics = (campaignId) => {
  return useQuery({
    queryKey: ["analytics-participants", campaignId],
    queryFn: () => getParticipantAnalyticsApi(campaignId),
    enabled: !!campaignId,
  });
};

export const useBoothAnalytics = (campaignId) => {
  return useQuery({
    queryKey: ["analytics-booths", campaignId],
    queryFn: () => getBoothAnalyticsApi(campaignId),
    enabled: !!campaignId,
  });
};

export const useRaffleQrAnalytics = (campaignId) => {
  return useQuery({
    queryKey: ["analytics-raffle-qrs", campaignId],
    queryFn: () => getRaffleQrAnalyticsApi(campaignId),
    enabled: !!campaignId,
  });
};

export const useEntryAnalytics = (campaignId) => {
  return useQuery({
    queryKey: ["analytics-entries", campaignId],
    queryFn: () => getEntryAnalyticsApi(campaignId),
    enabled: !!campaignId,
  });
};

export const usePrizeAnalytics = (campaignId) => {
  return useQuery({
    queryKey: ["analytics-prizes", campaignId],
    queryFn: () => getPrizeAnalyticsApi(campaignId),
    enabled: !!campaignId,
  });
};

export const useFunnelAnalytics = (campaignId) => {
  return useQuery({
    queryKey: ["analytics-funnel", campaignId],
    queryFn: () => getFunnelAnalyticsApi(campaignId),
    enabled: !!campaignId,
  });
};

// ============================================
// EXPORT — Admin CMS (mutations — trigger download on demand)
// ============================================

export const useExportParticipants = () =>
  useMutation({ mutationFn: exportParticipantsApi });

export const useExportClaims = () =>
  useMutation({ mutationFn: exportClaimsApi });

export const useExportSurveyResponses = () =>
  useMutation({ mutationFn: exportSurveyResponsesApi });

export const useExportFull = () =>
  useMutation({ mutationFn: exportFullApi });
