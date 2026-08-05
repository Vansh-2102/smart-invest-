package com.investment.guidance.ai;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

@Service
public class MLServiceClient {

    @Value("${ai.ml-service-url}")
    private String mlServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final TypeReference<Map<String, Object>> mapTypeRef = new TypeReference<>() {};

    public Map<String, Object> assessRisk(Map<String, Object> userProfile) {
        String url = mlServiceUrl + "/api/risk/assess";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(userProfile, headers);
        ResponseEntity<JsonNode> response = restTemplate.postForEntity(url, entity, JsonNode.class);
        JsonNode root = response.getBody();
        if (root != null && root.has("data")) {
            return objectMapper.convertValue(root.get("data"), mapTypeRef);
        }
        throw new RuntimeException("Error getting risk assessment from ML service");
    }

    public Map<String, Object> getRecommendations(String riskLevel, BigDecimal amount) {
        String url = mlServiceUrl + "/api/investment/recommend";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        Map<String, Object> request = new HashMap<>();
        request.put("risk_level", normalizeRiskLevel(riskLevel));
        request.put("investment_amount", amount);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);
        ResponseEntity<JsonNode> response = restTemplate.postForEntity(url, entity, JsonNode.class);
        JsonNode root = response.getBody();
        if (root != null && root.has("data")) {
            return objectMapper.convertValue(root.get("data"), mapTypeRef);
        }
        throw new RuntimeException("Error getting recommendations from ML service");
    }

    public Map<String, Object> chat(String message) {
        String url = mlServiceUrl + "/api/chat";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        Map<String, Object> request = new HashMap<>();
        request.put("query", message);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);
        ResponseEntity<JsonNode> response = restTemplate.postForEntity(url, entity, JsonNode.class);
        JsonNode root = response.getBody();
        if (root != null && root.has("data")) {
            return objectMapper.convertValue(root.get("data"), mapTypeRef);
        }
        throw new RuntimeException("Error getting chat response from ML service");
    }

    public Map<String, Object> analyzeMarket(String ticker, String period) {
        String url = mlServiceUrl + "/api/market/analyze/" + ticker + "?period=" + period;
        ResponseEntity<JsonNode> response = restTemplate.getForEntity(url, JsonNode.class);
        JsonNode root = response.getBody();
        if (root != null && root.has("data")) {
            return objectMapper.convertValue(root.get("data"), mapTypeRef);
        }
        throw new RuntimeException("Error getting market analysis from ML service");
    }


    private String normalizeRiskLevel(String riskLevel) {
        if (riskLevel == null || riskLevel.isBlank()) {
            return "moderate";
        }

        return switch (riskLevel.trim().toUpperCase(Locale.ROOT)) {
            case "LOW", "CONSERVATIVE" -> "conservative";
            case "HIGH", "VERY_HIGH", "AGGRESSIVE" -> "aggressive";
            case "MEDIUM", "MODERATE" -> "moderate";
            default -> riskLevel.trim().toLowerCase(Locale.ROOT);
        };
    }
}
