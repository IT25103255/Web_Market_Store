package com.sliit.marketstore.controller;

import com.sliit.marketstore.entity.User;
import com.sliit.marketstore.service.UserService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/users")
public class UserController {
    private final UserService service;
    public UserController(UserService service) { this.service = service; }
    @GetMapping public List<User> all() { return service.getAll(); }
    @PutMapping("/{id}") public User update(@PathVariable Integer id, @RequestBody User user) { return service.update(id, user); }
    @DeleteMapping("/{id}") public void delete(@PathVariable Integer id) { service.delete(id); }
}
