package com.stylediscovery.service;

import com.stylediscovery.config.MlFitProperties;
import com.stylediscovery.entity.FitTrainingData;
import com.stylediscovery.exception.BadRequestException;
import com.stylediscovery.enums.FitFeedbackType;
import com.stylediscovery.repository.FitTrainingDataRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MlTrainingOrchestratorService {

    private static final Logger log = LoggerFactory.getLogger(MlTrainingOrchestratorService.class);
    private static final int MIN_ROWS = 12;

    private final FitTrainingDataRepository fitTrainingDataRepository;
    private final MlFitClient mlFitClient;
    private final MlFitProperties mlFitProperties;
    private final CatalogCacheEvictionService catalogCacheEvictionService;

    @Transactional(readOnly = true)
    public Map<String, Object> exportAndTrainRemote() {
        if (!mlFitProperties.isEnabled()) {
            throw new BadRequestException("ML integration is disabled (app.ml.enabled=false).");
        }
        List<FitTrainingData> labeled = fitTrainingDataRepository.findAllWithLabel();
        List<Map<String, Object>> rows = new ArrayList<>();
        for (FitTrainingData f : labeled) {
            Integer goodFit = deriveGoodFitLabel(f);
            if (goodFit == null) {
                continue;
            }
            Map<String, Object> m = new HashMap<>();
            m.put("height", f.getHeight());
            m.put("weight", f.getWeight());
            m.put("bodyShape", nullToStr(f.getBodyShape()));
            m.put("shoulderType", nullToStr(f.getShoulderType()));
            m.put("fitPreference", nullToStr(f.getFitPreference()));
            m.put("productChest", f.getChest());
            m.put("productWaist", f.getWaist());
            m.put("productShoulder", f.getShoulder());
            m.put("stretchLevel", nullToStr(f.getStretchLevel()));
            m.put("size", nullToStr(f.getSelectedSize()).toUpperCase());
            m.put("good_fit", goodFit);
            rows.add(m);
        }
        if (rows.size() < MIN_ROWS) {
            throw new BadRequestException(
                    "Need at least " + MIN_ROWS + " labeled training rows; currently " + rows.size()
                            + ". Collect more orders, feedback, or returns.");
        }
        log.info("Triggering remote ML training with {} rows", rows.size());
        var res = mlFitClient.trainModel(rows);
        catalogCacheEvictionService.evictAllFitConfidence();
        Map<String, Object> out = new HashMap<>();
        out.put("message", res.getMessage());
        out.put("accuracy", res.getAccuracy());
        out.put("modelPath", res.getModelPath());
        out.put("nTrain", res.getNTrain());
        out.put("nTest", res.getNTest());
        out.put("rowsSent", rows.size());
        return out;
    }

    private static Integer deriveGoodFitLabel(FitTrainingData f) {
        if (f.isReturned()) {
            return 0;
        }
        if (f.getFeedback() == null) {
            return null;
        }
        if (f.getFeedback() == FitFeedbackType.PERFECT) {
            return 1;
        }
        if (f.getFeedback() == FitFeedbackType.TIGHT || f.getFeedback() == FitFeedbackType.LOOSE) {
            return 0;
        }
        return null;
    }

    private static String nullToStr(String s) {
        return s == null ? "" : s.trim().toUpperCase();
    }
}
