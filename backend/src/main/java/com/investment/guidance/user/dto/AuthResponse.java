package com.investment.guidance.user.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class AuthResponse {
    private String token;
    private String type;

    public AuthResponse(String token) {
        this.token = token;
        this.type = "Bearer";
    }

    public AuthResponse(String token, String type) {
        this.token = token;
        this.type = type != null ? type : "Bearer";
    }
}
