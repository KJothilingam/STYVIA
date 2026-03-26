import api from './api';

export interface LifecycleItemInsight {
  wardrobeItemId: number;
  productId: number;
  productName: string;
  baselineFitConfidence: number;
  simulatedFitNow: number;
  monthsOwned: number;
  wearCount: number;
  wearFrequencyLabel: string;
  narrative: string;
}

export interface LifecycleInsightsDTO {
  items: LifecycleItemInsight[];
}

const lifecycleService = {
  async getInsights(): Promise<LifecycleInsightsDTO> {
    const res = await api.get<{ data: LifecycleInsightsDTO }>('/lifecycle/insights');
    return res.data.data ?? { items: [] };
  },
};

export default lifecycleService;
