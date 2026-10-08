package com.sliit.marketstore.service.impl;

import com.sliit.marketstore.entity.User;
import com.sliit.marketstore.exception.BadRequestException;
import com.sliit.marketstore.exception.ResourceNotFoundException;
import com.sliit.marketstore.repository.UserRepository;
import com.sliit.marketstore.service.UserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class UserServiceImpl implements UserService {
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    public UserServiceImpl(UserRepository users, PasswordEncoder passwordEncoder) { this.users = users; this.passwordEncoder = passwordEncoder; }
    public List<User> getAll() { return users.findAll(); }
    public User register(User user) {
        if (user.getEmail() == null || user.getEmail().isBlank()) throw new BadRequestException("Email is required.");
        if (users.existsByEmailIgnoreCase(user.getEmail())) throw new BadRequestException("An account with this email already exists.");
        if (user.getPassword() == null || user.getPassword().length() < 4) throw new BadRequestException("Password must contain at least 4 characters.");
        user.setId(null); user.setRole("CUSTOMER"); user.setPassword(passwordEncoder.encode(user.getPassword())); return users.save(user);
    }
    public User login(String email, String password) {
        User u = users.findByEmailIgnoreCase(email).orElseThrow(() -> new BadRequestException("Invalid email or password."));
        String stored = u.getPassword();
        boolean ok = stored != null && (stored.startsWith("$2") ? passwordEncoder.matches(password, stored) : stored.equals(password));
        if (!ok) throw new BadRequestException("Invalid email or password.");
        return u;
    }
    public User update(Integer id, User incoming) {
        User u = users.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        if (incoming.getName() != null && !incoming.getName().isBlank()) u.setName(incoming.getName());
        if (incoming.getRole() != null && (incoming.getRole().equalsIgnoreCase("ADMIN") || incoming.getRole().equalsIgnoreCase("CUSTOMER"))) u.setRole(incoming.getRole().toUpperCase());
        return users.save(u);
    }
    public void delete(Integer id) { users.delete(users.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found: " + id))); }
}
