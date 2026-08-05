package com.investment.guidance.notification;

import com.investment.guidance.user.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Notification management endpoints")
public class NotificationController {

    private final NotificationService service;
    private final UserRepository userRepository;

    @GetMapping
    @Operation(summary = "Get user's notifications")
    public ResponseEntity<List<Notification>> getAll(Authentication authentication) {
        UUID userId = userRepository.findByEmail(authentication.getName()).orElseThrow().getId();
        return ResponseEntity.ok(service.getByUserId(userId));
    }

    @GetMapping("/unread")
    @Operation(summary = "Get user's unread notifications")
    public ResponseEntity<List<Notification>> getUnread(Authentication authentication) {
        UUID userId = userRepository.findByEmail(authentication.getName()).orElseThrow().getId();
        return ResponseEntity.ok(service.getUnreadByUserId(userId));
    }

    @PutMapping("/{id}/read")
    @Operation(summary = "Mark a notification as read")
    public ResponseEntity<Notification> markRead(@PathVariable UUID id, Authentication authentication) {
        UUID userId = userRepository.findByEmail(authentication.getName()).orElseThrow().getId();
        return ResponseEntity.ok(service.markAsRead(id, userId));
    }

    @PutMapping("/read-all")
    @Operation(summary = "Mark all notifications as read")
    public ResponseEntity<Void> markAllRead(Authentication authentication) {
        UUID userId = userRepository.findByEmail(authentication.getName()).orElseThrow().getId();
        service.markAllAsRead(userId);
        return ResponseEntity.noContent().build();
    }
}
