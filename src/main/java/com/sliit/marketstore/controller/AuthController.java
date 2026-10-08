package com.sliit.marketstore.controller;

import com.sliit.marketstore.dto.LoginRequest;
import com.sliit.marketstore.entity.User;
import com.sliit.marketstore.service.UserService;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/auth")
public class AuthController {
    private final UserService users;
    public AuthController(UserService users) { this.users = users; }
    @PostMapping("/login") public User login(@RequestBody LoginRequest request) { return users.login(request.getEmail(), request.getPassword()); }
    @PostMapping("/register") public User register(@RequestBody User user) { return users.register(user); }
}
