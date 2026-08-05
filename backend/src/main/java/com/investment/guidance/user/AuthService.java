package com.investment.guidance.user;

import com.investment.guidance.exception.BadRequestException;
import com.investment.guidance.security.JwtUtil;
import com.investment.guidance.user.dto.AuthRequest;
import com.investment.guidance.user.dto.AuthResponse;
import com.investment.guidance.user.dto.RegisterRequest;
import com.investment.guidance.user.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered");
        }
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.USER);
        user = userRepository.save(user);
        String token = jwtUtil.generateToken(user.getEmail());
        return new AuthResponse(token, "Bearer");
    }

    public AuthResponse login(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        String token = jwtUtil.generateToken(request.getEmail());
        return new AuthResponse(token, "Bearer");
    }

    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() ->
                new BadRequestException("User not found"));
        return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getRole().name(), user.getCreatedAt());
    }
}
