package com.investment.guidance.chat;

import com.investment.guidance.ai.MLServiceClient;
import com.investment.guidance.user.User;
import com.investment.guidance.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class ChatService {

    private final ChatMessageRepository repository;
    private final UserRepository userRepository;
    private final MLServiceClient mlServiceClient;

    public ChatMessage sendMessage(UUID userId, String content) {
        User user = userRepository.findById(userId).orElseThrow(() ->
                new RuntimeException("User not found"));
        ChatMessage userMsg = new ChatMessage();
        userMsg.setUser(user);
        userMsg.setContent(content);
        userMsg.setType(MessageType.USER);
        repository.save(userMsg);

        Map<String, Object> chatResponse = mlServiceClient.chat(content);
        ChatMessage aiMsg = new ChatMessage();
        aiMsg.setUser(user);
        aiMsg.setContent((String) chatResponse.get("answer"));
        aiMsg.setType(MessageType.AI);
        return repository.save(aiMsg);
    }

    public List<ChatMessage> getHistory(UUID userId, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return repository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }
}
