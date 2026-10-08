package com.sliit.marketstore.config;

import com.sliit.marketstore.entity.User;
import com.sliit.marketstore.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataLoader implements CommandLineRunner {
    private final UserRepository users;
    private final PasswordEncoder encoder;

    public DataLoader(UserRepository users, PasswordEncoder encoder) {
        this.users = users;
        this.encoder = encoder;
    }

    @Override
    public void run(String... args) {
        ensureUser("Market Administrator", "admin@market.lk", "admin123", "ADMIN");
        ensureUser("Demo Customer", "customer@market.lk", "user123", "CUSTOMER");
        ensureUser("Nimal Perera", "nimal@market.lk", "user123", "CUSTOMER");
        ensureUser("Kavindi Silva", "kavindi@market.lk", "user123", "CUSTOMER");
        ensureUser("Sahan Fernando", "sahan@market.lk", "user123", "CUSTOMER");
    }

    private void ensureUser(String name, String email, String password, String role) {
        if (users.existsByEmailIgnoreCase(email)) return;
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(encoder.encode(password));
        user.setRole(role);
        users.save(user);
    }
}
