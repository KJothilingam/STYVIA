package com.stylediscovery.service;

import com.stylediscovery.entity.BodyProfile;
import org.springframework.stereotype.Component;

/**
 * Deterministic body measurement estimates (cm) from height (cm), weight (kg), and profile modifiers.
 * <p>
 * Base formulas (input units: height cm, weight kg):
 * <ul>
 *   <li>chest = weight * 0.45 + height * 0.25</li>
 *   <li>waist = weight * 0.40 + height * 0.20</li>
 *   <li>shoulder = height * 0.18</li>
 *   <li>length = height * 0.40</li>
 * </ul>
 * BodyShape: SLIM → chest −3%, waist −5%; ATHLETIC → chest +5%, shoulder +4%; HEAVY → waist +8%, chest +4%.
 * ShoulderWidth: NARROW → shoulder −3%; BROAD → shoulder +5%.
 */
@Component
public class BodyMeasurementEstimator {

    public record EstimatedBody(double chestCm, double waistCm, double shoulderCm, double lengthCm) {}

    public EstimatedBody estimate(BodyProfile p) {
        double h = p.getHeightCm();
        double w = p.getWeightKg();

        double chest = w * 0.45 + h * 0.25;
        double waist = w * 0.40 + h * 0.20;
        double shoulder = h * 0.18;
        double length = h * 0.40;

        String shape = safeUpper(p.getBodyShape());
        switch (shape) {
            case "SLIM" -> {
                chest *= 0.97;
                waist *= 0.95;
            }
            case "ATHLETIC" -> {
                chest *= 1.05;
                shoulder *= 1.04;
            }
            case "HEAVY" -> {
                waist *= 1.08;
                chest *= 1.04;
            }
            default -> { /* REGULAR or unknown: no shape modifier */ }
        }

        String sw = safeUpper(p.getShoulderWidth());
        switch (sw) {
            case "NARROW" -> shoulder *= 0.97;
            case "BROAD" -> shoulder *= 1.05;
            default -> { }
        }

        if (p.getChestCm() != null && p.getChestCm() > 0) {
            chest = p.getChestCm();
        }
        if (p.getWaistCm() != null && p.getWaistCm() > 0) {
            waist = p.getWaistCm();
        }
        if (p.getShoulderCm() != null && p.getShoulderCm() > 0) {
            shoulder = p.getShoulderCm();
        }
        if (p.getLengthCm() != null && p.getLengthCm() > 0) {
            length = p.getLengthCm();
        }

        return new EstimatedBody(chest, waist, shoulder, length);
    }

    private static String safeUpper(String s) {
        return s == null ? "" : s.trim().toUpperCase();
    }
}
