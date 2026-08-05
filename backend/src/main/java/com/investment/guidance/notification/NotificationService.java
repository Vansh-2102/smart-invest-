package com.investment.guidance.notification;

import com.investment.guidance.exception.ResourceNotFoundException;
import com.investment.guidance.user.User;
import com.investment.guidance.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class NotificationService {

    private final NotificationRepository repository;
    private final UserRepository userRepository;

    public Notification create(UUID userId, String title, String message, NotificationType type) {
        User user = userRepository.findById(userId).orElseThrow(() ->
                new ResourceNotFoundException("User not found"));
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        return repository.save(notification);
    }

    public List<Notification> getByUserId(UUID userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<Notification> getUnreadByUserId(UUID userId) {
        return repository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
    }

    public Notification markAsRead(UUID id, UUID userId) {
        Notification notification = repository.findById(id).orElseThrow(() ->
                new ResourceNotFoundException("Notification not found"));
        if (!notification.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Notification not found");
        }
        notification.setIsRead(true);
        return repository.save(notification);
    }

    public void markAllAsRead(UUID userId) {
        List<Notification> notifications = getUnreadByUserId(userId);
        notifications.forEach(n -> n.setIsRead(true));
        repository.saveAll(notifications);
    }
}
