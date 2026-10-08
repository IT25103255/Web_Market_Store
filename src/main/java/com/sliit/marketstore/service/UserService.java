package com.sliit.marketstore.service;
import com.sliit.marketstore.entity.User;
import java.util.List;
public interface UserService {
    List<User> getAll();
    User register(User user);
    User login(String email, String password);
    User update(Integer id, User user);
    void delete(Integer id);
}
