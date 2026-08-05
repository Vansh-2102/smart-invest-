package com.investment.guidance.chat;

import com.investment.guidance.chat.dto.ChatRequest;
import com.investment.guidance.user.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Tag(name = "Chat", description = "AI chatbot endpoints")
public class ChatController {

    private final ChatService service;
    private final UserRepository userRepository;

    @PostMapping
    @Operation(summary = "Send message to AI chatbot")
    public ResponseEntity<ChatMessage> sendMessage(@Valid @RequestBody ChatRequest request, Authentication authentication) {
        UUID userId = userRepository.findByEmail(authentication.getName()).orElseThrow().getId();
        return ResponseEntity.ok(service.sendMessage(userId, request.getMessage()));
    }

    @GetMapping("/history")
    @Operation(summary = "Get chat history")
    public ResponseEntity<List<ChatMessage>> getHistory(@RequestParam(defaultValue = "50") int limit, Authentication authentication) {
        UUID userId = userRepository.findByEmail(authentication.getName()).orElseThrow().getId();
        return ResponseEntity.ok(service.getHistory(userId, limit));
    }
}
