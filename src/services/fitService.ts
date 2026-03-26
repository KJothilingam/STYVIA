import api from './api';
import { Product } from '@/types';

export interface MeasurementPoint {
  body: number;
  garment: number;
  diffPercent: number;
  rawDiffPercent: number;
  status: string;
  weight: number;
  dimensionScore: number;
}

export interface SizeMeasurementsBreakdown {
  chest?: MeasurementPoint | null;
  shoulder?: MeasurementPoint | null;
  waist?: MeasurementPoint | null;
  length?: MeasurementPoint | null;
}

export interface SizeScoreBreakdown {
  size: string;
  score: number;
  ruleScore?: number;
  mlScore?: number;
  finalScore?: number;
  hybridExplanation?: string;
  baseScore?: number;
  intelligenceFeedbackDelta?: number;
  intelligenceReturnDelta?: number;
  intelligenceUsageDelta?: number;
  reason: string;
  measurements?: SizeMeasurementsBreakdown;
}

export interface SizeFitSuggestion {
  size: string;
  confidence: number;
  note: string;
}

export interface MeasureBar {
  body: number;
  garment: number;
  diffPercent: number;
  rawDiffPercent: number;
  status: string;
  weight: number;
  dimensionScore: number;
  rangeMinCm: number;
  rangeMaxCm: number;
}

export interface MeasurementComparison {
  chest?: MeasureBar | null;
  shoulder?: MeasureBar | null;
  waist?: MeasureBar | null;
  length?: MeasureBar | null;
}

export interface FitConfidenceResponse {
  recommendedSize: string | null;
  confidence: number;
  explanation: string;
  intelligenceExplanations?: string[];
  breakdown?: SizeScoreBreakdown[];
  allSizes: SizeFitSuggestion[];
  whyThisSizeReasons?: string[];
  measurementComparison?: MeasurementComparison;
}

export interface OutfitItem {
  product: Product;
  suggestedSize: string;
  fitConfidence: number;
  categoryRole: string;
}

export interface OutfitRecommendationDTO {
  anchorProduct: Product;
  items: OutfitItem[];
  occasion: string;
  colorHarmonyNote: string;
  overallConfidence?: number;
  filteringNote?: string;
}

const fitService = {
  async getFitConfidence(productId: number): Promise<FitConfidenceResponse> {
    const res = await api.get<{ data: FitConfidenceResponse }>(`/products/${productId}/fit-confidence`);
    return res.data.data;
  },

  async getOutfitRecommendation(productId: number): Promise<OutfitRecommendationDTO> {
    const res = await api.get<{ data: OutfitRecommendationDTO }>(`/products/${productId}/outfit`);
    return res.data.data;
  },
};

export default fitService;
