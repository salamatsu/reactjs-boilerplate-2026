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
  getEventApi,
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
  getParticipantProgressApi,
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

export const useGetParticipantProgress = ({ campaignId, participantId }) => {
  return useQuery({
    queryKey: ["participant-progress", campaignId, participantId],
    queryFn: () => getParticipantProgressApi({ campaignId, participantId }),
    enabled: !!campaignId && !!participantId,
  });
};
